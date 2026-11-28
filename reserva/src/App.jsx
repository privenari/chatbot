import { useEffect, useRef, useState } from "react";
import { Mail, Phone, MapPin, Check } from "lucide-react";
import ParkingReservationModule from "./pages/ParkingReservationModule";
import { useReveal, Words } from "./components/Reveal";
import { Icon, IconSprite } from "./components/Icon";

function Header() {
  const hdr = useRef(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      hdr.current?.style.setProperty("--sp", h.scrollTop / Math.max(h.scrollHeight - h.clientHeight, 1));
      hdr.current?.classList.toggle("on", h.scrollTop > 8);
      h.style.setProperty("--sy", h.scrollTop);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header ref={hdr} className="hdr">
      <div className="hdr-in">
        <a href="#espacios" className="logo" aria-label="Privenari Park, inicio">
          <span className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path fill="#fff" d="M2.5 16.5v-4c0-.9.5-1.6 1.3-1.9l2.6-1 1.7-3.1c.3-.5.8-.8 1.4-.8h5c.6 0 1.1.3 1.4.8l1.7 3.1 2.6 1c.8.3 1.3 1 1.3 1.9v4z" />
              <path fill="#2a5c9a" d="M9.3 7.1h5.4l1.4 2.7H7.9z" />
              <circle cx="7" cy="17" r="2.3" fill="#14335a" stroke="#fff" strokeWidth="1.4" />
              <circle cx="17" cy="17" r="2.3" fill="#14335a" stroke="#fff" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="logo-text">Privenari Park</span>
        </a>
        <nav className="nav-d" aria-label="Principal">
          <a href="#espacios" className="lnk">Espacios</a>
          <a href="#contacto" className="lnk">Contacto</a>
        </nav>
        <button type="button" className="btn btn-lapis btn-sm hdr-cta"
          onClick={() => window.dispatchEvent(new Event("open-chat"))}>
          Reservar plaza <Icon name="arrow" size={18} />
        </button>
      </div>
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
        <div className="lapis-hero on-dark relative overflow-hidden text-white rounded-[36px] p-[clamp(28px,5vw,64px)] grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
          <div>
            <span className="kicker rv !text-[#BFD8C6]">Contacto</span>
            <h2 className="rvw mt-4 !text-white">
              <Words text="¿Necesitas un plan mensual?" />
              <br />
              <Words className="mel" start={4} text="Te respondemos el mismo día." />
            </h2>
            <ul className="mt-8 grid gap-3">
              {items.map(({ icon: I, label, value }, i) => (
                <li key={label} className="rv glass text-ink !rounded-2xl flex items-center gap-3 px-4 py-3" style={{ "--d": `${i * 90}ms` }}>
                  <span className="w-9 h-9 rounded-full bg-white grid place-items-center text-lapis"><I className="w-4 h-4" /></span>
                  <span className="text-sm"><span className="block text-mute">{label}</span><span className="font-semibold">{value}</span></span>
                </li>
              ))}
            </ul>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setSent(true); }}
            className="card rv text-ink p-6 sm:p-8 grid gap-4"
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
                <button className="btn btn-primary justify-center">Enviar mensaje</button>
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
      <IconSprite />
      <Header />
      <main>
        <ParkingReservationModule />
        <Contact />
      </main>
      <footer className="bg-[#0F2540] text-white/70 py-10 text-sm">
        <div className="wrap flex flex-wrap items-center justify-between gap-3">
          <span className="font-display font-semibold text-white">Privenari Park</span>
          <span>© {new Date().getFullYear()} Privenari Park. Todos los derechos reservados.</span>
        </div>
      </footer>
    </>
  );
}
