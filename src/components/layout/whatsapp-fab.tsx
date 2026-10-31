import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="whatsapp-fab fixed right-4 bottom-4 z-30 grid size-14 place-items-center rounded-full bg-[#1f9d55] text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon width={30} height={30} />
    </a>
  );
}
