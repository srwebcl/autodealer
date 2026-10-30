"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mainNav, siteConfig } from "@/config/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/button-link";
import { CloseIcon, InstagramIcon, MenuIcon, WhatsAppIcon } from "@/components/ui/icons";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        className="relative z-50 inline-flex size-11 items-center justify-center rounded-sm text-chalk hover:bg-white/10"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon width={24} height={24} /> : <MenuIcon width={24} height={24} />}
      </button>

      {/* Portal: el backdrop-filter del header crea un containing block que atraparía este panel fijo.
          Solo se monta tras un clic, así que document siempre existe. */}
      {open
        ? createPortal(
            <div id={panelId} className="fixed inset-0 z-40 overflow-y-auto bg-ink/97 backdrop-blur-md">
              <nav aria-label="Menú principal" className="flex min-h-full flex-col px-6 pt-28 pb-10">
                <ul className="flex flex-col">
                  {mainNav.map((item, index) => (
                    <li key={item.href} className="border-b border-white/10">
                      <Link
                        ref={index === 0 ? firstLinkRef : undefined}
                        href={item.href}
                        onClick={close}
                        className="flex items-center justify-between py-5 font-display text-3xl font-extrabold uppercase italic tracking-tight hover:text-brand-yellow"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-4 pt-10">
                  <a
                    href={whatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses("whatsapp", "lg", "w-full")}
                  >
                    <WhatsAppIcon /> Escríbenos por WhatsApp
                  </a>
                  <a
                    href={siteConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 py-2 text-sm text-mist hover:text-chalk"
                  >
                    <InstagramIcon /> {siteConfig.instagramHandle}
                  </a>
                </div>
              </nav>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
