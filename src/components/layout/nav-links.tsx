"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";

const linkBase =
  "relative py-2 text-[0.8rem] font-semibold uppercase whitespace-nowrap tracking-[0.1em] xl:tracking-[0.14em] transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-brand-yellow after:transition-transform after:duration-300";

export function NavLinksStatic() {
  return (
    <>
      {mainNav.map((item) => (
        <Link key={item.href} href={item.href} className={`${linkBase} text-chalk/80 after:scale-x-0 hover:text-chalk`}>
          {item.label}
        </Link>
      ))}
    </>
  );
}

/** Igual que NavLinksStatic pero marca la sección activa. Debe ir dentro de <Suspense>. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {mainNav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${linkBase} ${active ? "text-chalk after:scale-x-100" : "text-chalk/80 after:scale-x-0 hover:text-chalk hover:after:scale-x-100"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
