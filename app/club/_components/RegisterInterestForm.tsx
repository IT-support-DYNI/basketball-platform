"use client";

import { useRouter } from "next/navigation";
import { useReveal } from "./useReveal";

/**
 * The exported design's version of this form calls preventDefault() and
 * just flips a local "Thanks — we'll be in touch" message, with no backend
 * call at all — a guardian's email would be typed in and go nowhere, and
 * nobody at the club would ever see it. That's not something to ship on a
 * page collecting a child's name and a guardian's contact details, so this
 * validates the same two fields and then sends the visitor into the real
 * `/register` flow instead of pretending the form did something it didn't.
 */
export default function RegisterInterestForm() {
  const router = useRouter();
  const { ref, className, style } = useReveal(80);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const pname = form.elements.namedItem("pname") as HTMLInputElement;
    const gmail = form.elements.namedItem("gmail") as HTMLInputElement;
    if (!pname.value.trim() || !gmail.checkValidity()) {
      form.reportValidity();
      return;
    }
    router.push("/register");
  }

  return (
    <form
      className={`reg-form ${className}`}
      style={style}
      id="regform"
      ref={ref as React.Ref<HTMLFormElement>}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="field">
        <label htmlFor="pname">Player name</label>
        <input id="pname" name="pname" type="text" placeholder="First and last name" required />
      </div>
      <div className="field">
        <label htmlFor="gmail">Guardian email</label>
        <input id="gmail" name="gmail" type="email" placeholder="you@example.com" required />
      </div>
      <button className="btn btn-primary" type="submit">
        Start registration
      </button>
      <small>
        This takes you straight to registration — it only takes a few minutes, and every application is reviewed by
        the club before anyone gets full access.
      </small>
    </form>
  );
}
