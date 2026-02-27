from flask import Flask, render_template, request, jsonify, session
import google.generativeai as genai
import json
import os
import dotenv
import cloudinary
import cloudinary.uploader
from pdf2image import convert_from_bytes
import io
import requests
from gradio_client import Client, handle_file
from flask_cors import CORS

dotenv.load_dotenv()

app = Flask(__name__)
app.secret_key = "super-secret-key"
CORS(app)

# ── Gemini SDK (for interview simulation) ────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

# ── Gemini REST (for CV parsing + question generation) ───────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET"),
)

# ── Gradio OCR model ──────────────────────────────────────────────────────────
gradio_client = Client("CohereLabs/command-a-vision")

# ── Shared interview store (accessible by all clients — browser + Postman) ───
# Questions written here by /cv or /upload-questions are picked up by the
# browser's polling loop automatically, no session cookie mismatch.
interview_store = {
    "questions_content": "",
    "questions_for_gemini": "",  # kept for Gemini context, never cleared until interview ends
    "conversation": [],
    "evaluation": None,
    "active": False  # True only while interview is running
}


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def read_file_safe(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def append_to_log(question_num, question, answer):
    with open("interview_log.txt", "a", encoding="utf-8") as log:
        log.write(f"[Q{question_num}]\n")
        log.write(f"Q: {question}\n")
        log.write(f"A: {answer}\n\n")


def call_gemini_rest(prompt):
    """Gemini via raw REST — used for CV parsing & question generation."""
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }
    payload = {"contents": [{"role": "user", "parts": [{"text": prompt}]}]}
    response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        print("Gemini REST error:", response.text)
        response.raise_for_status()
    return response.json()


def ask_gemini_sdk(conversation_history: list, questions_content: str, log_content: str) -> dict:
    """Gemini via SDK — used for live interview simulation."""
    transcript = ""
    for turn in conversation_history:
        transcript += f"Interviewer: {turn['question']}\nCandidate: {turn['answer']}\n\n"

    prompt = f"""
You are an experienced HR interviewer conducting a real spoken job interview.

--- QUESTION BANK (ask questions ONLY from this list) ---
{questions_content}
--- END OF QUESTION BANK ---

--- PREVIOUS INTERVIEW LOG ---
{log_content if log_content else "No previous sessions."}
--- END OF LOG ---

--- CURRENT INTERVIEW TRANSCRIPT ---
{transcript if transcript else "The interview has just started. Greet the candidate and ask your first question."}
--- END OF TRANSCRIPT ---

INSTRUCTIONS:
- Use questions ONLY from the question bank above. Do not invent questions outside it.
- After each answer, respond naturally: briefly acknowledge in one sentence, then ask the next question from the bank.
- If an answer is too vague or short, probe deeper on the same question before moving on.
- No scores, ratings, or structured feedback — just speak like a real human interviewer.
- After all questions are covered, close the interview warmly.
- IMPORTANT: If the candidate says anything like "end the interview", "stop", "that's all", "finish", "I want to end", "let's stop" — treat it as a request to end and set interview_complete to true with a warm closing message. Do NOT keep asking questions.
- Your reply will be spoken aloud, so keep it natural and conversational.

Return ONLY valid JSON, no markdown:
{{
  "interviewer_reply": "Your full spoken response — brief acknowledgment + next question (or warm closing if done)",
  "next_question": "The question portion only for session tracking (empty string if closing)",
  "interview_complete": false
}}
    """

    response = model.generate_content(prompt)
    raw = response.text.strip().replace("```json", "").replace("```", "").strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "interviewer_reply": "Thanks for that. Can you walk me through a challenging project you've worked on?",
            "next_question": "Can you walk me through a challenging project you've worked on?",
            "interview_complete": False
        }


# ─────────────────────────────────────────────────────────────────────────────
# Frontend
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("interview.html")


