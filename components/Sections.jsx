"use client";
import Link from "next/link";
import { Reveal, Parallax, Float, Pill, Avatar } from "./ui";

export function Nav() {
  const L = [["Home", "#top"], ["How It Works", "#how"], ["Psychologists", "#team"], ["About Us", "#about"], ["Contact", "#contact"]];
  return (
    <header className="nav"><a href="#top" className="logo" aria-label="Sakoon home">sakoon</a>
      <nav aria-label="Primary">{L.map(([t, h]) => <a key={t} href={h}>{t}</a>)}</nav>
      <div className="navr"><Link href="/login" className="btn ghost">Login</Link><Link href="/register" className="btn solid">Get Started</Link></div>
    </header>
  );
}

export function Hero() {
  return (  
      <section id="top" className="hero">
      
      
      <div className="slab s1" /><div className="slab s2" />
      <Reveal as="h1" className="h1">Your mind deserves<br />a safe space.</Reveal>
      <Reveal delay={.2} className="heroIntro"><p>Sakoon connects you with verified psychologists for private, one-to-one online consultations.</p></Reveal>
      <Reveal delay={.3} className="heroAction"><Link href="/register" className="btn solid big">Start Your Journey</Link></Reveal>
      <Parallax className="brainWrap" from={0} to={-80}>
        <img src="/Brain.jfif" alt="Glowing brain illustration" className="brainImage" />
      </Parallax>
      <section className="heroHighlights" aria-label="Consultation highlights">
      <Float className="fl f1" d={0}><Avatar name="Dr Amna Rauf" hue={250} /><div><b>Dr. Amna Rauf</b><small>Anxiety & trauma</small></div></Float>
      <Float className="fl f2" d={1}><small>Upcoming</small><b>Thu, 4:30 pm</b><small>Video session · 50 min</small></Float>
      <Float className="fl f3" d={2}><i className="dot" /> Online now</Float>
      <Float className="fl f4" d={.5}><b>4.9</b><small>verified rating</small></Float>
    </section>
      
    </section>
    
    
      );
}

export function Intro() {
  return (
    
    <section id="about" className="intro">
      <Reveal as="h2" className="h2">Taking care of your mental health should feel simple.</Reveal>
      <Parallax className="introNote" from={60} to={-30}><p>No waiting rooms. No phone tag. Find a psychologist, pick a time, and talk from wherever you feel safe.</p></Parallax>
      
      <Parallax className="introBlob" from={-30} to={50}><span /></Parallax>
    </section>
  );
}

const STEPS = [["01", "Find your psychologist", "Browse qualified professionals by expertise."], ["02", "Book your session", "Choose a date and time that suits you."], ["03", "Connect and talk", "Meet in a secure, private video room."]];
export function How() {
  return (
    <section id="how" className="how">
      {STEPS.map(([n, t, d], i) => (
        <div key={n} className={`step st${i}`}>
          <Parallax from={50} to={-50} className="num" style={{}}>{n}</Parallax>
          <Reveal className="stepT"><Pill>{t}</Pill><p>{d}</p></Reveal>
        </div>))}
    </section>
  );
}

const FEATS = [
  ["Discover psychologists", "Profiles with expertise, languages and next availability.", <><b>Filter</b><span>Anxiety</span><span>Couples</span><span>Urdu</span></>],
  ["Schedule and manage", "Book, reschedule or cancel in two taps.", <><b>November</b><span>Thu 19 · 4:30 pm</span><span>Mon 23 · 11:00 am</span></>],
  ["Secure video sessions", "Encrypted calls with no downloads.", <><b>Session room</b><span>● End-to-end encrypted</span></>],
  ["Dashboards and history", "Patients and psychologists each get their own view.", <><b>Past sessions</b><span>12 Nov · Follow-up</span><span>29 Oct · First visit</span></>],
  ["Messages and payment", "Message between sessions and pay online.", <><b>Rs 4,500</b><span>Paid · Receipt sent</span></>],
];
export function Features() {
  return (
    <section className="feat">
      <Reveal as="h2" className="h2 sm">One calm place for the whole consultation.</Reveal>
      <div className="featRow">{FEATS.map(([t, d, ui], i) => (
        <Parallax key={t} from={20 * (i % 2 ? 1 : -1) * 2} to={-20 * (i % 2 ? 1 : -1) * 2} className={`ft ft${i}`}>
          <div className="panel">{ui}</div><h3>{t}</h3><p>{d}</p>
        </Parallax>))}</div>
    </section>
  );
}

const DOCS = [["Dr. Amna Rauf", "Anxiety & trauma", "11 yrs", "Today, 4:30 pm", 250], ["Dr. Bilal Qureshi", "Depression & grief", "8 yrs", "Tomorrow, 10:00 am", 210], ["Dr. Hina Saeed", "Couples & family", "14 yrs", "Fri, 2:00 pm", 285]];
export function Team() {
  return (
    <section id="team" className="team">
      <Reveal as="h2" className="h2 sm">People who listen for a living.</Reveal>
      {DOCS.map(([n, s, e, a, h], i) => (
        <Reveal key={n} className={`doc d${i}`}>
          <Avatar name={n} hue={h} />
          <div><h3>{n}</h3><p>{s} · {e} experience</p><small>Next available: {a}</small></div>
          <Link href={`/psychologists/${n.split(" ").pop().toLowerCase()}/book`} className="btn ghost">Book a session</Link>
        </Reveal>))}
    </section>
  );
}

export function Final() {
  return (
    <section className="final">
      <Reveal as="h2" className="h2">Your mental well-being matters. Start with one conversation.</Reveal>
      <Reveal delay={.15}><p>Your first session can be booked in under two minutes.</p><Link href="/register" className="btn solid big">Start Your Journey</Link></Reveal>
    </section>
  );
}

export function Footer() {
  const C = (t, l) => <div><h4>{t}</h4>{l.map(([a, h]) => <a key={a} href={h}>{a}</a>)}</div>;
  return (
    <footer id="contact" className="foot">
      <div><div className="logo">sakoon</div><p>Private online consultations with verified psychologists.</p></div>
      {C("Explore", [["How it works", "#how"], ["Psychologists", "#team"], ["About", "#about"]])}
      {C("Patients", [["Help centre", "/help"], ["Crisis support", "/support"], ["Login", "/login"]])}
      {C("Legal", [["Privacy", "/privacy"], ["Terms", "/terms"]])}
      {C("Contact", [["hello@sakoon.health", "mailto:hello@sakoon.health"], ["Instagram", "https://instagram.com"], ["LinkedIn", "https://linkedin.com"]])}
    </footer>
  );
}
