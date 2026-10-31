import type { CommercialContent, ContentItem, ContentSection } from "@/lib/instagram/commercial-content";

/**
 * Descripción comercial con el texto original de la publicación, en formato editorial:
 * titular + introducción, equipamiento, secciones adicionales, respaldo y cierre.
 * Los datos clave, el precio y la dirección/horario se muestran en el panel de la ficha
 * (desde los campos estructurados y la configuración oficial), así que aquí no se repiten.
 */

function SectionLabel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-brand-yellow">
      <span aria-hidden className="h-0.5 w-6 -skew-x-[20deg] bg-brand-yellow" />
      {children}
    </h2>
  );
}

/** "EQUIPAMIENTO DESTACADO" → "Equipamiento destacado" (el caption llega en mayúsculas). */
function sentenceCase(s: string): string {
  const lower = s.toLocaleLowerCase("es-CL");
  return lower.charAt(0).toLocaleUpperCase("es-CL") + lower.slice(1);
}

function ItemRow({ item }: { item: ContentItem }) {
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-x-3 border-t border-white/8 py-4">
      <span aria-hidden className="pt-0.5 text-lg leading-none">
        {item.icon ?? <span className="mt-2 block h-0.5 w-3 -skew-x-[20deg] bg-brand-yellow" />}
      </span>
      <p className="leading-relaxed text-chalk/75">
        {item.title ? <strong className="font-semibold text-chalk">{item.title}. </strong> : null}
        {item.text}
      </p>
    </li>
  );
}

function ItemList({ section, id, label }: { section: ContentSection; id: string; label: string }) {
  return (
    <section aria-labelledby={id}>
      <SectionLabel id={id}>{label}</SectionLabel>
      <ul className="mt-4 grid border-b border-white/8 md:grid-cols-2 md:gap-x-10">
        {section.items.map((item, i) => (
          <ItemRow key={i} item={item} />
        ))}
      </ul>
    </section>
  );
}

export function CommercialDescription({ content }: { content: CommercialContent }) {
  return (
    <div className="space-y-12">
      {content.title.length || content.intro.length ? (
        <section aria-labelledby="intro-title">
          <h2 id="intro-title" className="font-display text-2xl leading-tight font-bold uppercase italic tracking-tight text-balance sm:text-[1.75rem]">
            {content.title.length ? content.title.join(" ") : "Descripción"}
          </h2>
          <div className="mt-4 max-w-[68ch] space-y-4 leading-relaxed text-chalk/80 sm:text-[1.05rem]">
            {content.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}

      {content.equipment?.items.length ? (
        <ItemList id="equipment-title" section={content.equipment} label={sentenceCase(content.equipment.heading || "Equipamiento")} />
      ) : null}

      {content.extra.map((s, i) => (
        <ItemList key={i} id={`extra-${i}`} section={s} label={s.heading ? sentenceCase(s.heading) : "Más información"} />
      ))}

      {content.backing?.items.length ? (
        <section aria-labelledby="backing-title">
          <SectionLabel id="backing-title">{sentenceCase(content.backing.heading || "Respaldo AutoDealer")}</SectionLabel>
          <ul className="mt-4 flex flex-col divide-y divide-white/8 border-y border-white/8 md:flex-row md:divide-x md:divide-y-0">
            {content.backing.items.map((item, i) => (
              <li key={i} className="flex flex-1 gap-3 py-4 md:px-5 md:first:pl-0 md:last:pr-0">
                {item.icon ? (
                  <span aria-hidden className="text-lg leading-none">
                    {item.icon}
                  </span>
                ) : null}
                <p className="text-sm leading-relaxed text-chalk/70">
                  {item.title ? <strong className="block font-semibold text-chalk">{item.title}</strong> : null}
                  {item.text}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.closing.length ? (
        <blockquote className="border-l-2 border-brand-yellow pl-5 font-display text-xl leading-snug font-semibold italic text-chalk sm:text-2xl">
          {content.closing.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </blockquote>
      ) : null}
    </div>
  );
}
