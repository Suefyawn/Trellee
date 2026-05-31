import { getSiteSettings } from "@/lib/cms";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const settings = await getSiteSettings();
  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="Hero copy, stats, booking CTA, contact methods, newsletter — the single-row content that powers every page."
      />
      <AdminPageBody>
        <SiteSettingsForm initial={settings} />
      </AdminPageBody>
    </>
  );
}
