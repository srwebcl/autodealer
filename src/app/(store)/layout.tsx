import { JsonLd } from "@/components/seo/json-ld";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { businessJsonLd } from "@/lib/seo/business";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Datos de la automotora (schema.org/AutoDealer) en todas las páginas públicas. */}
      <JsonLd data={businessJsonLd()} />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-sm focus:bg-brand-yellow focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
