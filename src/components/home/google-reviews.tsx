import { Container } from "@/components/layout/container";
import { googleReviews } from "@/config/google-reviews";
import { siteConfig } from "@/config/site";
import { GoogleG, GoogleStars } from "./google-brand";
import { ReviewChat } from "./review-chat";

/** Tarjeta al estilo del panel de reseñas de Google Business. */
function GoogleBusinessCard({ rating, total, profileUrl }: { rating: number | null; total: number | null; profileUrl: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 font-sans text-[#202124] shadow-[0_20px_60px_-25px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-3">
        <GoogleG size={30} />
        <div className="min-w-0">
          <p className="text-[15px] font-medium">Reseñas de Google</p>
          <p className="truncate text-sm text-[#5f6368]">
            {siteConfig.name} · {siteConfig.city}
          </p>
        </div>
      </div>
      {rating != null ? (
        <div className="mt-6 flex items-center gap-3">
          <span className="text-[3.25rem] leading-none font-normal tracking-tight">
            {rating.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <div>
            <GoogleStars rating={rating} size={22} />
            <p className="mt-0.5 text-sm text-[#5f6368]">{total != null ? `${total.toLocaleString("es-CL")} reseñas` : "Calificación en Google"}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-6 grid gap-2.5">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-10 place-items-center rounded-full bg-[#1a73e8] text-sm font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          Ver reseñas en Google
        </a>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-10 place-items-center rounded-full border border-[#dadce0] text-sm font-medium text-[#1a73e8] transition-colors hover:bg-[#f6fafe]"
        >
          Escribir una reseña
        </a>
      </div>
    </div>
  );
}

/** Opiniones reales del perfil de Google Business (datos en src/config/google-reviews.ts). */
export function GoogleReviews() {
  const { reviews, rating, total, profileUrl } = googleReviews;
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="border-y border-white/8 bg-graphite-950 py-20 sm:py-28">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <p className="eyebrow flex items-center gap-3">
              <span className="brand-stripe" aria-hidden />
              Opiniones reales
            </p>
            <h2
              id="reviews-title"
              className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance sm:text-5xl"
            >
              Lo que dicen <span className="text-brand-yellow">nuestros clientes</span>
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-mist">
              Compradores y vendedores que confiaron en nosotros, tal como lo escribieron en Google.
            </p>
            <div className="mt-8">
              <GoogleBusinessCard rating={rating} total={total} profileUrl={profileUrl} />
            </div>
          </div>
          <ReviewChat reviews={reviews} profileUrl={profileUrl} />
        </div>
      </Container>
    </section>
  );
}
