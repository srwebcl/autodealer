import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClasses } from "@/components/ui/button-link";
import { InstagramIcon, PhoneIcon, WhatsAppIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { CommercialDescription } from "@/components/vehicles/commercial-description";
import { StatusBadge } from "@/components/vehicles/status-badge";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo/urls";
import { vehicleDisplayName, vehicleJsonLd, vehicleMetaDescription } from "@/lib/seo/vehicle";
import { formatClp, formatKm } from "@/lib/utils/format";
import { vehicleWhatsappMessage, whatsappUrl } from "@/lib/whatsapp";
import { getIndexableSlugs, getRelatedVehicles, getVehicleBySlug } from "@/server/vehicles/queries";

/** Prerenderiza las fichas actuales. Las nuevas se generan en la primera visita. */
export async function generateStaticParams() {
  const slugs = await getIndexableSlugs();
  // Cache Components exige al menos un parámetro; el marcador responde 404.
  return slugs.length ? slugs.map(({ slug }) => ({ slug })) : [{ slug: "__sin-vehiculos__" }];
}

export async function generateMetadata({ params }: PageProps<"/vehiculos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: "Vehículo no encontrado", robots: { index: false } };

  const title = vehicleDisplayName(v);
  const description = vehicleMetaDescription(v);
  const path = `/vehiculos/${v.slug}`;
  const cover = v.images[0];
  return {
    title,
    description,
    alternates: { canonical: path },
    // Vendidos y datos demo no se indexan.
    robots: v.status === "SOLD" || v.isDemo ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      ...(cover ? { images: [{ url: cover.src, alt: cover.alt }] } : {}),
    },
  };
}

function Spec({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/8 py-3 sm:block sm:border-0 sm:py-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">{label}</dt>
      <dd className="text-right font-medium sm:mt-1 sm:text-left sm:text-lg">{value}</dd>
    </div>
  );
}

