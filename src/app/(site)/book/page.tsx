import { getServices, getSiteSettings } from "@/lib/cms";
import { BookingFlow } from "@/components/site/booking-flow";

export const metadata = {
  title: "Book a discovery call",
  description: "30 minutes. No slides. Bring the problem, we'll bring the questions.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const [services, settings] = await Promise.all([
    getServices(),
    getSiteSettings(),
  ]);
  return (
    <section className="py-16 lg:py-24 min-h-[80vh]">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
        <BookingFlow
          services={services}
          initialServiceSlug={params.service}
          ctaCopy={{
            heading: settings.cta_heading ?? "Book a discovery call",
            subheading:
              settings.cta_subheading ??
              "30 minutes. No slides. Bring the problem.",
          }}
        />
      </div>
    </section>
  );
}
