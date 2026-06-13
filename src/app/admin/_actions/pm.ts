"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireOwner } from "./guard";
import { actionError } from "@/lib/action-error";

export type PmProjectInput = {
  id?: string;
  name: string;
  client_name?: string;
  client_email?: string;
  status: "active" | "on_hold" | "done" | "archived";
  description?: string;
  due_date?: string;
};

export async function upsertPmProject(input: PmProjectInput) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const payload = {
    name: input.name.trim(),
    client_name: input.client_name?.trim() || null,
    client_email: input.client_email?.trim() || null,
    status: input.status,
    description: input.description?.trim() || null,
    due_date: input.due_date || null,
  };
  let id = input.id;
  if (id) {
    const { error } = await sb.from("pm_projects").update(payload).eq("id", id);
    if (error) return { ok: false as const, error: actionError(error) };
  } else {
    const { data, error } = await sb
      .from("pm_projects")
      .insert(payload)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (error) return { ok: false as const, error: actionError(error) };
    id = data?.id;
  }
  revalidatePath("/admin/pm");
  if (id) revalidatePath(`/admin/pm/${id}`);
  return { ok: true as const, id };
}

export async function deletePmProject(id: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("pm_projects").delete().eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath("/admin/pm");
  return { ok: true as const };
}

// ---- Tasks ----
export async function addPmTask(projectId: string, title: string) {
  await requireOwner();
  if (!title.trim()) return { ok: false as const, error: "Empty task." };
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("pm_tasks")
    .insert({ project_id: projectId, title: title.trim() })
    .select("*")
    .maybeSingle();
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true as const, task: data };
}

export async function setPmTaskDone(id: string, projectId: string, done: boolean) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("pm_tasks").update({ done }).eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true as const };
}

export async function deletePmTask(id: string, projectId: string) {
  await requireOwner();
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("pm_tasks").delete().eq("id", id);
  if (error) return { ok: false as const, error: actionError(error) };
  revalidatePath(`/admin/pm/${projectId}`);
  return { ok: true as const };
}