export default async function VehiclePage({ params }: PageProps<"/vehiculos/[slug]">) {
  // params se espera fuera de Suspense: un slug inexistente responde 404 real.
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();

  const related = await getRelatedVehicles({ id: v.id, make: v.make, priceClp: v.priceClp });
  const name = vehicleDisplayName(v);
  const url = absoluteUrl(`/vehiculos/${v.slug}`);
  const price = formatClp(v.priceClp);
  const sold = v.status === "SOLD";
  const waHref = whatsappUrl(
    sold
      ? `Hola AutoDealer, vi que el ${name} ya se vendió. ¿Tienen algo similar?`
      : vehicleWhatsappMessage({ ...v, url }),
  );

  return (
    <>
      <JsonLd data={vehicleJsonLd(v, url)} />

      <Container className="pt-28 pb-16 sm:pt-32">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm text-mist">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-chalk">
                Inicio
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/vehiculos" className="hover:text-chalk">
                Vehículos
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-chalk/80">
              {v.make} {v.model}
            </li>
          </ol>
        </nav>

        {v.isDemo ? (
          <p
            role="note"
            className="mb-6 rounded-sm border border-dashed border-brand-yellow/50 bg-brand-yellow/5 px-4 py-3 text-sm"
          >
            <strong className="text-brand-yellow">Demo:</strong> ficha ficticia para revisar el diseño. No es un
            vehículo real.
          </p>
        ) : null}
        {sold ? (
          <p role="status" className="mb-6 rounded-sm bg-white px-4 py-3 text-sm font-semibold text-ink">
            Este vehículo ya fue vendido. Revisa otros disponibles más abajo o escríbenos.
          </p>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,1fr)] lg:gap-12">
          <VehicleGallery images={v.images} title={name} />

          <div>
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mist">{v.make}</p>
                <StatusBadge status={v.status} />
              </div>
              <h1 className="mt-2 font-display text-5xl leading-[0.92] font-extrabold uppercase italic tracking-tight text-balance">
                {v.model}
              </h1>
              {v.version ? <p className="mt-2 text-lg text-chalk/80">{v.version}</p> : null}

              <p className="mt-4 flex flex-wrap gap-x-3 text-sm text-mist">
                {[v.year, formatKm(v.mileageKm), v.transmission, v.fuelType].filter(Boolean).map((x, i) => (
                  <span key={i} className="after:ml-3 after:content-['·'] last:after:content-none">
                    {x}
                  </span>
                ))}
              </p>

              <div className="mt-6 rounded-md border border-white/10 bg-graphite-900 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">Precio</p>
                <p className="mt-1 font-display text-5xl leading-none font-bold tracking-tight">
                  {sold ? (
                    <span className="text-chalk/50 line-through">{price ?? "Vendido"}</span>
                  ) : (
                    (price ?? "Consultar")
                  )}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses(
                      "whatsapp",
                      "lg",
                      "w-full whitespace-nowrap px-4 text-[0.82rem] tracking-[0.04em] sm:text-[0.95rem] sm:tracking-[0.08em]",
                    )}
                  >
                    <WhatsAppIcon className="shrink-0" /> {sold ? "Buscar uno similar" : "Consultar por WhatsApp"}
                  </a>
                  <a href={`tel:${siteConfig.phoneE164}`} className={buttonClasses("outline", "lg", "w-full")}>
                    <PhoneIcon /> Llamar
                  </a>
                </div>
                {v.instagramPermalink ? (
                  <a
                    href={v.instagramPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-mist hover:text-chalk"
                  >
                    <InstagramIcon width={18} height={18} /> Ver publicación original en Instagram
                  </a>
                ) : null}
              </div>
              <p className="mt-4 text-xs text-mist">Precio en CLP. Confirma disponibilidad antes de tu visita.</p>
            </div>
          </div>
        </div>

        {v.content ? (
          <div className="mt-16 max-w-5xl">
            <CommercialDescription content={v.content} whatsappHref={waHref} />
          </div>
        ) : (
          <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)] lg:gap-12">
            <div className="space-y-12">
              <section aria-labelledby="specs-title">
                <h2 id="specs-title" className="font-display text-3xl font-extrabold uppercase italic">
                  Ficha técnica
                </h2>
                <dl className="mt-6 grid gap-x-8 sm:grid-cols-3 sm:gap-y-6">
                  <Spec label="Marca" value={v.make} />
                  <Spec label="Modelo" value={v.model} />
                  <Spec label="Versión" value={v.version} />
                  <Spec label="Año" value={v.year ? String(v.year) : null} />
                  <Spec label="Kilometraje" value={formatKm(v.mileageKm)} />
                  <Spec label="Motor" value={v.engine} />
                  <Spec label="Combustible" value={v.fuelType} />
                  <Spec label="Transmisión" value={v.transmission} />
                  <Spec label="Tracción" value={v.drivetrain} />
                  <Spec label="Color" value={v.color} />
                </dl>
              </section>

              {v.description ? (
                <section aria-labelledby="desc-title">
                  <h2 id="desc-title" className="font-display text-3xl font-extrabold uppercase italic">
                    Descripción
                  </h2>
                  <p className="mt-4 leading-relaxed whitespace-pre-line text-chalk/85">{v.description}</p>
                </section>
              ) : null}

              {v.features.length > 0 ? (
                <section aria-labelledby="features-title">
                  <h2 id="features-title" className="font-display text-3xl font-extrabold uppercase italic">
                    Equipamiento
                  </h2>
                  <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {v.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-chalk/85">
                        <span aria-hidden className="mt-2 h-1 w-3 shrink-0 -skew-x-[20deg] bg-brand-yellow" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </div>
        )}
      </Container>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="border-t border-white/8 bg-graphite-950 py-16 sm:py-20">
          <Container>
            <SectionHeading id="related-title" eyebrow="Sigue mirando" title="También te puede interesar" />
            <div className="mt-8">
              <VehicleGrid vehicles={related} />
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
