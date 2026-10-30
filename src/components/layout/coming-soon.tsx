import { buttonClasses } from "@/components/ui/button-link";
import { DraftBadge } from "@/components/ui/draft-badge";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";
import { Container } from "./container";

/** Cuerpo provisional para secciones cuyos textos aún no están aprobados. */
export function ComingSoon({ whatsappMessage, children }: { whatsappMessage: string; children: React.ReactNode }) {
  return (
    <Container className="py-16 sm:py-24">
      <div className="max-w-2xl">
        <DraftBadge />
        <div className="mt-5 space-y-4 text-base leading-relaxed text-chalk/85">{children}</div>
        <a
          href={whatsappUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("whatsapp", "lg", "mt-8")}
        >
          <WhatsAppIcon /> Consultar por WhatsApp
        </a>
      </div>
    </Container>
  );
}
