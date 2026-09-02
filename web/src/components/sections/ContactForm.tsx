"use client";

import { useEffect, useRef, useState } from "react";

import { ContactInputSchema } from "@portfolio/shared";

import { CheckIcon, SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Status = "idle" | "submitting" | "sent" | "error";

const FIELDS = ["name", "email", "subject", "message"] as const;
type FieldName = (typeof FIELDS)[number];

const inputClass =
  "w-full rounded-xl border border-[rgb(255_255_255/0.09)] bg-[rgb(255_255_255/0.035)] px-4 py-[14px] text-[13.5px] text-ink outline-none transition-colors duration-200 placeholder:text-[rgb(244_245_246/0.28)] focus:border-[rgb(255_255_255/0.32)] focus:bg-[rgb(255_255_255/0.06)] aria-[invalid=true]:border-[rgb(248_113_113/0.55)]";

const labelClass =
  "mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Stamped after mount rather than during render: reading the clock while
  // rendering makes the component non-idempotent, and the value is only needed
  // once the visitor actually submits.
  const mountedAt = useRef(0);
  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  // The success state is not permanent: after a while the form comes back so a
  // second message doesn't require a page reload.
  useEffect(() => {
    if (status !== "sent") return;
    const timer = setTimeout(() => setStatus("idle"), 6000);
    return () => clearTimeout(timer);
  }, [status]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
      // Omitted rather than sent as a bogus 0 if the mount effect somehow
      // hasn't run — the server skips the timing check when it's absent.
      elapsedMs: mountedAt.current ? Date.now() - mountedAt.current : undefined,
    };

    // Validated here with the *same* schema the API uses, so the visitor gets
    // an instant answer and the two can never disagree about what's valid.
    const parsed = ContactInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && FIELDS.includes(key as FieldName)) {
          nextErrors[key as FieldName] ??= issue.message;
        }
      }
      setErrors(nextErrors);
      setFormError(null);
      setStatus("idle");
      return;
    }

    setErrors({});
    setFormError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: { message?: string; fields?: Record<string, string> } }
          | null;

        if (body?.error?.fields) {
          const nextErrors: Partial<Record<FieldName, string>> = {};
          for (const [key, message] of Object.entries(body.error.fields)) {
            if (FIELDS.includes(key as FieldName)) nextErrors[key as FieldName] = message;
          }
          setErrors(nextErrors);
        }
        setFormError(body?.error?.message ?? "That didn't go through. Please try again.");
        setStatus("error");
        return;
      }

      formRef.current?.reset();
      mountedAt.current = Date.now();
      setStatus("sent");
    } catch {
      setFormError("Couldn't reach the server. Please email me directly instead.");
      setStatus("error");
    }
  }

  const busy = status === "submitting";

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="flex flex-[2_1_360px] flex-col gap-[14px] rounded-panel border border-[rgb(255_255_255/0.075)] bg-gradient-to-br from-[rgb(31_33_37/0.6)] to-[rgb(13_14_16/0.5)] p-[clamp(20px,3vw,30px)] shadow-panel backdrop-blur-[var(--glass-blur)]"
    >
      {/*
        Honeypot. Hidden from sight and from assistive technology, and skipped
        by the tab order — only an autofilling bot ever reaches it.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label htmlFor="contact-company">Company</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[14px]">
        <Field id="name" label="Name" error={errors.name}>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={inputClass}
          />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field id="subject" label="Subject" error={errors.subject}>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          placeholder="What's this about?"
          aria-invalid={Boolean(errors.subject)}
          aria-describedby={errors.subject ? "contact-subject-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="A few sentences about what you have in mind."
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(inputClass, "resize-y leading-[1.6]")}
        />
      </Field>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "m-0 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.14em]",
            status === "error" ? "text-[#f87171]" : "text-ink-ghost",
          )}
        >
          {formError ??
            (status === "sent"
              ? "Thanks — I'll be in touch."
              : "PGP available on request")}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-pill bg-ink px-[26px] py-[13px] font-mono text-[12.5px] font-semibold leading-none tracking-[0.04em] text-void transition-all duration-200 hover:-translate-y-px hover:shadow-[0_12px_30px_rgb(255_255_255/0.16)] disabled:cursor-progress disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {busy ? (
            <>
              <SpinnerIcon className="size-[13px] animate-spin" />
              Sending
            </>
          ) : status === "sent" ? (
            <>
              <CheckIcon className="size-[13px]" />
              Sent
            </>
          ) : (
            "Send message"
          )}
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: FieldName;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* The design had placeholder-only fields, which vanish the moment you
          start typing and are invisible to screen readers. */}
      <label htmlFor={`contact-${id}`} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`contact-${id}-error`} className="m-0 mt-2 text-[12px] text-[#f87171]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
