import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LeadForm } from "@/components/forms/lead-form";
import { SubHeading } from "@/components/forms/lead-page";
import { OpenStatus, WeekHours } from "@/components/home/opening-hours";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon, ClockIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/ui/icons";
import { siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dirección, teléfono, email y horario de AutoDealer en La Serena.",
};

const query = encodeURIComponent(siteConfig.address);
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
const wazeUrl = `https://waze.com/ul?q=${query}&navigate=yes`;

const CHANNELS: { icon: ReactNode; label: string; value: string; href: string; external?: boolean }[] = [
  { icon: <WhatsAppIcon width={20} height={20} />, label: "WhatsApp", value: siteConfig.phoneDisplay, href: whatsappUrl(), external: true },
  { icon: <PhoneIcon width={20} height={20} />, label: "Teléfono", value: siteConfig.phoneDisplay, href: `tel:${siteConfig.phoneE164}` },
  { icon: <MailIcon width={20} height={20} />, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { icon: <InstagramIcon width={20} height={20} />, label: "Instagram", value: siteConfig.instagramHandle, href: siteConfig.instagramUrl, external: true },
];

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="border-t border-white/8 pt-6">
      <h2 className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.16em] text-mist uppercase">
        <span className="text-brand-yellow">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Contacto" title="Hablemos">
        <p>Escríbenos por WhatsApp, llámanos, déjanos un mensaje o visítanos en La Serena.</p>
      </PageHero>

      <Container className="py-14 sm:py-20">
        <div className="grid items-start gap-x-16 gap-y-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]">
          {/* Escritorio: datos fijos a la izquierda mientras el formulario hace scroll. */}
          <aside aria-labelledby="direct-title" className="min-w-0 space-y-8 lg:sticky lg:top-26">
            <div>
              <SubHeading>
                <span id="direct-title">Respuesta inmediata</span>
              </SubHeading>
              <p className="mt-3 max-w-md leading-relaxed text-chalk/80">WhatsApp y teléfono son la forma más rápida de hablar con nosotros.</p>
              <div className="mt-5">
                <OpenStatus />
              </div>
            </div>

            <Block icon={<PhoneIcon width={16} height={16} />} title="Datos de contacto">
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {CHANNELS.map((c) => (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.02] p-3 transition-colors hover:border-brand-yellow/60 hover:bg-white/[0.04]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-brand-yellow/10 text-brand-yellow transition-colors group-hover:bg-brand-yellow group-hover:text-ink">
                        {c.icon}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-xs text-mist">{c.label}</span>
                        <span className="block truncate text-sm font-semibold text-chalk">{c.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Block>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Block icon={<ClockIcon width={16} height={16} />} title="Horario">
                <WeekHours />
              </Block>
              <Block icon={<PinIcon width={16} height={16} />} title="Dirección">
                <p className="leading-snug font-semibold text-chalk">Av. Balmaceda 1595, esquina Huanhualí</p>
                <p className="mt-1 text-sm text-mist">Frente a la Iglesia de Lourdes · La Serena</p>
                <div className="mt-4 flex flex-col gap-2">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md", "justify-between whitespace-nowrap")}>
                    Ver en Google Maps <ArrowRightIcon width={16} height={16} />
                  </a>
                  <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "md", "justify-between whitespace-nowrap")}>
                    Abrir en Waze <ArrowRightIcon width={16} height={16} />
                  </a>
                </div>
              </Block>
            </div>
          </aside>

          <div id="formulario" className="min-w-0 scroll-mt-24 rounded-md border border-white/10 bg-graphite-900 p-6 sm:p-8">
            <SubHeading>Déjanos un mensaje</SubHeading>
            <p className="mt-2 mb-6 text-sm leading-relaxed text-mist">Te respondemos por teléfono, WhatsApp o email.</p>
            <LeadForm form="contacto" />
          </div>
        </div>
      </Container>
    </>
  );
}
