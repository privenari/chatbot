import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, Sparkles, MessageCircle, Minus } from "lucide-react";
import { getOrCreateSessionId, resetSessionId, sendChatMessage } from "../services/parkingApi";

const QUICK_PROMPTS = [
  "¿Qué espacios hay libres mañana de 10:00 a 12:00?",
  "Quiero reservar cualquier espacio libre",
  "Necesito cancelar una reserva",
];

const nowTime = () => new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const makeMsg = (role, text) => ({ id: crypto.randomUUID(), role, text, time: nowTime() });

export default function ParkingChatPanel({ externalDraft, onClearDraft, onBookingStateChanged }) {
  const [open, setOpen] = useState(false); // minimizado al inicio
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const [messages, setMessages] = useState([
    makeMsg("assistant", "Hola, soy el asistente de reservas. Puedo consultar disponibilidad, reservar una plaza o cancelar una reserva. ¿En qué te ayudo?"),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Abrir desde botones externos
  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("open-chat", openChat);
    return () => window.removeEventListener("open-chat", openChat);
  }, []);

  // Borrador que llega al hacer clic en una plaza
  useEffect(() => {
    if (externalDraft) {
      setInput(externalDraft);
      setOpen(true);
      onClearDraft();
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [externalDraft, onClearDraft]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending, open]);

  const handleSend = async (textToSend) => {
    const cleanText = (textToSend ?? input).trim();
    if (!cleanText || isSending) return;
    setMessages((p) => [...p, makeMsg("user", cleanText)]);
    setInput("");
    setIsSending(true);
    try {
      const reply = await sendChatMessage(cleanText, sessionId);
      setMessages((p) => [...p, makeMsg("assistant", reply)]);
      const lower = reply.toLowerCase();
      if (lower.includes("confirmada") || lower.includes("cancelada")) onBookingStateChanged?.();
    } catch (err) {
      setMessages((p) => [...p, makeMsg("assistant", `⚠️ ${err.message}`)]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetChat = () => {
    setSessionId(resetSessionId());
    setMessages([makeMsg("assistant", "Sesión reiniciada. ¿Qué horario o plaza necesitas consultar?")]);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente de reservas"
        className="ring-fab fixed z-50 right-5 bottom-5 sm:right-8 sm:bottom-8 w-14 h-14 rounded-full bg-ink text-white grid place-items-center shadow-soft hover:bg-lapis transition"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Asistente de reservas"
      className="chat-pop fixed z-50 right-3 bottom-3 sm:right-8 sm:bottom-8 w-[calc(100vw-1.5rem)] sm:w-[400px] h-[min(620px,calc(100vh-1.5rem))] bg-white border border-line rounded-[30px] shadow-soft flex flex-col overflow-hidden"
    >
      {/* Cabecera */}
      <div className="px-5 py-4 bg-ink text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-lapis grid place-items-center"><Bot className="w-5 h-5" /></div>
          <div>
            <h2 className="!text-[15px] !leading-tight !tracking-normal !text-white !font-semibold">Asistente de reservas</h2>
            <span className="text-xs text-emerald-300 flex items-center gap-1.5">
              <i className="pulse-dot w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" /> En línea
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleResetChat} title="Nueva conversación" aria-label="Nueva conversación"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setOpen(false)} title="Minimizar" aria-label="Minimizar asistente"
            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"><Minus className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Mensajes: texto alineado a la izquierda, con hora */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-cream/50">
        {messages.map((msg) => {
          const mine = msg.role === "user";
          return (
            <div key={msg.id} className={`msg-in flex items-start gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full grid place-items-center shrink-0 mt-0.5 ${mine ? "bg-lapis text-white" : "bg-white border border-line text-ink"}`}>
                {mine ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[82%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed text-left ${
                  mine ? "bg-lapis text-white rounded-tr-md" : "bg-white text-ink border border-line rounded-tl-md"}`}>
                  {msg.text}
                </div>
                <span className="num text-[11px] text-mute mt-1 px-1" data-num>{msg.time}</span>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex items-center gap-2.5 text-xs text-mute">
            <div className="w-7 h-7 rounded-full bg-white border border-line grid place-items-center"><Bot className="w-4 h-4 text-ink" /></div>
            <span className="typing inline-flex gap-1 bg-white border border-line rounded-full px-3 py-2">
              {[0, 1, 2].map((k) => <i key={k} style={{ "--k": k }} />)}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      <div className="px-3 py-2 border-t border-line bg-white flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS.map((p) => (
          <button key={p} type="button" disabled={isSending} onClick={() => handleSend(p)}
            className="shrink-0 inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-white hover:bg-cream text-ink border border-line transition disabled:opacity-50">
            <Sparkles className="w-3 h-3 text-lapis" /> {p}
          </button>
        ))}
      </div>

      {/* Escritura: fondo blanco y texto grafito */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-3 border-t border-line bg-white flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Reservar A-03 mañana de 10:00 a 12:00"
          readOnly={isSending}
          className="field !bg-white !text-ink flex-1 !rounded-full !px-4"
        />
        <button type="submit" disabled={isSending || !input.trim()} aria-label="Enviar mensaje"
          className="w-11 h-11 rounded-full bg-ink text-white grid place-items-center hover:bg-lapis transition disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
