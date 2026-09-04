# AI Teacher — Human-Like AI Educator
### Bharat Academix AI Innovation Hackathon 2026 — Round 2 Technical Assessment

A working AI Teacher that takes an uploaded book/PDF/notes **or** a bare topic and
turns it into a personalized, adaptive, video-based teaching session — not a
Q&A chatbot.

```
Understand → Plan → Explain → Demonstrate → Question → Evaluate → Adapt → Continue
```

---

## 1. Architecture

```
                       ┌────────────────────┐
                       │      frontend       │  (frontend/public/index.html)
                       └─────────┬───────────┘
                                 │ REST (FastAPI)
                       ┌─────────▼───────────┐
                       │   backend/main.py    │
                       └───┬───────┬─────┬────┘
             ┌─────────────┘       │     └───────────────┐
             ▼                    ▼                      ▼
     ┌───────────────┐   ┌────────────────┐     ┌──────────────────┐
     │      rag/      │   │   ai_teacher/   │     │    assessment/    │
     │ ingestion.py   │   │  planner.py     │     │  evaluator.py     │
     │ embeddings.py  │   │  prompts.py     │     │  misconception.py │
     │ retrieval.py   │   │  personalization│     │  quiz.py          │
     └───────┬────────┘   └────────┬────────┘     └─────────┬─────────┘
             │                     │                         │
             └──────────► LLM (ai_teacher/llm_client.py) ◄────┘
                                 │
                       ┌─────────▼──────────┐
                       │ ai_teacher/llm/     │  provider.py (switchboard)
                       │  provider.py        │  ── LLM_PROVIDER=gemini (default): try Gemini,
                       │  gemini.py          │     auto-fallback to Ollama on any error
                       │  ollama.py          │  ── LLM_PROVIDER=ollama: Ollama only
                       └─────────┬──────────┘
                                 ▼
                       ┌────────────────────┐
                       │       video/        │
                       │ tts.py (speech)     │
                       │ avatar.py (viseme)  │
                       │ visual_selector.py  │
                       │ video_generator.py  │──► lesson_<id>.mp4
                       └────────────────────┘
```

### RAG pipeline (Step 1)
```
PDF/DOCX/PPTX → PyMuPDF/python-docx/python-pptx → Text → Chunks
              → Embeddings (multilingual sentence-transformers)
              → FAISS index → Retriever → Relevant chunks → LLM
```
`rag/ingestion.py` extracts and chunks text with source + page/slide labels.
`rag/embeddings.py` embeds with a **multilingual** model so a Hindi question
still retrieves the right chunk from an English PDF. `rag/retrieval.py` is a
thin FAISS wrapper, one index per upload session, persisted to disk.

### Lesson Planner (Step 2)
`ai_teacher/planner.py` forces every lesson through a structured JSON plan
(`{lesson_title, duration, sections:[{title, duration, concept}]}`) instead of
letting the LLM freewheel a response to "teach me X".

### Learner Model (Step 3)
`ai_teacher/personalization.py` keeps a per-student, per-concept **mastery
score** (0–1, exponentially updated after every answer), recent scores, and a
current difficulty level. No neural net needed — this is transparent and easy
to defend in a demo/Q&A.

### Answer Evaluation + Misconception Detection (Steps 4–5)
`assessment/evaluator.py` uses the LLM as a semantic grader: it returns
correctness, partial-credit score, confidence, and — critically — the
specific misconception behind a wrong answer, not just "Wrong."

### Adaptive Teaching Engine (Step 6)
`assessment/misconception.py` is deliberately **rule-based, not another LLM
call**:

```
score >= 0.8          → increase difficulty
0.5 <= score < 0.8     → give another example
score < 0.5            → identify misconception → simplify → new analogy
                          → easier question
```
`LLM = understands the answer. Rules = decide what the teacher does next.`

### Subject-Aware Visuals (Step 11)
`video/visual_selector.py` asks the LLM to pick a visual type
(`circuit_diagram | graph | equation | timeline | labeled_diagram | code |
flow_diagram`), then deterministic renderers (PIL/matplotlib) draw it — no
classifier training required, and no hallucinated diagrams since rendering is
template-based.

