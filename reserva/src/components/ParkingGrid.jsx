import { Car, Zap, Accessibility, MapPin, RefreshCw, Clock } from "lucide-react";

const TYPE_CONFIG = {
  estandar: { label: "Estándar", icon: Car, badge: "bg-cream text-ink border-line" },
  electrico: { label: "Carga eléctrica", icon: Zap, badge: "bg-amber-50 text-amber-800 border-amber-200" },
  discapacitados: { label: "Acceso preferencial", icon: Accessibility, badge: "bg-blue-50 text-lapis border-blue-200" },
};

export default function ParkingGrid({
  spaces, loading, selectedDate, startTime, endTime,
  onDateChange, onStartTimeChange, onEndTimeChange, onRefresh, onSelectSpotForChat,
}) {
  const availableCount = spaces.filter((s) => s.disponible).length;
  const groupedByZone = spaces.reduce((acc, s) => {
    (acc[s.zona] ||= []).push(s);
    return acc;
  }, {});

  return (
    <div className="card rv overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-line bg-cream/60">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="!text-[clamp(28px,3vw,40px)]">Plazas disponibles</h2>
            <p className="text-mute mt-2 max-w-[56ch]">
              Cambia el horario para actualizar la ocupación. Haz clic en una plaza libre para pedirla al asistente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="num inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold bg-white border border-line" data-num>
              <i className="pulse-dot w-2 h-2 rounded-full bg-sage inline-block" />
              {availableCount} de {spaces.length} libres
            </span>
            <button onClick={onRefresh} disabled={loading} title="Actualizar disponibilidad" aria-label="Actualizar disponibilidad"
              className="w-10 h-10 grid place-items-center rounded-full border border-line bg-white hover:bg-cream transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
          <label className="text-sm font-medium">
            <span className="block mb-1.5">Fecha</span>
            <input type="date" value={selectedDate} onChange={(e) => onDateChange(e.target.value)} className="field" />
          </label>
          <label className="text-sm font-medium">
            <span className="mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-mute" /> Hora de inicio</span>
            <input type="time" value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} className="field" />
          </label>
          <label className="text-sm font-medium">
            <span className="mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-mute" /> Hora de término</span>
            <input type="time" value={endTime} onChange={(e) => onEndTimeChange(e.target.value)} className="field" />
          </label>
        </div>
        {startTime >= endTime && (
          <p className="text-sm text-rose-700 mt-3">La hora de término debe ser posterior a la de inicio.</p>
        )}
      </div>

      <div className="p-6 sm:p-8 grid gap-10">
        {spaces.length === 0 && (
          <p className="text-mute text-center py-10">{loading ? "Consultando disponibilidad…" : "No hay plazas para mostrar. Ajusta el horario."}</p>
        )}
        {Object.entries(groupedByZone).map(([zona, zoneSpaces]) => (
          <div key={zona}>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-lapis" />
              <h3>{zona}</h3>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[repeat(3,minmax(0,1fr))]">
              {zoneSpaces.map((spot) => {
                const t = TYPE_CONFIG[spot.tipo] || TYPE_CONFIG.estandar;
                const Icon = t.icon;
                return (
                  <button key={spot.id} type="button" disabled={!spot.disponible} onClick={() => onSelectSpotForChat(spot)}
                    className={`text-left p-4 rounded-2xl border flex flex-col gap-3 transition-all duration-300 ${
                      spot.disponible
                        ? "border-line bg-white hover:border-lapis hover:-translate-y-0.5 hover:shadow-soft cursor-pointer"
                        : "border-line bg-cream/70 opacity-60 cursor-not-allowed"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xl font-semibold tracking-tight">{spot.codigo}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${spot.disponible ? "bg-emerald-50 text-sage" : "bg-rose-50 text-rose-700"}`}>
                        {spot.disponible ? "Libre" : "Ocupada"}
                      </span>
                    </div>
                    <span className={`inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${t.badge}`}>
                      <Icon className="w-3.5 h-3.5 shrink-0" /> {t.label}
                    </span>
                    <span className={`mt-auto pt-3 border-t border-line text-xs font-semibold ${spot.disponible ? "text-lapis" : "text-mute"}`}>
                      {spot.disponible ? "Reservar esta plaza" : "No disponible en este horario"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
