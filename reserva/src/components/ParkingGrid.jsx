import { Car, Zap, Accessibility, MapPin, RefreshCw, Clock } from "lucide-react";

const TYPE_CONFIG = {
  estandar: {
    label: "Estándar",
    icon: Car,
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
  electrico: {
    label: "Carga Eléctrica",
    icon: Zap,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  discapacitados: {
    label: "Acceso Preferencial",
    icon: Accessibility,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

export default function ParkingGrid({
  spaces,
  loading,
  selectedDate,
  startTime,
  endTime,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onRefresh,
  onSelectSpotForChat,
}) {
  const availableCount = spaces.filter((s) => s.disponible).length;

  // Agrupar espacios por zona (Nivel 1 - Techado / Exterior - Parquímetro)
  const groupedByZone = spaces.reduce((acc, spot) => {
    acc[spot.zona] = acc[spot.zona] || [];
    acc[spot.zona].push(spot);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Barra de filtros horarios */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/70 rounded-t-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Disponibilidad de Plazas en Tiempo Real
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecciona un bloque horario o haz clic en una plaza libre para solicitarla al asistente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {availableCount} de {spaces.length} disponibles
            </span>
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Actualizar disponibilidad"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Hora Inicio
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Hora Término
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grilla de cajones por zona */}
      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {Object.entries(groupedByZone).map(([zona, zoneSpaces]) => (
          <div key={zona}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                {zona}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {zoneSpaces.map((spot) => {
                const typeInfo = TYPE_CONFIG[spot.tipo] || TYPE_CONFIG.estandar;
                const IconComponent = typeInfo.icon;

                return (
                  <button
                    key={spot.id}
                    type="button"
                    disabled={!spot.disponible}
                    onClick={() => onSelectSpotForChat(spot)}
                    className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      spot.disponible
                        ? "border-emerald-200 bg-emerald-50/30 hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer"
                        : "border-rose-200 bg-rose-50/40 opacity-75 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold tracking-tight text-slate-900 font-mono">
                        {spot.codigo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          spot.disponible
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {spot.disponible ? "LIBRE" : "OCUPADO"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${typeInfo.badge}`}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                        {typeInfo.label}
                      </span>
                      {spot.disponible && (
                        <span className="text-xs font-medium text-blue-600">
                          Reservar →
                        </span>
                      )}
                    </div>
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
