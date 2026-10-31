import { Container } from "@/components/layout/container";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { googleReviews } from "@/config/google-reviews";
import { ReviewBubbles } from "./review-bubbles";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-brand-yellow" role="img" aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={18} height={18} viewBox="0 0 20 20" aria-hidden fill={i <= Math.round(rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
          <path d="M10 1.8l2.47 5.2 5.7.68-4.2 3.92 1.1 5.63L10 14.42l-5.07 2.81 1.1-5.63-4.2-3.92 5.7-.68z" />
        </svg>
      ))}
    </span>
  );
}

/** Opiniones reales del perfil de Google Business (selección en src/config/google-reviews.ts). */
export function GoogleReviews() {
  const { reviews, rating, total, profileUrl } = googleReviews;
  if (reviews.length === 0) return null;

  return (
    <section aria-labelledby="reviews-title" className="overflow-hidden py-20 sm:py-28">
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
                <span className="font-display text-5xl leading-none font-bold">
                  {rating.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-sm text-mist">
                  <Stars rating={rating} />
                  <span className="mt-1 block group-hover:text-chalk">
                    {total != null ? `${total.toLocaleString("es-CL")} reseñas en Google` : "Calificación en Google"}
                  </span>
                </span>
              </a>
            ) : (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-chalk hover:text-brand-yellow"
              >
                Ver perfil en Google <ArrowRightIcon width={16} height={16} />
              </a>
            )
          }
        />
        <div className="mt-12">
          <ReviewBubbles reviews={reviews} />
        </div>
      </Container>
    </section>
  );
}
