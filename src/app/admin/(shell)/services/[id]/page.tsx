import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { ServiceForm } from "@/components/admin/service-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { PricingTiersEditor } from "@/components/admin/pricing-tiers-editor";
import { FAQsEditor } from "@/components/admin/faqs-editor";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { deleteServiceAction } from "@/app/admin/_actions/wrappers";
import type {
  FAQRow,
  PricingTierRow,
  ServiceRow,
} from "@/lib/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

export const dynamic = "force-dynamic";

async function loadService(id: string) {
  if (!isSupabaseConfigured()) return null;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("services").select("*").eq("id", id).maybeSingle<ServiceRow>();
  if (!data) return null;
  const [{ data: tiers }, { data: faqs }] = await Promise.all([
    sb.from("pricing_tiers").select("*").eq("service_id", id).order("display_order"),
    sb.from("faqs").select("*").eq("service_id", id).order("display_order"),
  ]);
  return {
    service: data,
    tiers: (tiers ?? []) as PricingTierRow[],
    faqs: (faqs ?? []) as FAQRow[],
  };
}

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const loaded = await loadService(id);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <AdminPageHeader
          title="Service"
          back={{ href: "/admin/services", label: "Services" }}
        />
        <AdminPageBody>
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-5">
            <h3 className="t-heading-l font-display">Supabase isn&apos;t connected.</h3>
            <p className="t-body text-muted mt-2 max-w-xl">
              Services can only be edited once Supabase is wired up. The current list
              is demo data and is read-only.
            </p>
            <Link href="/admin" className="btn btn-secondary mt-4 inline-flex">
              Back to dashboard
            </Link>
          </div>
        </AdminPageBody>
      </>
    );
  }

  if (!loaded) notFound();

  return (
    <>
      <AdminPageHeader
        title={loaded.service.title}
        description={`Editing service · slug: ${loaded.service.slug}`}
        back={{ href: "/admin/services", label: "Services" }}
        actions={
          <DeleteButton
            onDelete={deleteServiceAction.bind(null, loaded.service.id)}
            redirectTo="/admin/services"
            label="Delete service"
            confirmText="Confirm delete"
          />
        }
      />
      <AdminPageBody>
        <ServiceForm initial={loaded.service} />
        <div className="mt-8 space-y-8">
          <PricingTiersEditor serviceId={loaded.service.id} initial={loaded.tiers} />
          <FAQsEditor serviceId={loaded.service.id} category={loaded.service.slug} initial={loaded.faqs} />
        </div>
      </AdminPageBody>
    </>
  );
}
