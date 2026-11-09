"use client";
import { useFormStatus } from "react-dom";
export default function AdminSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn primary" type="submit" disabled={pending} aria-disabled={pending}>{pending ? "Saving…" : label}</button>;
}
