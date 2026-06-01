/**
 * Transactional email — Resend wrapper.
 *
 * Two pairs of emails:
 *   1. Booking submission → admin notification + submitter confirmation
 *   2. Contact form        → admin notification + submitter confirmation
 *
 * Everything degrades gracefully: if Resend isn't configured (missing API
 * key or "from" address), we log the intended email and return success so
 * the user-facing form still finishes cleanly. Emails NEVER block the DB
 * write — the database is the source of truth; email is best-effort.
 *
 * Config (set in .env.local):
 *   RESEND_API_KEY            — from resend.com/api-keys
 *   EMAIL_FROM                — "Trellee <hello@trellee.com>" (domain must
 *                                be verified in Resend → Domains)
 *   ADMIN_OWNER_EMAIL         — where admin notifications go (already used
 *                                for the admin auth gate)
 *   NEXT_PUBLIC_SITE_URL      — used in email links + footer
 */

import { Resend } from "resend";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "Trellee";

type EmailConfig = {
  resend: Resend;
  from: string;
  adminTo: string;
};

/** Returns a Resend client + addresses, or null if email isn't configured. */
function getEmailConfig(): EmailConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const adminTo = process.env.ADMIN_OWNER_EMAIL;

  if (!apiKey || apiKey.startsWith("re_PLACEHOLDER")) return null;
  if (!from || !adminTo) return null;

  return { resend: new Resend(apiKey), from, adminTo };
}

/** Whether emails will actually be sent. Useful for UI hints. */
export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

// ---------- Booking ----------

export type BookingEmailPayload = {
  id: string | null;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: string;
  service_title?: string;
  service_slug?: string;
  time_slot_at?: string;
  timezone?: string;
};

export async function sendBookingEmails(payload: BookingEmailPayload) {
  const cfg = getEmailConfig();
  if (!cfg) {
    console.info("[email] booking emails skipped (not configured):", payload);
    return;
  }

  // Send in parallel; ignore individual failures so one bad address doesn't
  // block the other. Both run with Promise.allSettled so the action server
  // call can await this without ever throwing.
  const tasks = [
    safeSend("admin booking notification", () =>
      cfg.resend.emails.send({
        from: cfg.from,
        to: cfg.adminTo,
        replyTo: payload.email,
        subject: `New booking · ${payload.name}${
          payload.service_title ? ` · ${payload.service_title}` : ""
        }`,
        html: renderBookingAdminHtml(payload),
        text: renderBookingAdminText(payload),
      }),
    ),
    safeSend("booking submitter confirmation", () =>
      cfg.resend.emails.send({
        from: cfg.from,
        to: payload.email,
        replyTo: cfg.adminTo,
        subject: `We got your call request — Trellee`,
        html: renderBookingSubmitterHtml(payload),
        text: renderBookingSubmitterText(payload),
      }),
    ),
  ];
  await Promise.allSettled(tasks);
}

function renderBookingAdminHtml(p: BookingEmailPayload): string {
  return layout(
    "New booking",
    `
    <p>Someone just booked a call.</p>
    ${row("Name", esc(p.name))}
    ${row("Email", `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`)}
    ${p.company ? row("Company", esc(p.company)) : ""}
    ${p.phone ? row("Phone", esc(p.phone)) : ""}
    ${p.service_title ? row("Service", esc(p.service_title)) : ""}
    ${p.time_slot_at ? row("Time slot", `${esc(p.time_slot_at)} ${p.timezone ? `(${esc(p.timezone)})` : ""}`) : ""}
    ${p.notes ? row("Notes", esc(p.notes)) : ""}
    <p style="margin-top:24px;">
      <a href="${SITE_URL}/admin/bookings" class="btn">Open in admin</a>
    </p>
  `,
  );
}

