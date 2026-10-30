import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button-link";
import { DraftBadge } from "@/components/ui/draft-badge";
import { ArrowRightIcon, ClockIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`;

export function VisitUs() {
  return (
    <section aria-labelledby="visit-title" className="border-t border-white/8 py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <SectionHeading
          id="visit-title"
          eyebrow="Visítanos"
          title={
            <>
              Estamos en <span className="text-brand-yellow">La Serena</span>
            </>
          }
          description="Ven a ver los vehículos en persona. Te recomendamos escribirnos antes para confirmar disponibilidad."
        />

        <div className="grid gap-px overflow-hidden rounded-md border border-white/8 bg-white/8 sm:grid-cols-2">
          <div className="bg-graphite-900 p-6 sm:col-span-2">
            <div className="flex items-start gap-4">
              <PinIcon className="mt-1 shrink-0 text-brand-yellow" width={22} height={22} />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">Dirección</p>
                <p className="mt-1 text-lg font-medium">{siteConfig.address}</p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("ghost", "md", "-ml-1 mt-2 h-auto! px-1! py-1 text-xs")}
                >
                  Cómo llegar <ArrowRightIcon width={16} height={16} />
                </a>
              </div>
            </div>
          </div>
          <div className="bg-graphite-900 p-6">
            <div className="flex items-start gap-4">
              <ClockIcon className="mt-1 shrink-0 text-brand-yellow" width={22} height={22} />
              <div>
                <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mist">
                  Horario <DraftBadge label="Por confirmar" />
                </p>
                <dl className="mt-2 space-y-1 text-sm">
                  {siteConfig.hours.map((h) => (
                    <div key={h.days}>
                      <dt className="text-mist">{h.days}</dt>
                      <dd className="font-medium">{h.time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-graphite-900 p-6">
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-4">
                <PhoneIcon className="shrink-0 text-brand-yellow" width={20} height={20} />
                <a href={`tel:${siteConfig.phoneE164}`} className="font-medium hover:text-brand-yellow">
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <MailIcon className="shrink-0 text-brand-yellow" width={20} height={20} />
                <a href={`mailto:${siteConfig.email}`} className="font-medium break-all hover:text-brand-yellow">
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-4">
                <InstagramIcon className="shrink-0 text-brand-yellow" width={20} height={20} />
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-brand-yellow"
                >
                  {siteConfig.instagramHandle}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
