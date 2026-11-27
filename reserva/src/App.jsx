import ParkingReservationModule from "./pages/ParkingReservationModule";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="font-bold tracking-wide text-sm uppercase text-blue-400">
            Privenari Park • Portal de Servicios
          </span>
          <nav className="flex items-center gap-6 text-xs text-slate-300">
            <span>Inicio</span>
            <span className="text-white font-semibold border-b-2 border-blue-500 py-4">
              Estacionamientos
            </span>
            <span>Tarifas y Normativa</span>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <ParkingReservationModule />
      </main>
    </div>
  );
}
