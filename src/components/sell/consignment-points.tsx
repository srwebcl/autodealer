import Link from "next/link";
import { GoogleG, GoogleStars } from "@/components/home/google-brand";
import { Container } from "@/components/layout/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CONSIGNMENT_POINTS } from "@/config/consignment";
import { googleReviews } from "@/config/google-reviews";

/** Los 5 puntos clave de la consignación, en filas numeradas. */
export function ConsignmentPoints() {
  const rating = googleReviews.rating;
  return (
    <section id="consignacion" aria-labelledby="consignment-title" className="scroll-mt-24 border-b border-white/8 bg-graphite-950 py-14 sm:py-20">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-3">
              <span className="brand-stripe" aria-hidden />
              Consignación
            </p>
            <h2
              id="consignment-title"
              className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance sm:text-5xl"
            >
              Considera estos <span className="text-brand-yellow">5 puntos clave</span> para la consignación de tu auto
            </h2>
          </div>
          <Link
            href="#formulario"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-chalk hover:text-brand-yellow"
          >
            Cotiza tu auto <ArrowRightIcon width={16} height={16} />
          </Link>
        </div>

        <ol className="mt-10 border-b border-white/8">
          {CONSIGNMENT_POINTS.map((p, i) => (
            <li key={p.title} className="group grid gap-3 border-t border-white/8 py-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:gap-10 md:py-7">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-4xl leading-none font-extrabold text-brand-yellow italic tabular-nums">{i + 1}</span>
                <h3 className="font-display text-2xl leading-tight font-bold uppercase italic tracking-tight">{p.title}</h3>
              </div>
              <div className="md:pt-1.5">
                <ul className="space-y-1.5">
                  {p.items.map((item) => (
                    <li key={item} className="flex gap-3 leading-relaxed text-chalk/85">
                      <span aria-hidden className="mt-2.5 h-0.5 w-3 shrink-0 -skew-x-[20deg] bg-brand-yellow" />
                      {item}
                    </li>
                  ))}
                </ul>
                {"googleReviews" in p && p.googleReviews && rating != null ? (
                  <a
                    href={googleReviews.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 ml-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#202124] transition-transform hover:-translate-y-0.5"
                  >
                    <GoogleG size={16} />
                    {rating.toLocaleString("es-CL", { minimumFractionDigits: 1 })}
                    <GoogleStars rating={rating} size={14} />
                    <span className="text-[#5f6368]">Ver opiniones</span>
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
