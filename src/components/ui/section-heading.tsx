import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  aside,
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow flex items-center gap-3">
          <span className="brand-stripe" aria-hidden />
          {eyebrow}
        </p>
        <h2
          id={id}
          className="mt-4 font-display text-4xl font-extrabold uppercase italic leading-[0.95] tracking-tight text-balance sm:text-5xl"
        >
          {title}
        </h2>
        {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-mist">{description}</p> : null}
      </div>
      {aside}
    </div>
  );
}
