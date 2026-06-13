"use client";

import { useRef, useState } from "react";

/**
 * Client half of the public-form spam defense (server half: src/lib/anti-spam.ts).
 *
 * - tracks how long the form has been on screen (a human-fill timer)
 * - holds the honeypot field's value
 *
 *   const guard = useFormGuard();
 *   // on submit:
 *   submit({ ...fields, hp: guard.hp, elapsedMs: guard.elapsedMs() });
 *   // in the form JSX:
 *   <Honeypot {...guard.honeypotProps} />
 */
export function useFormGuard() {
  const mountedAt = useRef(Date.now());
  const [hp, setHp] = useState("");
  return {
    hp,
    elapsedMs: () => Date.now() - mountedAt.current,
    honeypotProps: { value: hp, onChange: setHp },
  };
}

/**
 * A field hidden from real users but tempting to auto-fill bots. Pulled fully
 * out of the visual + accessibility tree; any value submitted means a bot.
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden"
    >
      <label>
        Company website
        <input
          type="text"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
