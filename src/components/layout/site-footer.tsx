import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/ui/icons";
import { mainNav, siteConfig } from "@/config/site";
import { Container } from "./container";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-graphite-950">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-[linear-gradient(90deg,var(--color-brand-yellow)_0_50%,var(--color-brand-red)_50%_100%)]"
      />
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo className="w-44" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist">{siteConfig.description}</p>
          <a
            href={siteConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-chalk hover:text-brand-yellow"
          >
            <InstagramIcon /> {siteConfig.instagramHandle}
          </a>
        </div>

        <nav aria-label="Pie de página">
          <h2 className="eyebrow">Navegación</h2>
          <ul className="mt-5 space-y-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-chalk/85 hover:text-chalk">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow">Contacto</h2>
          <ul className="mt-5 space-y-4 text-sm text-chalk/85">
            <li className="flex gap-3">
              <PinIcon className="mt-0.5 shrink-0 text-mist" />
              <span>{siteConfig.address}</span>
            </li>
            <li className="flex gap-3">
              <PhoneIcon className="mt-0.5 shrink-0 text-mist" />
              <a href={`tel:${siteConfig.phoneE164}`} className="hover:text-chalk">
                {siteConfig.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 shrink-0 text-mist" />
              <a href={`mailto:${siteConfig.email}`} className="hover:text-chalk">
                {siteConfig.email}
              </a>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/8">
        <Container className="flex flex-col gap-2 py-6 pr-20 text-xs text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© AutoDealer · {siteConfig.city}, {siteConfig.country}</p>
          <p>Precios en pesos chilenos (CLP). Sujetos a confirmación.</p>
        </Container>
      </div>
    </footer>
  );
}
