"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";
import type { SiteSettingsRow } from "@/lib/types/database";

function bumpAll() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/services");
  revalidatePath("/portfolio");
  revalidatePath("/blog");
}

// --------------------------- Clients ---------------------------
export type ClientInput = {
  id?: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  featured: boolean;
  display_order: number;
};

export async function upsertClient(input: ClientInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    name: input.name,
    logo_url: input.logo_url || null,
    website_url: input.website_url || null,
    featured: input.featured,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("clients").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("clients").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/clients");
  bumpAll();
  return { ok: true as const };
}

export async function deleteClient(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/clients");
  bumpAll();
  return { ok: true as const };
}

// --------------------------- Team ---------------------------
export type TeamMemberInput = {
  id?: string;
  name: string;
  role?: string;
  bio?: string;
  avatar_url?: string;
  links?: { label: string; url: string }[];
  display_order: number;
  active: boolean;
};

export async function upsertTeamMember(input: TeamMemberInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    name: input.name,
    role: input.role || null,
    bio: input.bio || null,
    avatar_url: input.avatar_url || null,
    links: input.links ?? [],
    display_order: input.display_order,
    active: input.active,
  };
  if (input.id) {
    const { error } = await sb.from("team_members").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("team_members").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/team");
  revalidatePath("/about");
  return { ok: true as const };
}

export async function deleteTeamMember(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("team_members").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/team");
  revalidatePath("/about");
  return { ok: true as const };
}

// --------------------------- Values ---------------------------
export type ValueInput = {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  display_order: number;
};

export async function upsertValue(input: ValueInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    title: input.title,
    description: input.description,
    icon: input.icon || null,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("values").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("values").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/values");
  revalidatePath("/about");
  return { ok: true as const };
}

export async function deleteValue(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("values").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/values");
  revalidatePath("/about");
  return { ok: true as const };
}

// --------------------------- Process steps ---------------------------
export type ProcessStepInput = {
  id?: string;
  step_number: string;
  phase_label?: string;
  title: string;
  description: string;
  duration?: string;
  service_id?: string;
  display_order: number;
};

export async function upsertProcessStep(input: ProcessStepInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    step_number: input.step_number,
    phase_label: input.phase_label || null,
    title: input.title,
    description: input.description,
    duration: input.duration || null,
    service_id: input.service_id || null,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("process_steps").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("process_steps").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/process");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteProcessStep(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("process_steps").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/process");
  revalidatePath("/");
  return { ok: true as const };
}

// --------------------------- Activity feed ---------------------------
export type ActivityInput = {
  id?: string;
  message: string;
  badge?: string;
  href?: string;
  occurred_at?: string;
};

export async function upsertActivity(input: ActivityInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    message: input.message,
    badge: input.badge || null,
    href: input.href || null,
    occurred_at: input.occurred_at || new Date().toISOString(),
  };
  if (input.id) {
    const { error } = await sb.from("activity_feed").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("activity_feed").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/activity");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteActivity(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("activity_feed").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/activity");
  revalidatePath("/");
  return { ok: true as const };
}

// --------------------------- Social links ---------------------------
export type SocialLinkInput = {
  id?: string;
  platform: string;
  url: string;
  display_order: number;
};

export async function upsertSocialLink(input: SocialLinkInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    platform: input.platform,
    url: input.url,
    display_order: input.display_order,
  };
  if (input.id) {
    const { error } = await sb.from("social_links").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: actionError(error) };
  } else {
    const { error } = await sb.from("social_links").insert(payload);
    if (error) return { ok: false, error: actionError(error) };
  }
  revalidatePath("/admin/social");
  bumpAll();
  return { ok: true as const };
}

export async function deleteSocialLink(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("social_links").delete().eq("id", id);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/social");
  bumpAll();
  return { ok: true as const };
}

// --------------------------- Site settings ---------------------------
export async function updateSiteSettings(input: Partial<SiteSettingsRow>) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("site_settings").update(input).eq("id", 1);
  if (error) return { ok: false, error: actionError(error) };
  revalidatePath("/admin/settings");
  bumpAll();
  return { ok: true as const };
}
