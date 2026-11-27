// src/pages/ParkingReservationModule.jsx
import { useState, useEffect, useCallback } from "react";
import { ParkingSquare, ShieldCheck } from "lucide-react";
import ParkingGrid from "../components/ParkingGrid";
import ParkingChatPanel from "../components/ParkingChatPanel";
import { fetchParkingSpaces } from "../services/parkingApi";

function getTodayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
}

export default function ParkingReservationModule() {
  const [selectedDate, setSelectedDate] = useState(getTodayLocal);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  const loadSpaces = useCallback(async () => {
    if (!selectedDate || !startTime || !endTime || startTime >= endTime) return;
    setLoading(true);
    setError("");
    try {
      const inicioISO = `${selectedDate}T${startTime}:00`;
      const finISO = `${selectedDate}T${endTime}:00`;
      const data = await fetchParkingSpaces(inicioISO, finISO);
      setSpaces(data.espacios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, startTime, endTime]);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  const handleSelectSpot = (spot) => {
    setChatDraft(
      `Quiero reservar el espacio ${spot.codigo} para el ${selectedDate} entre las ${startTime} y las ${endTime}. Mi nombre es `
    );
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Encabezado de sección dentro del portal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <ParkingSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Gestión y Reserva de Estacionamientos
              </h1>
              <span className="hidden md:inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Módulo Operativo
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Consulta ocupación por zona o gestiona tu reserva mediante el asistente inteligente.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Layout de 12 columnas: 7 para mapa de plazas + 5 para asistente IA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <ParkingGrid
            spaces={spaces}
            loading={loading}
            selectedDate={selectedDate}
            startTime={startTime}
            endTime={endTime}
            onDateChange={setSelectedDate}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onRefresh={loadSpaces}
            onSelectSpotForChat={handleSelectSpot}
          />
        </div>

        <div className="lg:col-span-5">
          <ParkingChatPanel
            externalDraft={chatDraft}
            onClearDraft={() => setChatDraft("")}
            onBookingStateChanged={loadSpaces}
          />
        </div>
      </div>
    </section>
  );
}