# ─────────────────────────────────────────────────────────────────────────────
# CV PARSING + QUESTION GENERATION
#
# POST /cv
# Form-data:
#   file        → PDF or image of the resume
#   role_id     → target job role (e.g. "Backend Engineer")
#   prompt      → any extra context / FAQ hints
#
# What it does:
#   1. Uploads CV to Cloudinary
#   2. Sends to Gradio OCR to extract resume text
#   3. Sends resume text + role to Gemini to generate interview questions
#   4. Saves generated questions into interview_store (browser auto-picks up)
#
# Returns: { "status": "ok", "question_count": 8 }
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/cv", methods=["POST"])
def cv():
    file = request.files.get("file")
    role = request.form.get("role_id")
    frontend_prompt = request.form.get("prompt")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    if not role:
        return jsonify({"error": "No role provided"}), 400
    if not frontend_prompt:
        return jsonify({"error": "No prompt provided"}), 400

    uploaded_urls = []

    # Step 1: Upload CV to Cloudinary
    try:
        if file.filename.lower().endswith(".pdf"):
            images = convert_from_bytes(file.read(), dpi=300)
            for image in images:
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format="JPEG")
                img_byte_arr.seek(0)
                result = cloudinary.uploader.upload(
                    img_byte_arr, resource_type="image", folder="cv_uploads"
                )
                uploaded_urls.append(result["secure_url"])
        else:
            img_byte_arr = io.BytesIO()
            file.save(img_byte_arr)
            img_byte_arr.seek(0)
            result = cloudinary.uploader.upload(
                img_byte_arr, resource_type="image", folder="cv_uploads"
            )
            uploaded_urls.append(result["secure_url"])
    except Exception as e:
        return jsonify({"error": f"File upload failed: {str(e)}"}), 500

    # Step 2: OCR the CV via Gradio
    try:
        ocr_result = gradio_client.predict(
            message={
                "text": """
                You are an expert resume parser. Do not include any explanations, Markdown formatting,
                backticks or /n /u for new line and underline. Return the raw text only in clean and
                organised way. Extract: Name, career objective, skills, experience, education,
                certifications, projects, achievements, and any other information.
                """,
                "files": [handle_file(uploaded_urls[0])],
            },
            api_name="/chat",
        )
        print("OCR result:", ocr_result)
    except Exception as e:
        return jsonify({"error": f"OCR failed: {str(e)}"}), 500

    # Step 3: Generate interview questions via Gemini REST
    try:
        prompt = f"""
You are an experienced recruiter. Generate interview questions based on the candidate's resume and target role.
Return only structured questions. No explanation. No markdown. No backticks.
Return strictly valid JSON in this exact format:

{{
  "questions": "1. Tell me about yourself.\\n2. What is your greatest strength?\\n3. ..."
}}

Additional Context:
{frontend_prompt}

Target Role:
{role}

Candidate Resume:
{ocr_result}
        """
        gemini_response = call_gemini_rest(prompt)
        raw_text = gemini_response['candidates'][0]['content']['parts'][0]['text']

        # Clean and parse the JSON
        clean = raw_text.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean)
        questions_content = parsed.get("questions", "").strip()

        if not questions_content:
            return jsonify({"error": "Gemini returned no questions"}), 500

        # Step 4: Store in interview_store — browser will auto-detect and start
        interview_store["questions_content"] = questions_content
        interview_store["questions_for_gemini"] = questions_content  # preserved for Gemini

        question_count = len([l for l in questions_content.splitlines() if l.strip()])
        return jsonify({"status": "ok", "question_count": question_count}), 200

    except Exception as e:
        print("Gemini error:", e)
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# MANUAL QUESTION UPLOAD (alternative to /cv — send plain text questions)
#
# POST /upload-questions
# { "questions": "1. Tell me about yourself.\n2. What is your strength?" }
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/upload-questions", methods=["POST"])
def upload_questions():
    data = request.get_json(silent=True) or {}
    questions_content = data.get("questions", "").strip()

    if not questions_content:
        return jsonify({"error": 'No questions provided. Send { "questions": "..." }'}), 400

    interview_store["questions_content"] = questions_content
    interview_store["questions_for_gemini"] = questions_content

    question_count = len([l for l in questions_content.splitlines() if l.strip()])
    return jsonify({"status": "ok", "question_count": question_count})