### AI Teaching Video (Step 9–10)
`video/video_generator.py`:
```
Lesson Plan → Teaching Script → Visual Instructions → TTS → Avatar → Video
```
Each lesson section becomes a **scene**: narration is synthesized (gTTS,
multilingual), a subject-aware visual is rendered, and a simple procedurally
drawn **talking avatar** (`video/avatar.py`) is lip-synced to the narration's
audio envelope (basic viseme approximation — mouth opens/closes with volume,
periodic blink, subtle head bob). Scenes are composited (visual + caption +
avatar) and concatenated into one MP4 with `moviepy`.

> **This is the "DIY" avatar/video provider** — fully local except for the
> gTTS and LLM calls, so it runs without any paid avatar API key. For a more
> photorealistic avatar, swap `video/avatar.py`'s renderer for a vendor call
> (D-ID / HeyGen / Synclabs) — `video_generator.py` doesn't need to change,
> since it only expects a stream of frames + one audio file per scene.

### LLM provider layer — Gemini (primary) + Ollama (fallback)
`ai_teacher/llm_client.py` is the only file every other module imports
(`chat()` / `chat_json()`); it now delegates to `ai_teacher/llm/provider.py`,
which picks the actual backend:

```
LLM_PROVIDER=gemini (default)        LLM_PROVIDER=ollama
        │                                    │
        ▼                                    ▼
  ai_teacher/llm/gemini.py            ai_teacher/llm/ollama.py
  (Gemini API, google-genai SDK)      (local model via `ollama serve`)
        │
        │ any error (no key, rate limit, network, safety block)
        ▼
  automatic fallback to ai_teacher/llm/ollama.py
```
Nothing in `planner.py`, `evaluator.py`, `quiz.py`, or `visual_selector.py`
changed — they only ever called `chat()`/`chat_json()`, so swapping the
backend underneath them was a 4-file addition, not a rewrite.

**One clarification worth flagging:** a link like
`https://ai.studio/apps/<id>` is a *hosted AI Studio app/prototype UI*, not
an API endpoint — there's nothing for this backend to "connect to" at that
URL. What you actually reuse from AI Studio is the **API key**
(Dashboard → API Keys → Create API Key) and, if you want to match the exact
behaviour of that app, whatever model name/system-prompt/generation-config
its "Get code" panel shows — those go in `.env` / `ai_teacher/llm/gemini.py`,
not the app link itself.

