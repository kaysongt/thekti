"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { gradeAssessment } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="btn primary lg" type="submit" disabled={pending}>
      {pending ? "Recording grade…" : "Record grade"}
    </button>
  );
}

/** Written points out of 60 plus feedback; shows the total the student will see before saving. */
export default function GradeForm({
  submissionId,
  sectionAPoints,
  passMark,
  studentName,
}: {
  submissionId: string;
  sectionAPoints: number;
  passMark: number;
  studentName: string;
}) {
  const [written, setWritten] = useState("");
  const value = written === "" ? null : Number(written);
  const valid = value !== null && Number.isInteger(value) && value >= 0 && value <= 60;
  const total = valid ? sectionAPoints + value : null;

  return (
    <form action={gradeAssessment} className="grade-form">
      <input type="hidden" name="submissionId" value={submissionId} />
      <div className="grade-score-row">
        <div className="field">
          <label htmlFor="writtenPoints">Written points <span className="hint">out of 60</span></label>
          <input
            id="writtenPoints"
            name="writtenPoints"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            step={1}
            required
            value={written}
            onChange={(event) => setWritten(event.target.value)}
            aria-describedby="grade-total"
          />
        </div>
        <output id="grade-total" className={`grade-total${total === null ? "" : total >= passMark ? " is-pass" : " is-fail"}`} htmlFor="writtenPoints" aria-live="polite">
          <span>Final score</span>
          <strong className="num">{total === null ? "—" : `${total} / 100`}</strong>
          <small>{total === null ? `Section A ${sectionAPoints} + written` : total >= passMark ? `Passes the ${passMark}% mark` : `Below the ${passMark}% pass mark`}</small>
        </output>
      </div>
      <div className="field">
        <label htmlFor="feedback">Feedback for {studentName}</label>
        <textarea id="feedback" name="feedback" rows={6} required minLength={3} maxLength={3000} />
        <p className="hint">The student sees this with their score on My studies and on the course assessment page.</p>
      </div>
      <Submit />
    </form>
  );
}
