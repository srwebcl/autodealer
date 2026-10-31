import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Container } from "./container";
import { MobileMenu } from "./mobile-menu";
import { NavLinks, NavLinksStatic } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-ink/75 backdrop-blur-lg supports-[backdrop-filter]:bg-ink/55">
      <Container className="flex h-18 items-center justify-between gap-4 xl:gap-6">
        <Link href="/" className="relative z-50 shrink-0" aria-label="AutoDealer, ir al inicio">
          <Logo className="w-36 sm:w-44 lg:w-36 xl:w-44" preload />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-5 lg:flex xl:gap-8">
          <Suspense fallback={<NavLinksStatic />}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/contacto" className={buttonClasses("primary", "md", "max-sm:hidden")}>
            Cotizar <ArrowRightIcon width={18} height={18} className="max-xl:hidden" />
          </Link>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}
