import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-link";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import { Container } from "./container";
import { MobileMenu } from "./mobile-menu";
import { NavLinks, NavLinksStatic } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-lg supports-[backdrop-filter]:bg-ink/55">
      <Container className="flex h-18 items-center justify-between gap-6">
        <Link href="/" className="relative z-50 shrink-0" aria-label="AutoDealer, ir al inicio">
          <Logo className="w-36 sm:w-44" preload />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-8 lg:flex">
          <Suspense fallback={<NavLinksStatic />}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "md", "max-sm:hidden")}
          >
            <WhatsAppIcon width={18} height={18} />
            Cotizar
          </a>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
