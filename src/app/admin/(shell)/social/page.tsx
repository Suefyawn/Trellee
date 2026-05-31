import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { SocialLinksEditor } from "@/components/admin/social-links-editor";
import { demoSocialLinks } from "@/lib/cms/demo-data";
import type { SocialLinkRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !url.includes("YOUR-PROJECT-REF");
}

async function load(): Promise<SocialLinkRow[]> {
  if (!isSupabaseConfigured()) return demoSocialLinks;
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("social_links").select("*").order("display_order");
  return (data ?? []) as SocialLinkRow[];
}

export default async function SocialPage() {
  return (
    <>
      <AdminPageHeader
        title="Social links"
        description="Shown in the footer. Supported icons: x, linkedin, github, instagram, youtube."
      />
      <AdminPageBody>
        <SocialLinksEditor initial={await load()} />
      </AdminPageBody>
    </>
  );
}
