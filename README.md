# 🏥 Healthcare Translation AI

An AI-powered application that combines **voice-to-text transcription**, **real-time translation**, and **medical terminology support**.  
This project enables healthcare professionals to convert speech into text, translate it across multiple languages, and handle domain-specific medical vocabulary with higher accuracy.

---

## 📌 Features
- 🎙 **Voice-to-Text** – Convert spoken medical conversations into accurate text using Groq Whisper API.
- 🌍 **Translation** – Real-time translation into multiple languages.
- 🧠 **Generative AI** – Enhanced transcription accuracy for medical terms.
- 🔄 **Frontend** – Next.js + Tailwind UI for clean and responsive design.
- ⚡ **Backend** – FastAPI for transcription, translation, and AI-powered processing.
- ☁ **Deployment** – **Vercel (frontend)** and **Railway (backend)**.

---

## 📂 Project Structure
healthcare-translation-ai/
│── frontend/ # Next.js + Tailwind frontend
│── backend/ # FastAPI backend (speech-to-text + translation APIs)
│── .gitignore # Ignore files for Node + Python
│── README.md # Project documentation



---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Saheefa/healthcare-translation-ai.git
cd healthcare-translation-ai
2️⃣ Frontend Setup (Next.js)
bash
Copy
Edit
cd frontend
npm install
npm run dev
Frontend runs by default at 👉 http://localhost:3000

3️⃣ Backend Setup (FastAPI)
bash
Copy
Edit
cd backend
python -m venv .venv
source .venv/bin/activate   # (Linux/Mac)
.venv\Scripts\activate      # (Windows)
pip install -r requirements.txt
uvicorn main:app --reload
Backend runs by default at 👉 http://127.0.0.1:8000

🌐 Deployment
Frontend → Deploy on Vercel

Backend → Deploy on Railway or any cloud service that supports FastAPI

🛠 Tech Stack
Frontend → Next.js, React, TailwindCSS

Backend → FastAPI, Python, Uvicorn

AI Models → OpenAI Whisper / Hugging Face / Google Cloud Speech-to-Text

Deployment → Vercel + Railway

📖 Future Enhancements
✅ Add medical-specific vocabulary tuning

✅ Support offline transcription

✅ HIPAA-compliant data storage

🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

📜 License
This project is licensed under the MIT License – feel free to use and modify.

