import { useEffect, useState } from "react";
import { Icon } from "./Icon";

const TABS = ["Ocupación por hora", "Reservas de la semana", "Plazas al día"];

function Pill() {
  return (
    <div className="pn st-pill flt items-center gap-3 px-4 py-3" aria-hidden="true">
      <span className="chk w-9 h-9 rounded-full bg-sage text-white grid place-items-center"><Icon name="check" size={18} /></span>
      <span className="text-sm leading-tight">
        <b className="block font-semibold">Reserva confirmada</b>
        <span className="num text-mute" data-num>A-03 · 10:00 a 12:00</span>
      </span>
    </div>
  );
}

function MiniMap() {
  return (
    <div className="pn st-map p-3" aria-hidden="true">
      <svg viewBox="0 0 200 120" className="w-full block rounded-xl bg-[#EAF1FB]">
        <g stroke="#C4CAD6" strokeWidth="5" strokeLinecap="round" fill="none"><path d="M0 60H200M70 0V120M142 0V120" /></g>
        <g fill="#fff" stroke="#DDE4EE">
          {[[8, 8, 52], [82, 8, 52], [150, 8, 42], [8, 70, 52], [82, 70, 52], [150, 70, 42]].map(([x, y, w]) => (
            <rect key={x + "-" + y} x={x} y={y} width={w} height="38" rx="7" />
          ))}
        </g>
        <path id="route" d="M70 116V60H142V16" fill="none" stroke="#2A5C9A" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7" />
        <circle cx="142" cy="14" r="6" fill="#2A5C9A" /><circle cx="142" cy="14" r="2.2" fill="#fff" />
        <circle r="5" fill="#2A5C9A" stroke="#fff" strokeWidth="2">
          <animateMotion dur="8s" repeatCount="indefinite"><mpath href="#route" /></animateMotion>
        </circle>
      </svg>
      <div className="flex items-center gap-2 mt-2.5 text-xs font-medium">
        <i className="halo w-2 h-2 rounded-full bg-lapis inline-block" /> Ruta a tu plaza
      </div>
    </div>
  );
}

const BARS = [38, 56, 72, 50, 84, 64, 46];
const PTS = [[10, 80], [65, 55], [120, 62], [175, 30], [230, 18]];
const ARCS = [[58, "#2A5C9A", "Libres 58%"], [30, "#6FA4E0", "Ocupadas 30%"], [12, "#BFD8C6", "Reservadas 12%"]];

function RotChart() {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setTab((t) => (t + 1) % 3), 4800);
    return () => clearInterval(id);
  }, []);
  const line = PTS.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  let cum = 0;
  return (
    <div className="pn st-chart p-4" aria-hidden="true">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold">{TABS[tab]}</span>
        <span className="flex gap-1">
          {TABS.map((_, i) => (
            <i key={i} className="block w-[18px] h-1 rounded-full transition-colors duration-300"
              style={{ background: i === tab ? "var(--lapis)" : "rgba(42,92,154,.2)" }} />
          ))}
        </span>
      </div>
      <svg viewBox="0 0 240 110" className="w-full block" key={tab}>
        {tab === 0 && (
          <g>
            <path d="M0 101H240" stroke="#E4E1D8" />
            {BARS.map((h, i) => (
              <rect key={i} className="bar" style={{ "--i": i }} x={4 + i * 33.5} y={100 - h} width="24" height={h} rx="6"
                fill={i % 2 ? "#6F9BD6" : "#A9CBF3"} />
            ))}
          </g>
        )}
        {tab === 1 && (
          <g>
            <path className="fade" d={`${line}V100H10Z`} fill="rgba(42,92,154,.12)" />
            <path className="draw" d={line} pathLength="1" strokeDasharray="1" fill="none" stroke="#2A5C9A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {PTS.map(([x, y], i) => (
              <circle key={i} className="pt" style={{ "--i": i }} cx={x} cy={y} r="4.5" fill="#fff" stroke="#2A5C9A" strokeWidth="2.5" />
            ))}
          </g>
        )}
        {tab === 2 && (
          <g>
            {ARCS.map(([len, color, label], i) => {
              const off = -cum; cum += len;
              return (
                <g key={label}>
                  <circle className="arc" style={{ "--i": i, strokeDasharray: `${len - 1.5} ${101.5 - len}` }} cx="62" cy="55" r="38" pathLength="100"
                    fill="none" stroke={color} strokeWidth="13" strokeDashoffset={off} transform="rotate(-90 62 55)" />
                  <circle cx="134" cy={36 + i * 20} r="4" fill={color} />
                  <text x="144" y={40 + i * 20} fontSize="11" fill="#1B1D24" fontFamily="Inter, system-ui">{label}</text>
                </g>
              );
            })}
            <text x="62" y="59" textAnchor="middle" fontSize="15" fontWeight="600" fill="#1B1D24" fontFamily="Inter Tight, system-ui">Al día</text>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function HeroStage({ image }) {
  return (
    <div className="stage rv" style={{ "--d": ".15s" }}>
      <div className="relative aspect-[4/4.4] rounded-[30px] overflow-hidden shadow-soft bg-gradient-to-br from-sage/50 via-cream to-lapis/40">
        <img src={image} alt="" className="kb absolute inset-0 w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
      </div>
      <Pill />
      <MiniMap />
      <RotChart />
    </div>
  );
}