function renderBookingAdminText(p: BookingEmailPayload): string {
  return [
    "New booking",
    "",
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    p.company ? `Company: ${p.company}` : null,
    p.phone ? `Phone: ${p.phone}` : null,
    p.service_title ? `Service: ${p.service_title}` : null,
    p.time_slot_at
      ? `Time slot: ${p.time_slot_at}${p.timezone ? ` (${p.timezone})` : ""}`
      : null,
    p.notes ? `Notes: ${p.notes}` : null,
    "",
    `Admin: ${SITE_URL}/admin/bookings`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderBookingSubmitterHtml(p: BookingEmailPayload): string {
  return layout(
    "We got your call request",
    `
    <p>Hi ${esc(firstName(p.name))},</p>
    <p>
      Thanks for reaching out about
      ${p.service_title ? `<strong>${esc(p.service_title)}</strong>.` : "a project."}
      We've got your request and one of us will be in touch within one
      business day to confirm a time that works.
    </p>
    ${p.notes ? `<p style="color:#7a808a;">You wrote:</p><blockquote style="margin:0;padding:8px 12px;border-left:2px solid #4ed5a8;color:#aab0b8;">${esc(p.notes)}</blockquote>` : ""}
    <p>In the meantime, the work speaks loudest:</p>
    <p>
      <a href="${SITE_URL}/portfolio" class="btn">See recent ships</a>
    </p>
    <p style="color:#7a808a;margin-top:32px;">
      Just reply to this email if you need to add anything.<br>
      — Team Trellee
    </p>
  `,
  );
}

function renderBookingSubmitterText(p: BookingEmailPayload): string {
  return [
    `Hi ${firstName(p.name)},`,
    "",
    `Thanks for reaching out${p.service_title ? ` about ${p.service_title}` : ""}.`,
    "We've got your request and one of us will be in touch within one business day to confirm a time.",
    "",
    p.notes ? `You wrote: ${p.notes}` : null,
    "",
    `See recent ships: ${SITE_URL}/portfolio`,
    "",
    "Reply to this email if you need to add anything.",
    "— Team Trellee",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------- Contact ----------

export type ContactEmailPayload = {
  id: string | null;
  name: string;
  email: string;
  company?: string;
  budget?: string;
  services?: string[];
  message: string;
  source?: string;
};

export async function sendContactEmails(payload: ContactEmailPayload) {
  const cfg = getEmailConfig();
  if (!cfg) {
    console.info("[email] contact emails skipped (not configured):", payload);
    return;
  }

  const tasks = [
    safeSend("admin contact notification", () =>
      cfg.resend.emails.send({
        from: cfg.from,
        to: cfg.adminTo,
        replyTo: payload.email,
        subject: `New brief · ${payload.name}${
          payload.company ? ` · ${payload.company}` : ""
        }`,
        html: renderContactAdminHtml(payload),
        text: renderContactAdminText(payload),
      }),
    ),
    safeSend("contact submitter confirmation", () =>
      cfg.resend.emails.send({
        from: cfg.from,
        to: payload.email,
        replyTo: cfg.adminTo,
        subject: `We got your brief — Trellee`,
        html: renderContactSubmitterHtml(payload),
        text: renderContactSubmitterText(payload),
      }),
    ),
  ];
  await Promise.allSettled(tasks);
}

function renderContactAdminHtml(p: ContactEmailPayload): string {
  return layout(
    "New brief",
    `
    <p>New contact form submission.</p>
    ${row("Name", esc(p.name))}
    ${row("Email", `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`)}
    ${p.company ? row("Company", esc(p.company)) : ""}
    ${p.budget ? row("Budget", esc(p.budget)) : ""}
    ${p.services && p.services.length > 0 ? row("Services", esc(p.services.join(", "))) : ""}
    ${row("Message", esc(p.message).replace(/\n/g, "<br>"))}
    <p style="margin-top:24px;">
      <a href="${SITE_URL}/admin/leads" class="btn">Open in admin</a>
    </p>
  `,
  );
}

function renderContactAdminText(p: ContactEmailPayload): string {
  return [
    "New brief",
    "",
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    p.company ? `Company: ${p.company}` : null,
    p.budget ? `Budget: ${p.budget}` : null,
    p.services && p.services.length > 0
      ? `Services: ${p.services.join(", ")}`
      : null,
    "",
    "Message:",
    p.message,
    "",
    `Admin: ${SITE_URL}/admin/leads`,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderContactSubmitterHtml(p: ContactEmailPayload): string {
  return layout(
    "We got your brief",
    `
    <p>Hi ${esc(firstName(p.name))},</p>
    <p>
      Thanks for the brief. We read every message ourselves — no autoresponder
      black hole. A real human will reply within one business day, typically
      much sooner.
    </p>
    <p style="color:#7a808a;">Your message:</p>
    <blockquote style="margin:0;padding:8px 12px;border-left:2px solid #4ed5a8;color:#aab0b8;">
      ${esc(p.message).replace(/\n/g, "<br>")}
    </blockquote>
    <p style="margin-top:24px;">
      If you'd rather just grab a 30-minute slot directly:
    </p>
    <p>
      <a href="${SITE_URL}/book" class="btn">Book a call</a>
    </p>
    <p style="color:#7a808a;margin-top:32px;">
      — Team Trellee
    </p>
  `,
  );
}

function renderContactSubmitterText(p: ContactEmailPayload): string {
  return [
    `Hi ${firstName(p.name)},`,
    "",
    "Thanks for the brief. We read every message ourselves — no autoresponder black hole.",
    "A real human will reply within one business day.",
    "",
    "Your message:",
    p.message,
    "",
    `Or grab a 30-minute call slot: ${SITE_URL}/book`,
    "",
    "— Team Trellee",
  ].join("\n");
}

// ---------- Website monitor alert ----------

export type MonitorAlertPayload = {
  label: string;
  url: string;
  isUp: boolean;
  statusCode?: number | null;
  error?: string | null;
};

/** Sends an up/down alert to the admin. No-op (logged) if email isn't set up. */
export async function sendMonitorAlert(p: MonitorAlertPayload) {
  const cfg = getEmailConfig();
  if (!cfg) {
    console.info("[email] monitor alert skipped (not configured):", p);
    return;
  }
  const dot = p.isUp ? "🟢" : "🔴";
  const state = p.isUp ? "back UP" : "DOWN";
  await safeSend("monitor alert", () =>
    cfg.resend.emails.send({
      from: cfg.from,
      to: cfg.adminTo,
      subject: `${dot} ${p.label} is ${state}`,
      html: layout(
        `${p.label} is ${state}`,
        `
        <p><strong>${esc(p.label)}</strong> is ${p.isUp ? "back online" : "down"}.</p>
        ${row("URL", `<a href="${esc(p.url)}">${esc(p.url)}</a>`)}
        ${p.statusCode != null ? row("HTTP status", String(p.statusCode)) : ""}
        ${p.error ? row("Error", esc(p.error)) : ""}
        <p style="margin-top:24px;">
          <a href="${SITE_URL}/admin/monitor" class="btn">Open the monitor</a>
        </p>
      `,
      ),
      text: `${p.label} is ${state}\n\nURL: ${p.url}\n${
        p.statusCode != null ? `HTTP status: ${p.statusCode}\n` : ""
      }${p.error ? `Error: ${p.error}\n` : ""}\nMonitor: ${SITE_URL}/admin/monitor`,
    }),
  );
}

// ---------- Newsletter ----------

/**
 * On a newsletter signup: optionally add the contact to a Resend audience
 * (if RESEND_AUDIENCE_ID is set) and notify the owner. The DB row is the
 * source of truth; this is best-effort and never throws.
 */
export async function notifyNewsletterSignup(email: string, source?: string) {
  const cfg = getEmailConfig();
  if (!cfg) {
    console.info("[email] newsletter signup (not configured):", email);
    return;
  }
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    await safeSend("newsletter audience add", () =>
      cfg.resend.contacts.create({ email, audienceId, unsubscribed: false }),
    );
  }
  await safeSend("newsletter admin notification", () =>
    cfg.resend.emails.send({
      from: cfg.from,
      to: cfg.adminTo,
      replyTo: email,
      subject: `New subscriber · ${email}`,
      html: layout(
        "New newsletter subscriber",
        `${row("Email", `<a href="mailto:${esc(email)}">${esc(email)}</a>`)}${
          source ? row("Source", esc(source)) : ""
        }`,
      ),
      text: `New subscriber: ${email}${source ? `\nSource: ${source}` : ""}`,
    }),
  );
}

// ---------- helpers ----------

/**
 * Wraps a Resend send call so failures log but never throw. Returns the same
 * shape (success/failure object) but the caller doesn't have to care.
 */
async function safeSend(label: string, fn: () => Promise<unknown>) {
  try {
    const result = await fn();
    if (
      result &&
      typeof result === "object" &&
      "error" in result &&
      (result as { error: unknown }).error
    ) {
      console.error(`[email] ${label} returned error:`, (result as { error: unknown }).error);
    }
    return result;
  } catch (err) {
    console.error(`[email] ${label} threw:`, err);
    return null;
  }
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "there";
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, valueHtml: string): string {
  return `
    <div style="display:block;margin:8px 0;">
      <span style="display:inline-block;min-width:90px;color:#7a808a;font-size:13px;">${esc(label)}:</span>
      <span style="color:#f5f6f7;">${valueHtml}</span>
    </div>
  `;
}

/**
 * Shared email wrapper — dark-themed to match the site. Email clients are
 * famously stingy about CSS, so we inline everything and use table-based
 * layout for max compatibility. Most modern clients (Gmail, Apple Mail,
 * Outlook 365) handle this fine.
 */
function layout(title: string, body: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)} — ${SITE_NAME}</title>
  </head>
  <body style="margin:0;padding:0;background:#06070a;color:#f5f6f7;font-family:-apple-system,Segoe UI,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06070a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0c1014;border:1px solid #1c222b;border-radius:14px;padding:32px;">
            <tr>
              <td>
                <div style="font-weight:800;font-size:20px;letter-spacing:-1px;color:#f5f6f7;margin-bottom:24px;">
                  ${SITE_NAME}<span style="color:#4ed5a8;">.</span>
                </div>
                <h1 style="font-size:24px;line-height:1.25;margin:0 0 16px;color:#f5f6f7;">${esc(title)}</h1>
                <div style="font-size:15px;line-height:1.6;color:#c8ccd2;">
                  ${body}
                </div>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;color:#5a6066;">
            ${SITE_NAME} · <a href="${SITE_URL}" style="color:#7a808a;">${SITE_URL.replace(/^https?:\/\//, "")}</a>
          </p>
        </td>
      </tr>
    </table>
    <style>
      .btn {
        display:inline-block;padding:10px 16px;border-radius:8px;
        background:#f5f6f7;color:#06070a !important;text-decoration:none;
        font-weight:500;font-size:14px;
      }
    </style>
  </body>
</html>`;
}