**Setup:**
```bash
pip install -U google-genai   # already in requirements.txt
```
In `.env`:
```
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash   # bump to a newer Flash model if your AI Studio account has access
```
Sanity-check the key works before relying on it in a demo:
```bash
python3 -c "from ai_teacher.llm.gemini import generate_with_gemini as g; print(g('You are a teacher.', \"Explain Ohm's Law in one sentence.\"))"
```
Ollama stays installed and configured (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`) as
the safety net — if Gemini has an outage or hits a rate limit mid-demo, the
provider layer switches to it automatically and prints which provider it
fell back to, so it's visible in your terminal/logs during a live demo.

### Multilingual (Step 8)
Language flows through every layer: the planner/explainer prompts embed the
requested `language`, embeddings use a multilingual model so retrieval works
across languages, and `video/tts.py` maps language names to gTTS language
codes (Hindi, Hinglish→Hindi voice, English, and 8 more Indian/international
languages out of the box).

---

## 2. Mandatory requirements → where they live

| Requirement | Implementation |
|---|---|
| Learning from uploaded material | `rag/` + `POST /upload` |
| Topic-based teaching | `ai_teacher/planner.py` + `POST /lesson/plan` (works with or without `session_id`) |
| AI-generated lesson structure | `ai_teacher/planner.py` |
| Personalized teaching | `level`, `language`, `time_minutes` threaded through every prompt |
| Human-like teaching interaction | `POST /lesson/explain` (explains → asks a check-in question) |
| Video-based presentation | `video/video_generator.py` + `POST /video/generate` |
| AI voice | `video/tts.py` (gTTS, multilingual) |
| Human-like AI avatar | `video/avatar.py` (lip-synced procedural avatar) |
| Multilingual capability | language threaded end-to-end; multilingual embeddings |
| Student questioning + assessment | `assessment/quiz.py` + `POST /assess/quiz` |
| Adaptive response to performance | `assessment/misconception.py` + `POST /assess/answer` |
| Working prototype | FastAPI backend + static frontend, runs with `uvicorn` |

---

## 3. Setup

```bash
cd AI-Teacher
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # add your GEMINI_API_KEY (and Ollama settings, kept as fallback)
uvicorn backend.main:app --reload --port 8000
```
Open **http://localhost:8000** — the single-page frontend is served
automatically. Interactive API docs: **http://localhost:8000/docs**.

### First run
1. (Optional) Upload a PDF/DOCX/PPTX under "Upload material".
2. Set topic/level/language/time, click **Plan Lesson**.
3. Click **Ask / Explain** to have the teacher explain a concept and ask a
   check-in question; type your answer and click **Submit as Answer** to see
   the misconception-aware grading and adaptive response.
4. Click **Generate Teaching Video** for the full AI-avatar video experience
   (takes 30s–2min depending on lesson length and machine).

---

## 4. Third-party services disclosed

- **Gemini API** (Google AI Studio / `google-genai` SDK) — primary LLM: lesson
  planning, explanation, answer evaluation/misconception detection, quiz
  generation, visual-type selection.
- **Ollama** (local model, e.g. Mistral) — automatic fallback LLM if Gemini
  is unavailable; also usable as the sole provider offline via
  `LLM_PROVIDER=ollama`.
- **gTTS** (Google Translate TTS) — narration audio. Free, no key, requires
  internet at runtime.
- **sentence-transformers** (`paraphrase-multilingual-MiniLM-L12-v2`, local) —
  embeddings for RAG retrieval.
- **FAISS** (local) — vector index.
- **PyMuPDF / python-docx / python-pptx** (local) — document parsing.
- **moviepy / Pillow / matplotlib** (local) — video/image rendering.

## 5. Known limitations

- Gemini model names change over time (Flash generations get renamed/retired
  by Google); if `GEMINI_MODEL` in `.env` returns a 404, check your AI Studio
  account's available models and update the value — no code change needed.
- The Gemini→Ollama fallback is a full-request retry, not mid-token
  failover: if Gemini fails partway through a long generation, that specific
  call restarts from scratch on Ollama (fine for lesson-length prompts; not
  a token-level hot-swap).

- The avatar is a **procedural DIY renderer**, not a photorealistic vendor
  avatar (by design, to avoid a paid API dependency for the demo) — see the
  swap-in point noted above.
- Lip-sync is a volume-envelope approximation, not phoneme-level viseme
  mapping.
- gTTS has no true Hinglish voice; code-mixed text is read with the Hindi
  voice, which is workable but not perfect prosody.
- Mastery model is a simple exponentially-weighted score per concept, not a
  full Bayesian knowledge-tracing model — sufficient for a hackathon demo,
  clearly documented as an extension point.
- Video generation time scales with lesson length/number of sections;
  long (60 min) lessons should be pre-rendered rather than generated
  synchronously in a request.

## 6. Repository layout

```
AI-Teacher/
├── backend/            FastAPI app, request/response schemas
├── rag/                ingestion, embeddings, FAISS retrieval
├── ai_teacher/          LLM client, prompts, lesson planner, learner model
│   └── llm/             provider.py (Gemini/Ollama switch), gemini.py, ollama.py
├── assessment/          answer evaluator, adaptive engine, quiz generator
├── video/               TTS, avatar renderer, subject-aware visuals, video assembly
├── frontend/public/     single-page demo UI
├── data/                uploads / faiss indices / learner profiles / videos (gitignored)
├── requirements.txt
├── .env.example
└── README.md
```
