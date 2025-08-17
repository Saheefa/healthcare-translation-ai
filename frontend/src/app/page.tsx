"use client";
import { useEffect, useRef, useState } from "react";

const BACKEND: string =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";


export default function Home() {
  const [inputLang, setInputLang] = useState("en");
  const [outputLang, setOutputLang] = useState("es");
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [useServerTTS, setUseServerTTS] = useState(false);

 const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError("");
    setTranscript("");
    setTranslation("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = rec;
      rec.start(100);
      setRecording(true);
    } catch (e) {
      setError("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {

    try {
      // 1) Transcribe
      const fd = new FormData();
      fd.append("file", blob, "audio.webm");
      fd.append("input_lang", inputLang);

      const tr = await fetch(`${BACKEND}/transcribe`, { method: "POST", body: fd });
      if (!tr.ok) throw new Error(await tr.text());
      const trj = await tr.json();
      setTranscript(trj.transcript || "");

      // 2) Translate
      const td = new FormData();
      td.append("text", trj.transcript || "");
      td.append("source_lang", input_lang_to_label(inputLang));
      td.append("target_lang", input_lang_to_label(outputLang));

      const tRes = await fetch(`${BACKEND}/translate`, { method: "POST", body: td });
      if (!tRes.ok) throw new Error(await tRes.text());
      const tj = await tRes.json();
      setTranslation(tj.translation || "");
    } catch (e) {
      setError(`Processing failed: ${e}`);
    }
  };

  const speak = async () => {
    if (!translation) return;
    try {
      if (!useServerTTS) {
        const utter = new SpeechSynthesisUtterance(translation);
        utter.lang = outputLang;
        window.speechSynthesis.speak(utter);
        return;
      }
      const form = new FormData();
      form.append("text", translation);
      form.append("lang", outputLang);
      form.append("engine", "elevenlabs");
      const res = await fetch(`${BACKEND}/tts`, { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
    } catch (e) {
      setError(`TTS failed: ${e}`);
    }
  };

  return (
    <main style={{
      maxWidth: 720, margin: "0 auto", padding: 16,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial"
    }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Healthcare Translation Web App</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Speak. See original & translated transcripts. Tap “Speak” for audio.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Input language</span>
          <select value={inputLang} onChange={e => setInputLang(e.target.value)} style={{ padding: 8 }}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="ur">Urdu</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Output language</span>
          <select value={outputLang} onChange={e => setOutputLang(e.target.value)} style={{ padding: 8 }}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="ur">Urdu</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        {!recording ? (
          <button onClick={startRecording} style={btnStyle}>🎙️ Record</button>
        ) : (
          <button onClick={stopRecording} style={{ ...btnStyle, background: "#d9534f" }}>⏹ Stop</button>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={useServerTTS} onChange={e => setUseServerTTS(e.target.checked)} />
          Use server TTS
        </label>
      </div>

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <section style={panelStyle}>
          <strong>Original</strong>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{transcript || "—"}</p>
        </section>
        <section style={panelStyle}>
          <strong>Translation</strong>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{translation || "—"}</p>
        </section>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={speak} disabled={!translation} style={btnStyle}>🔊 Speak</button>
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: "#c00" }}>
          <strong>Error:</strong> {String(error)}
        </div>
      ) : null}

      <footer style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        Groq Whisper STT • OpenAI/Groq translation • ElevenLabs/gTTS TTS • Mobile-first UI
      </footer>
    </main>
  );
}

function input_lang_to_label(code: string) {
  const map: Record<string, string> = {
    en: "English",
    es: "Spanish",
    ur: "Urdu",
    ar: "Arabic",
    zh: "Chinese"
  };
  return map[code] || code;
}


const btnStyle = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#2b6cb0",
  color: "white",
  cursor: "pointer",
  fontSize: 14
};

const panelStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  background: "#fafafa"
};
