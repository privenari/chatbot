const N8N_CHAT_WEBHOOK = "/webhook/17df9680-48ea-4501-8579-1ef4a3bdd5ff/chat";

export function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem("parking_chat_session");
  if (!sessionId) {
    sessionId = `usr_${crypto.randomUUID()}`;
    sessionStorage.setItem("parking_chat_session", sessionId);
  }
  return sessionId;
}

export function resetSessionId() {
  const newId = `usr_${crypto.randomUUID()}`;
  sessionStorage.setItem("parking_chat_session", newId);
  return newId;
}

export async function fetchParkingSpaces(inicioISO, finISO) {
  const params = new URLSearchParams({ inicio: inicioISO, fin: finISO });
  const response = await fetch(`/api/espacios?${params.toString()}`);
  if (!response.ok) {
    throw new Error("No se pudo cargar el estado de los estacionamientos.");
  }
  return response.json();
}

export async function sendChatMessage(message, sessionId) {
  const response = await fetch(N8N_CHAT_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sendMessage",
      sessionId,
      chatInput: message,
    }),
  });

  if (!response.ok) {
    throw new Error("El asistente no pudo responder en este momento.");
  }

  const data = await response.json();
  return data.output || data.text || "Sin respuesta del servidor.";
}
