import Link from "next/link";
import { Plus } from "lucide-react";
import { getServices } from "@/lib/cms";
import { AdminPageBody, AdminPageHeader } from "@/components/admin/admin-page";
import { TableFilter } from "@/components/admin/table-filter";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getServices();
  return (
    <>
      <AdminPageHeader
        title="Services"
        description="The 10 disciplines shown on the homepage bento + /services. Tile size and order control the homepage layout."
        actions={
          <div className="flex items-center gap-2">
            <TableFilter targetId="services-list" placeholder="Filter services…" />
            <Link href="/admin/services/new" className="btn btn-primary">
              <Plus className="w-4 h-4" /> New service
            </Link>
          </div>
        }
      />
      <AdminPageBody>
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[640px] t-small">
            <thead>
              <tr className="bg-surface-2/60 t-mono text-muted text-xs uppercase tracking-wider">
                <th className="text-left p-4 font-normal">Title</th>
                <th className="text-left p-4 font-normal">Slug</th>
                <th className="text-left p-4 font-normal">Category</th>
                <th className="text-left p-4 font-normal">Tile</th>
                <th className="text-left p-4 font-normal">Order</th>
                <th className="text-left p-4 font-normal">Featured</th>
              </tr>
            </thead>
            <tbody id="services-list">
              {services.map((s) => (
                <tr
                  key={s.id}
                  data-row
                  className="border-t border-border hover:bg-surface-2/40 transition"
                >
                  <td className="p-4">
                    <Link
                      href={`/admin/services/${s.id}`}
                      className="text-fg hover:text-brand-500 transition"
                    >
                      {s.title}
                    </Link>
                  </td>
                  <td className="p-4 t-mono text-muted text-xs">{s.slug}</td>
                  <td className="p-4 text-muted">{s.category ?? "—"}</td>
                  <td className="p-4 t-mono text-xs">{s.tile_size}</td>
                  <td className="p-4 t-mono text-xs">{s.display_order}</td>
                  <td className="p-4">
                    {s.featured ? (
                      <span className="badge badge-brand">featured</span>
                    ) : (
                      <span className="t-mono text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr id="services-list-empty" style={{ display: "none" }} className="border-t border-border">
                <td colSpan={6} className="p-4 text-center text-muted t-small">
                  No matches.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminPageBody>
    </>
  );
}
