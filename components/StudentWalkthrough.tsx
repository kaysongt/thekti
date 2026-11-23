"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "kti.student-walkthrough.v2";
const CHANGE_EVENT = "kti-walkthrough-change";

/**
 * Every step names a `data-tour` target on My studies. Steps whose target is
 * not on this student's page (no payment due, no results yet, not in
 * Believers Training) are skipped, so the tour never points at nothing.
 */
export const WALKTHROUGH_STEPS = [
  { target: "programs", title: "Your programs", body: "Each program you belong to has its own section on this page. Tap a name to jump to it." },
  { target: "next-step", title: "Your next step", body: "This card shows the one thing to do next, chosen from your progress, payments, and release dates. It updates as you study." },
  { target: "results", title: "Grading and feedback", body: "Submitted assessments waiting for your instructor, and your latest result with feedback, appear here." },
  { target: "modules", title: "Your modules", body: "Each module says whether it is available, awaiting payment, scheduled, or completed, and what you can do now." },
  { target: "payment", title: "Complete your enrollment", body: "Pay tuition by card or bank transfer, apply a full-tuition code, or apply for a scholarship here." },
  { target: "weekly-video", title: "This week’s video", body: "Dr. Kay’s latest student update. Press play whenever you are ready." },
  { target: "believers-path", title: "Believers Training classes", body: "Your seven classes in order, and the printable final assessment to take with your church." },
  { target: "community", title: "Learn together", body: "Ask questions and share reflections with classmates and instructors in the community groups." },
] as const;

const selector = (target: string) => `[data-tour='${target}']`;

function markSeen() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "complete");
  } catch {
    /* storage unavailable: the tour simply shows again next visit */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

type Box = { top: number; left: number; width: number; height: number; cardAtTop: boolean };

export default function StudentWalkthrough() {
  const [manual, setManual] = useState<boolean | null>(null);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLElement>(null);
  // Optional: the tour opens only when the student asks for it, never over their next step.
  const open = manual ?? false;

  // Only steps whose control is on this student's page, in the order the page shows them.
  const steps = open && typeof document !== "undefined"
    ? WALKTHROUGH_STEPS
      .map((item) => ({ item, element: document.querySelector(selector(item.target)) }))
      .filter((entry): entry is { item: (typeof WALKTHROUGH_STEPS)[number]; element: Element } => Boolean(entry.element))
      .sort((a, b) => (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .map((entry) => entry.item)
    : [];
  const current = steps[Math.min(step, Math.max(0, steps.length - 1))];
  const target = current?.target ?? null;

  function close() {
    markSeen();
    setManual(false);
    replay.current?.focus();
  }

  useEffect(() => {
    if (!open || !target) return;
    const measure = () => {
      const element = document.querySelector(selector(target));
      if (!element) return setBox(null);
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      const cardHeight = (card.current?.offsetHeight ?? 200) + 32;
      let top = Math.max(rect.top, 0);
      let bottom = Math.min(rect.bottom, viewport);
      // Keep the card off the highlighted control: a target low on screen sends the card up,
      // and a target taller than the space left is highlighted only where it is visible.
      const cardAtTop = rect.top > viewport * 0.5;
      if (cardAtTop) top = Math.max(top, 76 + cardHeight - 20);
      else bottom = Math.min(bottom, viewport - cardHeight);
      setBox({
        top: top - 6,
        left: Math.max(rect.left - 6, 4),
        width: Math.min(rect.width + 12, window.innerWidth - 8),
        height: Math.max(bottom - top + 12, 0),
        cardAtTop,
      });
    };
    const element = document.querySelector(selector(target));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    const settle = window.setTimeout(measure, reduce ? 0 : 380);
    const frame = window.requestAnimationFrame(measure);
    heading.current?.focus();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.clearTimeout(settle);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      markSeen();
      setManual(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !current) {
    return (
      <button ref={replay} className="walkthrough-replay text-link" type="button" onClick={() => { setStep(0); setBox(null); setManual(true); }}>
        Take the tour of this page
      </button>
    );
  }

  const index = steps.indexOf(current);
  const last = index === steps.length - 1;
  return (
    <div className="walkthrough-layer" role="dialog" aria-modal="true" aria-labelledby="walkthrough-title">
      <div className="walkthrough-dim" onClick={close} />
      {box ? <div className="walkthrough-focus" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} /> : null}
      <section ref={card} className={`walkthrough-card${box?.cardAtTop ? " at-top" : ""}`}>
        <p className="walkthrough-progress">Step {index + 1} of {steps.length}</p>
        <h2 id="walkthrough-title" ref={heading} tabIndex={-1}>{current.title}</h2>
        <p>{current.body}</p>
        <div className="walkthrough-actions">
          <button type="button" className="btn quiet sm" onClick={close}>Skip tour</button>
          {index > 0 ? <button type="button" className="btn sm" onClick={() => setStep(index - 1)}>Back</button> : null}
          <button type="button" className="btn primary sm" onClick={() => (last ? close() : setStep(index + 1))}>{last ? "Finish" : "Next"}</button>
        </div>
      </section>
    </div>
  );
}
