import { Container } from "@/components/layout/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { type GoogleReview, googleReviews } from "@/config/google-reviews";

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-brand-yellow" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" aria-hidden fill={i <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
          <path d="M10 1.8l2.47 5.2 5.7.68-4.2 3.92 1.1 5.63L10 14.42l-5.07 2.81 1.1-5.63-4.2-3.92 5.7-.68z" />
        </svg>
      ))}
    </span>
  );
}

/** "2026-10" → "oct. 2026" (UTC: el mes no se corre por zona horaria). */
function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-CL", { month: "short", year: "numeric", timeZone: "UTC" });
}

function Review({ review }: { review: GoogleReview }) {
  return (
    <li className="w-[85%] shrink-0 snap-start border-t border-white/10 pt-5 sm:w-[60%] md:mb-10 md:w-auto md:break-inside-avoid">
      <figure>
        <Stars rating={review.rating} />
        <blockquote className="mt-3 leading-relaxed whitespace-pre-line text-chalk/85">{review.text}</blockquote>
        <figcaption className="mt-4 text-sm">
          <span className="font-semibold text-chalk">{review.author}</span>
          <span className="text-mist"> · {formatMonth(review.date)}</span>
        </figcaption>
      </figure>
    </li>
  );
}

/** Opiniones reales del perfil de Google Business (selección manual en src/config/google-reviews.ts). */
export function GoogleReviews() {
  const { reviews, rating, total, profileUrl } = googleReviews;
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          id="reviews-title"
          eyebrow="Opiniones en Google"
          title={
            <>
              Lo que dicen <span className="text-brand-yellow">nuestros clientes</span>
            </>
          }
          aside={
            rating != null ? (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4">
                <span className="font-display text-5xl leading-none font-bold">{rating.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                <span className="text-sm text-mist">
                  <Stars rating={rating} size={18} />
                  <span className="mt-1 block group-hover:text-chalk">
                    {total != null ? `${total.toLocaleString("es-CL")} reseñas en Google` : "Calificación en Google"}
                  </span>
                </span>
              </a>
            ) : null
          }
        />

        <ul className="scroll-row -mx-5 mt-12 flex snap-x scroll-px-5 gap-6 overflow-x-auto px-5 sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:block md:columns-2 md:gap-10 md:overflow-visible md:px-0 lg:columns-3">
          {reviews.map((r, i) => (
            <Review key={i} review={r} />
          ))}
        </ul>

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-chalk hover:text-brand-yellow md:mt-2"
        >
          Ver todas las reseñas en Google <ArrowRightIcon width={16} height={16} />
        </a>
      </Container>
    </section>
  );
}
