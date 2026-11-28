// src/pages/ParkingReservationModule.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { MessageCircle } from "lucide-react";
import ParkingGrid from "../components/ParkingGrid";
import ParkingChatPanel from "../components/ParkingChatPanel";
import { Words, useCountUp } from "../components/Reveal";
import { fetchParkingSpaces } from "../services/parkingApi";

// Reemplaza por una fotografía propia del recinto (se muestra sobre un degradado de respaldo).
const HERO_IMG =
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=70";

function getTodayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().split("T")[0];
}

function LiveWidgets({ spaces }) {
  const free = spaces.filter((s) => s.disponible).length;
  const total = spaces.length;
  const count = useCountUp(free);
  const zones = useMemo(() => {
    const z = {};
    spaces.forEach((s) => {
      z[s.zona] ??= { free: 0, total: 0 };
      z[s.zona].total++;
      if (s.disponible) z[s.zona].free++;
    });
    return Object.entries(z);
  }, [spaces]);

  return (
    <>
      <div className="glass flt absolute left-[5%] top-[7%] w-[min(300px,70%)] p-5">
        <div className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <i className="pulse-dot w-2 h-2 rounded-full bg-sage inline-block" />
            En vivo
          </span>
          <span className="sg flex items-end gap-[3px]">
            {[0, 1, 2, 3].map((k) => <i key={k} style={{ "--k": k }} />)}
          </span>
        </div>
        <div className="num mt-2 font-display font-semibold text-6xl tracking-tight leading-none" data-num>
          {count}<span className="text-xl text-mute font-medium"> / {total}</span>
        </div>
        <p className="text-sm text-mute mt-1">plazas libres en el horario elegido</p>
      </div>

      <div className="glass absolute right-[5%] bottom-[7%] w-[min(320px,80%)] p-5 grid gap-3">
        <p className="text-sm font-semibold">Ocupación por zona</p>
        {zones.length === 0 && <p className="text-sm text-mute">Cargando zonas…</p>}
        {zones.map(([name, z]) => {
          const occ = z.total ? Math.round(((z.total - z.free) / z.total) * 100) : 0;
          return (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="truncate pr-2">{name}</span>
                <span className="num font-semibold" data-num>{occ}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/80 overflow-hidden">
                <div className="h-full rounded-full bg-lapis transition-[width] duration-[1200ms]"
                  style={{ width: `${occ}%`, transitionTimingFunction: "var(--ease)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
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
      const data = await fetchParkingSpaces(`${selectedDate}T${startTime}:00`, `${selectedDate}T${endTime}:00`);
      setSpaces(data.espacios || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, startTime, endTime]);

  useEffect(() => { loadSpaces(); }, [loadSpaces]);

  const handleSelectSpot = (spot) =>
    setChatDraft(
      `Quiero reservar el espacio ${spot.codigo} para el ${selectedDate} entre las ${startTime} y las ${endTime}. Mi nombre es `
    );

  return (
    <section id="espacios" className="sec !pt-6 sm:!pt-10 !pb-[clamp(48px,6vw,88px)]">
      <div className="wrap">
        {/* Hero: titular + fotografía con widgets */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-center">
          <div>
            <span className="kicker rv">Estacionamientos en tiempo real</span>
            <h1 className="rvw mt-5">
              <Words text="Mira qué plazas están libres." />
              <br />
              <Words className="text-lapis" start={5} text="Resérvalas con el asistente." />
            </h1>
            <p className="lead rv mt-6 max-w-[52ch]" style={{ "--d": ".15s" }}>
              Elige fecha y horario, revisa la ocupación de cada zona y confirma tu plaza en una conversación.
            </p>
            <div className="rv mt-8 flex flex-wrap gap-3" style={{ "--d": ".3s" }}>
              <a href="#plazas" className="btn btn-ink">Ver plazas</a>
              <button type="button" onClick={() => window.dispatchEvent(new Event("open-chat"))} className="btn btn-line">
                <MessageCircle className="w-4 h-4 text-lapis" /> Hablar con el asistente
              </button>
            </div>
          </div>

          <div className="relative aspect-[5/4] rounded-wide overflow-hidden shadow-soft bg-gradient-to-br from-sage/40 via-cream to-melon/60">
            <img src={HERO_IMG} alt="Estacionamiento techado con vehículos" className="kb absolute inset-0 w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")} />
            <LiveWidgets spaces={spaces} />
          </div>
        </div>

        {error && (
          <div role="alert" className="mt-10 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
        )}

        {/* Plazas */}
        <div id="plazas" className="mt-[clamp(36px,4.5vw,64px)]">
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
      </div>

      <ParkingChatPanel
        externalDraft={chatDraft}
        onClearDraft={() => setChatDraft("")}
        onBookingStateChanged={loadSpaces}
      />
    </section>
  );
}
