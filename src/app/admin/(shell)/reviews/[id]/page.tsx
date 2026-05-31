import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ReviewForm } from "@/components/admin/review-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteReviewAction } from "@/app/admin/_actions/wrappers";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/cms";
import type { ReviewRow } from "@/lib/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <>
        <AdminPageHeader
          title="Review"
          back={{ href: "/admin/reviews", label: "Reviews" }}
        />
        <AdminPageBody>
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5">
            <h3 className="t-heading-l font-display">Supabase isn&apos;t connected.</h3>
            <Link href="/admin" className="btn btn-secondary mt-4 inline-flex">
              Back to dashboard
            </Link>
          </div>
        </AdminPageBody>
      </>
    );
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("reviews")
    .select("*")
    .eq("id", id)
    .maybeSingle<ReviewRow>();
  if (!data) notFound();

  const projects = await getProjects();

  return (
    <>
      <AdminPageHeader
        title={`Review from ${data.author_name}`}
        back={{ href: "/admin/reviews", label: "Reviews" }}
        actions={
          <DeleteButton
            onDelete={() => deleteReviewAction(data.id)}
            redirectTo="/admin/reviews"
            label="Delete review"
            confirmText="Confirm delete"
          />
        }
      />
      <AdminPageBody>
        <ReviewForm initial={data} projects={projects} />
      </AdminPageBody>
    </>
  );
}
