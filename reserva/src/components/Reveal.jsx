import { useEffect, useState } from "react";

/** Activa .in en los elementos .rv / .rvw cuando entran al viewport. */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".rv, .rvw").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Envuelve cada palabra en <span class="w"> con retraso escalonado (--i). */
export function Words({ text, start = 0, className = "" }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="w" style={{ "--i": i + start }}>{w}</span>{" "}
        </span>
      ))}
    </span>
  );
}

/** Cuenta animada hasta `value`. */
export function useCountUp(value, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf, t0;
    const from = n;
    const tick = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / ms, 1);
      setN(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ms]);
  return n;
}
