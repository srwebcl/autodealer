import { GoogleG, GoogleStars } from "@/components/home/google-brand";
import { CONSIGNMENT_POINTS, CONSIGNMENT_TITLE } from "@/config/consignment";
import { googleReviews } from "@/config/google-reviews";

/** Los 5 puntos clave de la consignación, como lista numerada dentro del bloque "Consignación". */
export function ConsignmentPoints() {
  const rating = googleReviews.rating;
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-[0.16em] text-brand-yellow uppercase">{CONSIGNMENT_TITLE}</h3>
      <ol className="mt-4 border-b border-white/8">
        {CONSIGNMENT_POINTS.map((p, i) => (
          <li key={p.title} className="flex gap-4 border-t border-white/8 py-5">
            <span className="w-6 shrink-0 font-display text-3xl leading-none font-extrabold text-brand-yellow italic tabular-nums">{i + 1}</span>
            <div className="min-w-0">
              <h4 className="font-display text-xl leading-tight font-bold uppercase italic tracking-tight">{p.title}</h4>
              <ul className="mt-2 space-y-1">
                {p.items.map((item) => (
                  <li key={item} className="leading-relaxed text-chalk/80">
                    {item}
                  </li>
                ))}
              </ul>
              {"googleReviews" in p && p.googleReviews && rating != null ? (
                <a
                  href={googleReviews.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#202124] transition-transform hover:-translate-y-0.5"
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
    </div>
  );
}
