import { Container } from "@/components/layout/container";
import { buttonClasses } from "@/components/ui/button-link";
import {
  ArrowRightIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { OpenStatus, WeekHours } from "./opening-hours";

const query = encodeURIComponent(siteConfig.address);
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
const wazeUrl = `https://waze.com/ul?q=${query}&navigate=yes`;

const CONTACTS = [
  {
    icon: <PhoneIcon width={18} height={18} />,
    label: siteConfig.phoneDisplay,
    href: `tel:${siteConfig.phoneE164}`,
  },
  {
    icon: <WhatsAppIcon width={18} height={18} />,
    label: "WhatsApp",
    href: whatsappUrl(),
    external: true,
  },
  {
    icon: <MailIcon width={18} height={18} />,
    label: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
  {
    icon: <InstagramIcon width={18} height={18} />,
    label: siteConfig.instagramHandle,
    href: siteConfig.instagramUrl,
    external: true,
  },
];

export function VisitUs() {
  return (
    <section
      aria-labelledby="visit-title"
      className="relative overflow-hidden border-t border-white/8 py-20 sm:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,240,0,0.05),transparent)]"
      />
      <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div className="flex min-w-0 flex-col">
          <p className="eyebrow flex items-center gap-3">
            <span className="brand-stripe" aria-hidden />
            Visítanos
          </p>
          <h2
            id="visit-title"
            className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance sm:text-6xl"
          >
            Estamos en <span className="text-brand-yellow">La Serena</span>
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-mist">
            Ven a ver los vehículos en persona. Te recomendamos escribirnos
            antes para confirmar disponibilidad.
          </p>
          <div className="mt-6">
            <OpenStatus />
          </div>

          <div className="mt-8 flex items-start gap-4 border-l-2 border-brand-yellow pl-5">
            <PinIcon
              width={22}
              height={22}
              className="mt-1 shrink-0 text-brand-yellow"
            />
            <div>
              <p className="text-xl leading-snug font-semibold text-chalk">
                Av. Balmaceda 1595, esquina Huanhualí
              </p>
              <p className="mt-1 text-sm text-mist">
                Frente a la Iglesia de Lourdes · La Serena
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("primary", "lg", "whitespace-nowrap")}
            >
              Ver en Google Maps <ArrowRightIcon />
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outline", "lg", "whitespace-nowrap")}
            >
              Abrir en Waze
            </a>
          </div>
        </div>

        {/* Horario y contacto, sin recuadro. */}
        <div className="grid gap-10 sm:grid-cols-2 lg:gap-12">
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-[0.16em] text-mist uppercase">
              Horario de atención
            </h3>
            <WeekHours />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-semibold tracking-[0.16em] text-mist uppercase">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm">
              {CONTACTS.map((c) => (
                <li key={c.href}>
                  <a
                    href={c.href}
                    {...(c.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex items-center gap-3 font-medium break-all text-chalk/90 hover:text-brand-yellow"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-white/[0.05] text-brand-yellow transition-colors group-hover:bg-brand-yellow group-hover:text-ink">
                      {c.icon}
                    </span>
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
