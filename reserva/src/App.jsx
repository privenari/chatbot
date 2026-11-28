import { useEffect, useRef, useState } from "react";
import { Mail, Phone, MapPin, Check } from "lucide-react";
import ParkingReservationModule from "./pages/ParkingReservationModule";
import { useReveal, Words } from "./components/Reveal";

function Header() {
  const bar = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[rgba(251,250,246,.78)] backdrop-blur-xl border-b border-line">
      <div className="wrap h-16 flex items-center justify-between">
        <a href="#espacios" className="font-display font-semibold tracking-tight text-lg">
          Privenari <span className="text-lapis">Park</span>
        </a>
        <nav className="flex items-center gap-6 text-sm font-medium text-mute">
          <a href="#espacios" className="hover:text-ink transition">Espacios</a>
          <a href="#contacto" className="btn btn-ink !py-2 !px-4 !text-sm">Contacto</a>
        </nav>
      </div>
      <div ref={bar} className="h-[2px] bg-lapis origin-left scale-x-0" />
    </header>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  const items = [
    { icon: Phone, label: "Teléfono", value: "+56 45 200 0000" },
    { icon: Mail, label: "Correo", value: "reservas@privenari.cl" },
    { icon: MapPin, label: "Dirección", value: "Av. Alemania 0100, Temuco" },
  ];
  return (
    <section id="contacto" className="sec">
      <div className="wrap">
        <div className="grad-sage rounded-[36px] p-[clamp(28px,5vw,64px)] grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
          <div>
            <span className="kicker rv">Contacto</span>
            <h2 className="rvw mt-4">
              <Words text="¿Necesitas un plan mensual?" />
              <br />
              <Words className="text-lapis" start={4} text="Te respondemos el mismo día." />
            </h2>
            <ul className="mt-8 grid gap-3">
              {items.map(({ icon: I, label, value }, i) => (
                <li key={label} className="rv glass !rounded-2xl flex items-center gap-3 px-4 py-3" style={{ "--d": `${i * 90}ms` }}>
                  <span className="w-9 h-9 rounded-full bg-white grid place-items-center text-lapis"><I className="w-4 h-4" /></span>
                  <span className="text-sm"><span className="block text-mute">{label}</span><span className="font-semibold">{value}</span></span>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="card rv p-6 sm:p-8 grid gap-4"
          >
            {sent ? (
              <div className="py-10 text-center">
                <span className="mx-auto w-12 h-12 rounded-full bg-sage text-white grid place-items-center"
                  style={{ animation: "pop .6s cubic-bezier(.3,1.6,.5,1) both" }}><Check className="w-6 h-6" /></span>
                <h3 className="mt-4">Mensaje enviado</h3>
                <p className="text-mute text-sm mt-1">Te escribiremos al correo indicado.</p>
              </div>
            ) : (
              <>
                <label className="grid gap-1.5 text-sm font-medium">Nombre<input required className="field" /></label>
                <label className="grid gap-1.5 text-sm font-medium">Correo<input required type="email" className="field" /></label>
                <label className="grid gap-1.5 text-sm font-medium">Mensaje<textarea required rows={4} className="field resize-none" /></label>
                <button className="btn btn-ink justify-center">Enviar mensaje</button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  useReveal();
  return (
    <>
      <Header />
      <main className="pt-16">
        <ParkingReservationModule />
        <Contact />
      </main>
      <footer className="border-t border-line py-10 text-sm text-mute">
        <div className="wrap flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-semibold text-ink">Privenari Park</span>
          <span>© {new Date().getFullYear()} Privenari Park. Todos los derechos reservados.</span>
        </div>
      </footer>
    </>
  );
}
