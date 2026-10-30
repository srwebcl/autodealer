import { buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, ClockIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import type { CommercialContent, ContentItem, ContentSection } from "@/lib/instagram/commercial-content";

/**
 * Descripción comercial con la estructura de AutoDealer:
 * A. titular + introducción · B. 📋 datos clave · C. 🛠️ equipamiento · D. 🤝 respaldo
 * E. 📍 visítanos (datos oficiales) · F. cierre. El texto es el de la publicación original.
 */

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.addressWithReference)}`;

function SectionTitle({ icon, children, id }: { icon?: string; children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-extrabold uppercase italic tracking-tight sm:text-3xl">
      {icon ? (
        <span aria-hidden className="not-italic">
          {icon}
        </span>
      ) : null}
      {children}
    </h2>
  );
}

function ItemCard({ item }: { item: ContentItem }) {
  return (
    <li className="flex gap-4 rounded-md border border-white/8 bg-graphite-900 p-4 sm:p-5">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-sm bg-white/5 text-xl leading-none"
      >
        {item.icon ?? <span className="h-1 w-3 -skew-x-[20deg] bg-brand-yellow" />}
      </span>
      <div className="min-w-0">
        {item.title ? <p className="font-semibold text-chalk">{item.title}</p> : null}
        <p className={`leading-relaxed ${item.title ? "mt-1 text-sm text-mist" : "text-chalk/90"}`}>{item.text}</p>
      </div>
    </li>
  );
}

function ItemsSection({ section, id, columns = 2 }: { section: ContentSection; id: string; columns?: 2 | 3 }) {
  return (
    <section aria-labelledby={id}>
      <SectionTitle id={id} icon={section.icon}>
        {section.heading}
      </SectionTitle>
      <ul className={`mt-5 grid gap-3 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        {section.items.map((item, i) => (
          <ItemCard key={i} item={item} />
        ))}
      </ul>
    </section>
  );
}

const isPrice = (label: string) => /precio|valor/i.test(label);

export function CommercialDescription({ content, whatsappHref }: { content: CommercialContent; whatsappHref: string }) {
  return (
    <div className="space-y-14">
      {/* A. Introducción comercial */}
      {content.title.length || content.intro.length ? (
        <section aria-labelledby="intro-title">
          <h2
            id="intro-title"
            className="font-display text-2xl leading-tight font-extrabold uppercase italic tracking-tight text-balance text-brand-yellow sm:text-3xl"
          >
            {content.title.length ? content.title.join(" ") : "Descripción"}
          </h2>
          <div className="mt-5 max-w-3xl space-y-4 text-base leading-relaxed text-chalk/85 sm:text-lg">
            {content.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}

      {/* B. Datos clave */}
      {content.keyData.length ? (
        <section aria-labelledby="key-data-title">
          <SectionTitle id="key-data-title" icon="📋">
            Datos clave
          </SectionTitle>
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-white/8 bg-white/8 lg:grid-cols-4">
            {content.keyData.map((d, i) => (
              <div
                key={i}
                className={`bg-graphite-900 p-4 sm:p-5 ${isPrice(d.label) ? "col-span-2 bg-graphite-800 lg:col-span-1" : ""}`}
              >
                <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-mist">{d.label}</dt>
                <dd
                  className={`mt-1.5 break-words ${isPrice(d.label) ? "font-display text-2xl font-bold text-brand-yellow" : "font-medium text-chalk"}`}
                >
                  {d.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {/* C. Equipamiento destacado */}
      {content.equipment?.items.length ? <ItemsSection id="equipment-title" section={content.equipment} /> : null}

      {/* Secciones adicionales del caption, tal cual */}
      {content.extra.map((s, i) => (
        <ItemsSection key={i} id={`extra-${i}`} section={{ ...s, heading: s.heading || "Más información" }} />
      ))}

      {/* D. Respaldo Autodealer */}
      {content.backing?.items.length ? <ItemsSection id="backing-title" section={content.backing} columns={3} /> : null}

      {/* E. Visítanos (datos oficiales) */}
      <section aria-labelledby="visit-title-vehicle">
        <SectionTitle id="visit-title-vehicle" icon="📍">
          Visítanos
        </SectionTitle>
        <div className="mt-5 grid gap-px overflow-hidden rounded-md border border-white/8 bg-white/8 md:grid-cols-2">
          <div className="flex gap-4 bg-graphite-900 p-5">
            <PinIcon className="mt-0.5 shrink-0 text-brand-yellow" width={22} height={22} />
            <div>
              <p className="font-medium text-chalk">{siteConfig.addressWithReference}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-chalk hover:text-brand-yellow"
              >
                Cómo llegar <ArrowRightIcon width={14} height={14} />
              </a>
            </div>
          </div>
          <div className="flex gap-4 bg-graphite-900 p-5">
            <ClockIcon className="mt-0.5 shrink-0 text-brand-yellow" width={22} height={22} />
            <dl className="space-y-1 text-sm">
              {siteConfig.hours.map((h) => (
                <div key={h.days} className="flex flex-wrap gap-x-2">
                  <dt className="text-mist">{h.days}:</dt>
                  <dd className="font-medium text-chalk">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* F. Cierre comercial */}
      {content.closing.length ? (
        <section
          aria-label="Invitación"
          className="relative overflow-hidden rounded-md border border-brand-yellow/30 bg-gradient-to-br from-graphite-800 to-graphite-900 p-4 min-[380px]:p-6 sm:p-8"
        >
          <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,var(--color-brand-yellow)_0_50%,var(--color-brand-red)_50%_100%)]" />
          <div className="space-y-2 text-lg leading-relaxed font-medium text-chalk sm:text-xl">
            {content.closing.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonClasses("whatsapp", "lg", "mt-6 w-full whitespace-nowrap px-3 text-[0.78rem] tracking-[0.03em] min-[380px]:px-4 min-[380px]:text-[0.82rem] sm:w-auto sm:text-[0.95rem] sm:tracking-[0.08em]")}>
            <WhatsAppIcon className="shrink-0" />
            <span className="min-[380px]:hidden" aria-hidden>
              Escríbenos
            </span>
            <span className="max-[379px]:sr-only">Escríbenos por WhatsApp</span>
          </a>
        </section>
      ) : null}
    </div>
  );
}