# ─────────────────────────────────────────────────────────────────────────────
# POLLING — browser checks this every 3s to know when to auto-start
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/questions-status", methods=["GET"])
def questions_status():
    questions_content = interview_store.get("questions_content", "").strip()
    if questions_content:
        question_count = len([l for l in questions_content.splitlines() if l.strip()])
        return jsonify({"ready": True, "question_count": question_count})
    return jsonify({"ready": False})


# ─────────────────────────────────────────────────────────────────────────────
# START INTERVIEW — called automatically by browser after polling confirms ready
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/start", methods=["POST"])
def start_interview():
    questions_content = interview_store.get("questions_content", "").strip()
    if not questions_content:
        return jsonify({"error": "No questions loaded. Call POST /cv or /upload-questions first."}), 400

    # Clear questions_content so polling returns ready:false — prevents restart
    # But keep questions_for_gemini so /answer can still use it
    interview_store["questions_content"] = ""
    interview_store["active"] = True

    session["conversation"] = []
    session["question_count"] = 0
    interview_store["conversation"] = []
    interview_store["evaluation"] = None

    log_content = read_file_safe("interview_log.txt")
    result = ask_gemini_sdk([], questions_content, log_content)

    first_reply = result.get("interviewer_reply", "Welcome! Let's begin. Tell me about yourself.")
    session["current_question"] = result.get("next_question", first_reply)
    session["question_count"] = 1

    return jsonify({"reply": first_reply})


# ─────────────────────────────────────────────────────────────────────────────
# ANSWER — browser sends each spoken answer here during the interview
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/answer", methods=["POST"])
def handle_answer():
    try:
        user_answer = request.json.get("answer", "").strip()
        if not user_answer:
            return jsonify({
                "completed": False,
                "reply": "I didn't quite catch that — could you please repeat your answer?"
            })

        # Use questions_for_gemini (never cleared during interview)
        questions_content = interview_store.get("questions_for_gemini", "")

        # Only block if interview is explicitly marked inactive
        if not interview_store.get("active", False):
            return jsonify({"completed": True, "reply": "The interview has already ended. Thank you!"})
        log_content = read_file_safe("interview_log.txt")

        current_question = session.get("current_question", "")
        conversation = session.get("conversation", [])

        conversation.append({"question": current_question, "answer": user_answer})
        session["conversation"] = conversation
        interview_store["conversation"] = conversation  # mirror to store for /evaluate
        append_to_log(session.get("question_count", 1), current_question, user_answer)

        result = ask_gemini_sdk(conversation, questions_content, log_content)

        interviewer_reply = result.get("interviewer_reply", "Thank you. Let's continue.")
        interview_complete = result.get("interview_complete", False)
        next_question = result.get("next_question", "")

        if interview_complete or not next_question:
            interview_store["active"] = False  # mark done so further answers are blocked
            return jsonify({"completed": True, "reply": interviewer_reply})

        session["current_question"] = next_question
        session["question_count"] = session.get("question_count", 1) + 1

        return jsonify({"completed": False, "reply": interviewer_reply})

    except Exception as e:
        print("ERROR:", e)
        import traceback
        traceback.print_exc()
        return jsonify({
            "completed": False,
            "reply": "Let's keep going. Can you describe your biggest professional achievement?"
        })


