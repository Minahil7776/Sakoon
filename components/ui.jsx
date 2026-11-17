"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
export function Smooth() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis(); let id;
    const raf = (t) => { l.raf(t); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); l.destroy(); };
  }, []);
  return null;
}
export function Reveal({ children, delay = 0, as: T = "div", ...p }) {
  const M = motion[T];
  return <M initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: .9, delay, ease: [.2, .7, .2, 1] }} {...p}>{children}</M>;
}
export function Parallax({ children, from = 40, to = -40, className, style }) {
  const r = useRef(null);
  const { scrollYProgress } = useScroll({ target: r, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  return <motion.div ref={r} style={{ y, ...style }} className={className}>{children}</motion.div>;
}
export const Float = ({ children, d = 0, className, style }) => (
  <motion.div className={className} style={style} animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, delay: d, ease: "easeInOut" }}>{children}</motion.div>
);
export const Pill = ({ children }) => <span className="pill">{children}</span>;
export const Avatar = ({ name, hue }) => (
  <span className="avatar" style={{ background: `linear-gradient(145deg,hsl(${hue} 40% 82%),hsl(${hue + 30} 35% 62%))` }} aria-hidden>{name.split(" ").pop()[0]}</span>
);
