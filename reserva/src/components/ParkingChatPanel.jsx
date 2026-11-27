import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, RotateCcw, Sparkles } from "lucide-react";
import {
  getOrCreateSessionId,
  resetSessionId,
  sendChatMessage,
} from "../services/parkingApi";

const QUICK_PROMPTS = [
  "¿Qué espacios hay libres mañana de 10:00 a 12:00?",
  "Quiero reservar cualquier espacio libre",
  "Necesito cancelar una reserva",
];

export default function ParkingChatPanel({
  externalDraft,
  onClearDraft,
  onBookingStateChanged,
}) {
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      text: "Hola, soy el asistente de reservas de estacionamientos. Puedo consultar disponibilidad, agendar una plaza o cancelar una reserva existente. ¿En qué te ayudo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (externalDraft) {
      setInput(externalDraft);
      onClearDraft();
    }
  }, [externalDraft, onClearDraft]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (textToSend) => {
    const cleanText = (textToSend ?? input).trim();
    if (!cleanText || isSending) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", text: cleanText };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const reply = await sendChatMessage(cleanText, sessionId);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", text: reply },
      ]);

      // Si el bot confirmó o canceló una reserva, refrescamos la grilla visual
      const lower = reply.toLowerCase();
      if (lower.includes("confirmada") || lower.includes("cancelada")) {
        onBookingStateChanged?.();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `⚠️ ${err.message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetChat = () => {
    const freshSession = resetSessionId();
    setSessionId(freshSession);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Sesión reiniciada. ¿Qué horario o espacio de estacionamiento necesitas consultar?",
      },
    ]);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[620px]">
      {/* Cabecera del asistente */}
      <div className="px-4 py-3.5 bg-slate-900 text-white rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">
              Asistente Virtual de Reservas
            </h2>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Conectado a motor IA local
            </span>
          </div>
        </div>
        <button
          onClick={handleResetChat}
          title="Nueva conversación"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Historial de mensajes */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-slate-500 pl-9">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
            Consultando disponibilidad y procesando solicitud...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias rápidas */}
      <div className="px-3 py-2 border-t border-slate-200 bg-white flex gap-1.5 overflow-x-auto">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={isSending}
            onClick={() => handleSend(prompt)}
            className="shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition"
          >
            <Sparkles className="w-3 h-3 text-blue-500" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Formulario de envío */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 border-t border-slate-200 bg-white rounded-b-xl flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Reservar A-03 mañana de 10:00 a 12:00, patente ABCD-12..."
          disabled={isSending}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none disabled:bg-slate-100"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="px-3.5 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
