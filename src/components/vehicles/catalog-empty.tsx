import { ButtonLink, buttonClasses } from "@/components/ui/button-link";
import { WhatsAppIcon } from "@/components/ui/icons";
import { whatsappUrl } from "@/lib/whatsapp";

export function CatalogEmpty({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-md border border-dashed border-white/15 px-6 py-16 text-center">
      <p className="font-display text-3xl font-extrabold uppercase italic">
        {filtered ? "Sin resultados" : "Pronto más vehículos"}
      </p>
      <p className="mx-auto mt-3 max-w-md text-mist">
        {filtered
          ? "No encontramos vehículos con esos filtros. Prueba ampliando la búsqueda o escríbenos: te ayudamos a encontrar lo que buscas."
          : "Estamos actualizando el inventario. Escríbenos y te contamos qué tenemos disponible."}
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {filtered ? (
          <ButtonLink href="/vehiculos" variant="outline">
            Ver todos
          </ButtonLink>
        ) : null}
        <a
          href={whatsappUrl("Hola AutoDealer, estoy buscando un vehículo.")}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("whatsapp")}
        >
          <WhatsAppIcon /> Te ayudamos a buscar
        </a>
      </div>
    </div>
  );
}
