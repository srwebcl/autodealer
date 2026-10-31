import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClasses } from "@/components/ui/button-link";
import {
  ArrowRightIcon,
  ClockIcon,
  InstagramIcon,
  PercentIcon,
  PhoneIcon,
  PinIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { CommercialDescription } from "@/components/vehicles/commercial-description";
import { StatusBadge } from "@/components/vehicles/status-badge";
import { VehicleGallery } from "@/components/vehicles/vehicle-gallery";
import { VehicleGrid } from "@/components/vehicles/vehicle-grid";
import { siteConfig } from "@/config/site";
import { extraKeyData } from "@/lib/instagram/commercial-content";
import { absoluteUrl } from "@/lib/seo/urls";
import {
  vehicleDisplayName,
  vehicleJsonLd,
  vehicleMetaDescription,
} from "@/lib/seo/vehicle";
import { formatClp, formatKm } from "@/lib/utils/format";
import { vehicleWhatsappMessage, whatsappUrl } from "@/lib/whatsapp";
import {
  getIndexableSlugs,
  getRelatedVehicles,
  getVehicleBySlug,
} from "@/server/vehicles/queries";

/** Prerenderiza las fichas actuales. Las nuevas se generan en la primera visita. */
export async function generateStaticParams() {
  const slugs = await getIndexableSlugs();
  // Cache Components exige al menos un parámetro; el marcador responde 404.
  return slugs.length
    ? slugs.map(({ slug }) => ({ slug }))
    : [{ slug: "__sin-vehiculos__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/vehiculos/[slug]">): Promise<Metadata> {
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
    // Vendidos no se indexan.
    robots: !siteConfig.indexable
      ? { index: false, follow: false }
      : v.status === "SOLD"
        ? { index: false, follow: true }
        : undefined,
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      ...(cover ? { images: [{ url: cover.src, alt: cover.alt }] } : {}),
    },
  };
}

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.addressWithReference)}`;

export default async function VehiclePage({
  params,
}: PageProps<"/vehiculos/[slug]">) {
  // params se espera fuera de Suspense: un slug inexistente responde 404 real.
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) notFound();

  const related = await getRelatedVehicles({
    id: v.id,
    make: v.make,
    priceClp: v.priceClp,
  });
  const name = vehicleDisplayName(v);
  const url = absoluteUrl(`/vehiculos/${v.slug}`);
  const price = formatClp(v.priceClp);
  const sold = v.status === "SOLD";
  const waHref = whatsappUrl(
    sold
      ? `Hola AutoDealer, vi que el ${name} ya se vendió. ¿Tienen algo similar?`
      : vehicleWhatsappMessage({ ...v, url }),
  );

  // Una sola lista de datos: campos estructurados + datos del caption sin campo propio.
  const specs = [
    { label: "Año", value: v.year ? String(v.year) : null },
    { label: "Kilometraje", value: formatKm(v.mileageKm) },
    { label: "Transmisión", value: v.transmission },
    { label: "Combustible", value: v.fuelType },
    { label: "Motor", value: v.engine },
    { label: "Tracción", value: v.drivetrain },
    { label: "Color", value: v.color },
    ...(v.content ? extraKeyData(v.content) : []),
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  const priceNode = sold ? (
    <span className="text-chalk/45 line-through">{price ?? "Vendido"}</span>
  ) : (
    (price ?? "Consultar precio")
  );

  return (
    <>
      <JsonLd data={vehicleJsonLd(v, url)} />

      <Container className="pt-20 pb-28 sm:pt-28 lg:pb-20">
        {/* Escritorio: el bloque mide galería (cuadrada, alto de pantalla) + ficha, y se centra: sin hueco entre ambas. */}
        <div className="lg:mx-auto lg:max-w-[calc(100svh-13rem+3rem+23rem)] xl:max-w-[calc(100svh-13rem+3rem+26rem)]">
          <nav
            aria-label="Ruta de navegación"
            className="mb-4 text-sm text-mist max-sm:hidden"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/vehiculos" className="hover:text-chalk">
                  Vehículos
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/vehiculos?marca=${encodeURIComponent(v.make)}`}
                  className="hover:text-chalk"
                >
                  {v.make}
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="text-chalk/80">
                {v.model}
              </li>
            </ol>
          </nav>

          {sold ? (
            <p
              role="status"
              className="mb-6 rounded-sm bg-white px-4 py-3 text-sm font-semibold text-ink"
            >
              Este vehículo ya fue vendido. Revisa otros disponibles más abajo o
              escríbenos.
            </p>
          ) : null}

          <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <VehicleGallery images={v.images} title={name} />
            </div>

            {/* Panel de decisión: acompaña la lectura en escritorio. */}
            <aside
              aria-label="Resumen y contacto"
              className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1"
            >
              <div className="lg:sticky lg:top-24">
                <div className="flex items-center gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">
                    {v.make}
                    {v.year ? ` · ${v.year}` : null}
                  </p>
                  <StatusBadge status={v.status} />
                </div>
                <h1 className="mt-1.5 font-display text-[2.6rem] leading-[0.95] font-extrabold uppercase italic tracking-tight text-balance">
                  {v.model}
                </h1>
                {v.version ? (
                  <p className="mt-1.5 text-chalk/70">{v.version}</p>
                ) : null}

                <p className="mt-5 font-display text-[2.6rem] leading-none font-bold tracking-tight">
                  {priceNode}
                </p>
                {!sold && price ? (
                  <p className="mt-1.5 text-xs text-mist">
                    Precio en CLP · confirma disponibilidad antes de tu visita
                  </p>
                ) : null}

                <div className="mt-6 flex flex-col gap-2.5">
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses(
                      "whatsapp",
                      "lg",
                      "w-full whitespace-nowrap px-4 text-[0.85rem] tracking-[0.06em]",
                    )}
                  >
                    <WhatsAppIcon className="shrink-0" />{" "}
                    {sold ? "Buscar uno similar" : "Consultar por WhatsApp"}
                  </a>
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${siteConfig.phoneE164}`}
                      className={buttonClasses("outline", "md", "w-full px-3")}
                    >
                      <PhoneIcon width={18} height={18} /> Llamar
                    </a>
                    {v.instagramPermalink ? (
                      <a
                        href={v.instagramPermalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClasses(
                          "outline",
                          "md",
                          "w-full px-3",
                        )}
                      >
                        <InstagramIcon width={18} height={18} /> Instagram
                      </a>
                    ) : null}
                  </div>
                  {!sold ? (
                    <Link
                      href={`/financiamiento?vehiculo=${encodeURIComponent(name)}#formulario`}
                      className="group flex items-center gap-3 rounded-sm border border-white/10 px-4 py-3 text-sm transition-colors hover:border-brand-yellow"
                    >
                      <PercentIcon
                        width={18}
                        height={18}
                        className="shrink-0 text-brand-yellow"
                      />
                      <span className="flex-1">
                        <span className="font-semibold text-chalk">
                          Financiar este auto
                        </span>
                        <span className="block text-xs text-mist">
                          Autofin, Global, Unidad Crédito y otras
                        </span>
                      </span>
                      <ArrowRightIcon
                        width={16}
                        height={16}
                        className="text-mist transition-colors group-hover:text-brand-yellow"
                      />
                    </Link>
                  ) : null}
                </div>

                {specs.length > 0 ? (
                  <dl className="mt-7 divide-y divide-white/8 border-y border-white/8 text-sm">
                    {specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-baseline justify-between gap-6 py-2.5"
                      >
                        <dt className="shrink-0 text-mist">{s.label}</dt>
                        <dd className="text-right font-medium text-chalk">
                          {s.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                <div className="mt-6 space-y-3 text-sm">
                  <p className="flex gap-3 text-chalk/80">
                    <PinIcon
                      width={18}
                      height={18}
                      className="mt-0.5 shrink-0 text-brand-yellow"
                    />
                    <span>
                      {siteConfig.addressWithReference}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 font-semibold whitespace-nowrap text-chalk hover:text-brand-yellow"
                      >
                        Cómo llegar <ArrowRightIcon width={13} height={13} />
                      </a>
                    </span>
                  </p>
                  <div className="flex gap-3 text-chalk/80">
                    <ClockIcon
                      width={18}
                      height={18}
                      className="mt-0.5 shrink-0 text-brand-yellow"
                    />
                    <dl>
                      {siteConfig.hours.map((h) => (
                        <div key={h.days} className="flex gap-1.5">
                          <dt>{h.days}:</dt>
                          <dd className="text-chalk">{h.time}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:pt-6">
              {v.content ? (
                <CommercialDescription content={v.content} />
              ) : (
                <div className="space-y-10">
                  {v.description ? (
                    <section aria-labelledby="desc-title">
                      <h2
                        id="desc-title"
                        className="font-display text-2xl font-bold uppercase italic"
                      >
                        Descripción
                      </h2>
                      <p className="mt-4 max-w-[68ch] leading-relaxed whitespace-pre-line text-chalk/80">
                        {v.description}
                      </p>
                    </section>
                  ) : null}
                  {v.features.length > 0 ? (
                    <section aria-labelledby="features-title">
                      <h2
                        id="features-title"
                        className="font-display text-2xl font-bold uppercase italic"
                      >
                        Equipamiento
                      </h2>
                      <ul className="mt-4 grid border-b border-white/8 md:grid-cols-2 md:gap-x-10">
                        {v.features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-3 border-t border-white/8 py-3 text-chalk/80"
                          >
                            <span
                              aria-hidden
                              className="mt-2.5 h-0.5 w-3 shrink-0 -skew-x-[20deg] bg-brand-yellow"
                            />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>

      {related.length > 0 ? (
        <section
          aria-labelledby="related-title"
          className="border-t border-white/8 bg-graphite-950 py-14 sm:py-20"
        >
          <Container>
            <SectionHeading
              id="related-title"
              eyebrow="Sigue mirando"
              title="También te puede interesar"
            />
            <div className="mt-8">
              <VehicleGrid vehicles={related} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Móvil: precio y contacto siempre a mano (reemplaza al botón flotante de WhatsApp). */}
      <div
        data-vehicle-bar
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-white/10 bg-ink/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-mist">
            {v.make} {v.model}
            {v.year ? ` · ${v.year}` : null}
          </p>
          <p className="font-display text-2xl leading-none font-bold tracking-tight">
            {priceNode}
          </p>
        </div>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses("whatsapp", "md", "shrink-0 px-4")}
        >
          <WhatsAppIcon className="shrink-0" /> {sold ? "Similar" : "Consultar"}
        </a>
      </div>
    </>
  );
}
