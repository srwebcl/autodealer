import { Container } from "@/components/layout/container";
import { googleReviews } from "@/config/google-reviews";
import { GoogleG, GoogleStars } from "./google-brand";
import { ReviewBubbles } from "./review-bubbles";

/** Insignia de calificación al estilo Google, centrada bajo el título. */
function GoogleBadge({ rating, total, profileUrl }: { rating: number; total: number | null; profileUrl: string }) {
  return (
    <div className="relative mt-9 flex flex-col items-center">
      {/* Halo suave con los colores de Google detrás de la insignia. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-[min(36rem,100%)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "linear-gradient(90deg,#4285F4,#34A853 35%,#FBBC05 65%,#EA4335)" }}
      />
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center gap-4 rounded-full bg-white py-3 pr-7 pl-4 font-sans text-[#202124] shadow-[0_25px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5 sm:gap-5 sm:py-3.5 sm:pr-8 sm:pl-5"
      >
        <span className="grid size-12 place-items-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.18)] sm:size-14">
          <GoogleG size={28} />
        </span>
        <span className="text-[2.6rem] leading-none font-medium tracking-tight sm:text-5xl">
          {rating.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
        <span className="flex flex-col gap-1">
          <GoogleStars rating={rating} size={24} />
          <span className="text-sm text-[#5f6368]">{total != null ? `${total.toLocaleString("es-CL")} reseñas en Google` : "Reseñas en Google"}</span>
        </span>
      </a>
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-5 text-sm font-medium text-[#8ab4f8] underline-offset-4 hover:underline"
      >
        Ver todas o escribir una reseña
      </a>
    </div>
  );
}

/** Opiniones reales del perfil de Google Business (selección en src/config/google-reviews.ts). */
export function GoogleReviews() {
  const { reviews, rating, total, profileUrl } = googleReviews;
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="overflow-hidden border-y border-white/8 bg-graphite-950 py-20 sm:py-28">
      <Container>
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow inline-flex items-center gap-3">
            <span className="brand-stripe" aria-hidden />
            Opiniones reales
            <span className="brand-stripe" aria-hidden />
          </p>
          <h2
            id="reviews-title"
            className="mt-4 font-display text-4xl leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance sm:text-6xl"
          >
            Lo que dicen <span className="text-brand-yellow">nuestros clientes</span>
          </h2>
          {rating != null ? <GoogleBadge rating={rating} total={total} profileUrl={profileUrl} /> : null}
        </header>
        <div className="mt-16 sm:mt-20">
          <ReviewBubbles reviews={reviews} />
        </div>
      </Container>
    </section>
  );
}
