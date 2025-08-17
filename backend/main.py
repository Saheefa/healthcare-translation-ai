import os, tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

# === reuse modules (below) ===
from voice_of_the_patient import transcribe_with_groq
from voice_of_the_doctor import text_to_speech_with_elevenlabs, text_to_speech_with_gtts

# LLM clients (OpenAI preferred if available; else Groq)
try:
    import openai
except Exception:
    openai = None
try:
    from groq import Groq
except Exception:
    Groq = None

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("Loaded GROQ_API_KEY:", GROQ_API_KEY)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY and openai:
    openai.api_key = OPENAI_API_KEY

app = FastAPI(title="Healthcare Translation API")


# CORS (allow your Vercel app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), input_lang: str = Form("en")):
    """
    Accepts audio (webm/mp3/wav). Uses Groq Whisper for transcription.
    """
    if not GROQ_API_KEY:
        raise HTTPException(500, "GROQ_API_KEY missing")
    suffix = os.path.splitext(file.filename or "")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        text = transcribe_with_groq(
            stt_model="whisper-large-v3",
            audio_filepath=tmp_path,
            GROQ_API_KEY=GROQ_API_KEY
        )
        return {"transcript": text}
    except Exception as e:
        raise HTTPException(500, f"Transcription failed: {e}")
    finally:
        try: os.remove(tmp_path)
        except: pass

def translate_via_openai(text: str, source_lang: str, target_lang: str) -> str:
    prompt = (
        f"Translate the following medical text from {source_lang} to {target_lang}. "
        f"Preserve clinical meaning and terminology:\n\n{text}"
    )
    resp = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return resp.choices[0].message.content.strip()

def translate_via_groq(text: str, source_lang: str, target_lang: str) -> str:
    if not GROQ_API_KEY or not Groq:
        raise RuntimeError("Groq translation not available")
    client = Groq(api_key=GROQ_API_KEY)
    prompt = (
        f"Translate the following medical text from {source_lang} to {target_lang}. "
        f"Use accurate medical terms and be concise:\n\n{text}"
    )
    chat = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return chat.choices[0].message.content.strip()

@app.post("/translate")
async def translate(
    text: str = Form(...),
    source_lang: str = Form("en"),
    target_lang: str = Form("es")
):
    try:
        # if OPENAI_API_KEY and openai:
        #     out = translate_via_openai(text, source_lang, target_lang)
        # else:
        #     out = translate_via_groq(text, source_lang, target_lang)
        out = translate_via_groq(text, source_lang, target_lang)

        return {"translation": out}
    except Exception as e:
        raise HTTPException(500, f"Translation failed: {e}")

@app.post("/tts")
async def tts(
    text: str = Form(...),
    lang: str = Form("en"),
    engine: str = Form("elevenlabs")  # "elevenlabs" or "gtts"
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        out_path = tmp.name
    try:
        if engine == "elevenlabs" and ELEVENLABS_API_KEY:
            text_to_speech_with_elevenlabs(text, out_path)
        else:
            text_to_speech_with_gtts(text, out_path)
        return FileResponse(out_path, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as e:
        raise HTTPException(500, f"TTS failed: {e}")
