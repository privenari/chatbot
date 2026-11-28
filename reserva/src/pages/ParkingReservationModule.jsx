// src/pages/ParkingReservationModule.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import ParkingGrid from "../components/ParkingGrid";
import ParkingChatPanel from "../components/ParkingChatPanel";
import HeroStage from "../components/HeroStage";
import { Icon } from "../components/Icon";
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

function GateCard() {
  return (
    <article className="card rv p-6 sm:p-7">
      <span className="kicker !text-[13px]">Acceso sin ticket</span>
      <h3 className="mt-2">La cámara lee la patente y la barrera se abre</h3>
      <div className="lapis-hero relative h-[200px] mt-5 rounded-2xl overflow-hidden" aria-hidden>
        <div className="absolute inset-x-0 bottom-6 h-12 bg-white/10">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
        </div>
        <div className="gate-car absolute left-[6%] bottom-[34px]">
          <svg viewBox="0 0 96 40" width="96"><path d="M6 30v-8c0-3 2-5 5-6l12-3 9-8h26l10 8 14 3c3 1 4 3 4 6v8z" fill="#fff" /><circle cx="26" cy="31" r="6" fill="#14335A" stroke="#fff" strokeWidth="3" /><circle cx="72" cy="31" r="6" fill="#14335A" stroke="#fff" strokeWidth="3" /></svg>
        </div>
        <i className="gate-scan absolute bottom-[30px] w-[2px] h-[48px] rounded bg-melon shadow-[0_0_12px_2px_rgba(255,181,138,.8)]" style={{ left: "calc(6% + 86px)" }} />
        <i className="absolute right-[28%] bottom-6 w-1.5 h-[64px] rounded bg-white/80" />
        <i className="gate-arm absolute right-[28%] bottom-[84px] w-[110px] h-[6px] rounded bg-melon" />
        <span className="gate-plate absolute left-4 top-4 font-mono text-sm font-semibold bg-white text-ink rounded-lg px-2.5 py-1">ABCD-12</span>
        <span className="gate-ok absolute right-4 top-4 w-9 h-9 rounded-full bg-sage text-white grid place-items-center"><Check className="w-5 h-5" /></span>
      </div>
      <div className="relative h-6 mt-4 text-sm font-semibold">
        <span className="gate-t1 absolute inset-0 text-mute">Leyendo patente…</span>
        <span className="gate-t2 absolute inset-0 text-sage">Patente reconocida · acceso abierto</span>
      </div>
    </article>
  );
}

function LiveCard({ spaces }) {
  const free = spaces.filter((s) => s.disponible).length;
  const total = spaces.length;
  const [count, countRef] = useCountUp(free);
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    setSecs(0);
    const t = setInterval(() => setSecs((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [spaces]);
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
    <article className="card rv p-6 sm:p-7" style={{ "--d": ".15s" }}>
      <div className="flex items-center justify-between">
        <span className="kicker !text-[13px]">Ocupación en vivo</span>
        <span className="sg flex items-end gap-[3px]">{[0, 1, 2, 3].map((k) => <i key={k} style={{ "--k": k }} />)}</span>
      </div>
      <div className="flex items-end justify-between gap-4 mt-2">
        <div ref={countRef} className="num font-display font-semibold text-6xl tracking-tight leading-none" data-num>
          {count}<span className="text-xl text-mute font-medium"> / {total}</span>
        </div>
        <p className="text-sm text-mute text-right">plazas libres<br />en el horario elegido</p>
      </div>
      <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5 mt-5" aria-hidden>
        {spaces.slice(0, 28).map((s, i) => (
          <i key={s.id} className={`slot ${s.disponible ? "bg-sage slot-f" : "bg-lapis/25"}`} style={{ "--k": i }} />
        ))}
      </div>
      <div className="grid gap-3 mt-5">
        {zones.length === 0 && <p className="text-sm text-mute">Cargando zonas…</p>}
        {zones.map(([name, z]) => {
          const occ = z.total ? Math.round(((z.total - z.free) / z.total) * 100) : 0;
          return (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1"><span className="truncate pr-2">{name}</span><span className="num font-semibold" data-num>{occ}%</span></div>
              <div className="h-2 rounded-full bg-lapis/10 overflow-hidden">
                <div className="h-full rounded-full bg-lapis transition-[width] duration-[1200ms]" style={{ width: `${occ}%`, transitionTimingFunction: "var(--ease)" }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="num text-xs text-mute mt-4" data-num>Actualizado hace {secs} s</p>
    </article>
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
    <section id="espacios" className="sec relative !pt-0 !pb-[clamp(48px,6vw,88px)]">
      <div className="hero">
        <div className="wrap-h hero-grid">
          <div>
            <span className="kicker rv">Estacionamientos en tiempo real</span>
            <h1 className="rvw mt-5">
              <Words text="Mira qué plazas están libres." />
              <br />
              <Words className="mel" start={5} text="Resérvalas con el asistente." />
            </h1>
            <p className="lead rv mt-6" style={{ "--d": ".15s" }}>
              Elige fecha y horario, revisa la ocupación de cada zona y confirma tu plaza en una sola conversación.
            </p>
            <div className="rv mt-8 flex flex-wrap gap-3" style={{ "--d": ".3s" }}>
              <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event("open-chat"))}>
                Reservar plaza <Icon name="arrow" size={20} />
              </button>
              {/* Reemplaza el número por el WhatsApp real del recinto */}
              <a className="btn btn-ghost" href="https://wa.me/56900000000" target="_blank" rel="noopener noreferrer">
                <Icon name="wa" size={20} className="text-sage" /> Escríbenos por WhatsApp
              </a>
            </div>
            <p className="rv mt-5 flex items-center gap-2 text-sm text-mute" style={{ "--d": ".4s" }}>
              <Icon name="check" size={18} className="text-lapis shrink-0" />
              Siempre un lugar para ti: confirmación inmediata en el chat.
            </p>
          </div>
          <HeroStage image={HERO_IMG} />
        </div>
      </div>

      <div className="wrap relative">
        {error && (
          <div role="alert" className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>
        )}
        <div className="grid gap-5 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
          <GateCard />
          <LiveCard spaces={spaces} />
        </div>

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