# ─────────────────────────────────────────────────────────────────────────────
# EVALUATE — called by frontend after interview completes
# Reads the full conversation from session, sends to Gemini for deep evaluation
# Returns structured feedback that maps directly to FeedbackPage variables
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        # Read from interview_store so it works regardless of session cookie
        conversation = interview_store.get("conversation", [])
        if not conversation:
            # Fallback to session
            conversation = session.get("conversation", [])
        if not conversation:
            return jsonify({"error": "No conversation found to evaluate."}), 400

        # Build full transcript string for Gemini
        transcript_text = ""
        for i, turn in enumerate(conversation, 1):
            transcript_text += f"Q{i}: {turn['question']}\nA{i}: {turn['answer']}\n\n"

        prompt = f"""
You are an expert HR evaluator and career coach. Evaluate this job interview transcript thoroughly.

--- INTERVIEW TRANSCRIPT ---
{transcript_text}
--- END OF TRANSCRIPT ---

Analyze the candidate's performance across all answers. Be specific, honest, and constructive.

Return ONLY valid JSON, no markdown, no backticks:
{{
  "overall_score": 78,
  "verdict": "GOOD EFFORT",
  "summary": "One sentence overall summary of the candidate's performance.",
  "duration_minutes": 15,
  "score_categories": [
    {{ "label": "Communication", "score": 80, "desc": "Specific observation about how they communicated" }},
    {{ "label": "Technical Depth", "score": 70, "desc": "Specific observation about technical knowledge shown" }},
    {{ "label": "Problem Solving", "score": 75, "desc": "Specific observation about their approach to problems" }},
    {{ "label": "Confidence", "score": 72, "desc": "Specific observation about their confidence and delivery" }}
  ],
  "strengths": [
    "Specific strength observed from the actual answers (not generic)",
    "Another specific strength",
    "Another specific strength"
  ],
  "improvements": [
    "Specific skill gap with actionable advice on how to improve it",
    "Another skill gap with actionable improvement tip",
    "Another skill gap with actionable improvement tip"
  ],
  "skill_gaps": [
    {{ "skill": "Skill name", "gap": "What was missing", "how_to_improve": "Concrete resource or action" }},
    {{ "skill": "Skill name", "gap": "What was missing", "how_to_improve": "Concrete resource or action" }}
  ],
  "transcript": [
    {{
      "q": "The interview question asked",
      "a": "The candidate's answer (verbatim or close summary)",
      "score": 78,
      "feedback": "One sentence specific feedback on this particular answer"
    }}
  ]
}}

Rules:
- overall_score must be 0-100 integer
- verdict must be one of: "EXCELLENT PERFORMANCE", "GOOD EFFORT", "NEEDS IMPROVEMENT"
- All scores must be 0-100 integers
- Be specific to WHAT THE CANDIDATE ACTUALLY SAID — no generic feedback
- skill_gaps must describe real gaps visible in the transcript
- how_to_improve must be actionable (e.g. "Practice STAR method for behavioral questions", "Study system design on Educative.io")
        """

        response = model.generate_content(prompt)
        raw = response.text.strip().replace("```json", "").replace("```", "").strip()
        evaluation = json.loads(raw)

        # Store evaluation so frontend can fetch it at /feedback-data
        interview_store["evaluation"] = evaluation
        interview_store["active"] = False
        interview_store["questions_for_gemini"] = ""

        return jsonify({"status": "ok", "evaluation": evaluation})

    except Exception as e:
        print("EVALUATE ERROR:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────────────────────────────────────────
# FEEDBACK DATA — frontend can fetch this after evaluation is done
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/feedback-data", methods=["GET"])
def feedback_data():
    evaluation = interview_store.get("evaluation")
    if not evaluation:
        return jsonify({"ready": False})
    return jsonify({"ready": True, "evaluation": evaluation})
# ─────────────────────────────────────────────────────────────────────────────
# TEST ONLY — seed fake conversation and call evaluate in one request
# GET http://127.0.0.1:5000/test-evaluate
# Remove this route before production
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/test-evaluate", methods=["GET"])
def test_evaluate():
    # Inject fake conversation directly into store
    interview_store["conversation"] = [
        {"question": "Tell me about yourself.", "answer": "I am a frontend developer with 2 years of React experience. I have built several e-commerce projects."},
        {"question": "What is your greatest strength?", "answer": "My greatest strength is problem solving. I enjoy breaking down complex problems into smaller pieces."},
        {"question": "Why do you want this role?", "answer": "I want to grow as an engineer and this role offers great challenges with modern tech stack."},
    ]
    return jsonify({"status": "ok", "message": "Fake conversation seeded. Now POST /evaluate to test."})



if __name__ == "__main__":
    app.run(debug=True)