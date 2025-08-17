import os
import logging
import speech_recognition as sr
from pydub import AudioSegment
from io import BytesIO
from dotenv import load_dotenv
from groq import Groq

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

def transcribe_with_groq(stt_model: str, audio_filepath: str, GROQ_API_KEY: str):
    client = Groq(api_key=GROQ_API_KEY)
    # open file as-is (webm/mp3/wav should work)
    with open(audio_filepath, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            model=stt_model,
            file=audio_file,
            # language can be omitted to auto-detect; keep "en" if you’re sure:
            # language="en"
        )
    return transcription.text
