import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PropertyDetailContact } from "@/components/property-detail-contact";
import { getPropertyBySlug, getRelatedProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

function buildPropertyDescription(args: {
  title: string;
  operation: string;
  type: string;
  location: string;
  surface: string;
  price: string;
  description?: string;
}) {
  if (args.description) {
    return args.description;
  }

  return `${args.operation} de ${args.type.toLowerCase()} en ${args.location}. ${args.surface}. ${args.price}.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    return {
      title: "Propiedad no encontrada | Mestres Inmobiliaria",
      description: "La propiedad solicitada no esta disponible actualmente.",
    };
  }

  const description = buildPropertyDescription({
    title: property.title,
    operation: property.operation,
    type: property.type,
    location: property.location,
    surface: property.surface,
    price: property.price,
    description: property.description,
  });

  return {
    title: `${property.title} | Mestres Inmobiliaria`,
    description,
    openGraph: {
      title: `${property.title} | Mestres Inmobiliaria`,
      description,
      images: [
        {
          url: property.cover,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} | Mestres Inmobiliaria`,
      description,
      images: [property.cover],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const relatedProperties = await getRelatedProperties(property.id, 3);
  const whatsappHref = `https://wa.me/543464588659?text=${encodeURIComponent(
    `Hola, quiero consultar por ${property.title} (${property.location}).`,
  )}`;
  const description = buildPropertyDescription({
    title: property.title,
    operation: property.operation,
    type: property.type,
    location: property.location,
    surface: property.surface,
    price: property.price,
    description: property.description,
  });
  const propertySchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description,
    image: property.gallery,
    url: `/propiedades/${property.slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: property.currency,
      price: property.numericPrice,
      availability: "https://schema.org/InStock",
    },
    itemOffered: {
      "@type": "Residence",
      name: property.title,
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.surfaceM2,
        unitCode: "MTK",
      },
      numberOfRooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.location,
      },
      ...(property.services.length > 0 || property.amenities.length > 0
        ? {
            amenityFeature: [...property.services, ...property.amenities].map(
              (label) => ({
                "@type": "LocationFeatureSpecification",
                name: label,
                value: true,
              }),
            ),
          }
        : {}),
    },
  };

  return (
    <main className="flex-1 bg-[var(--color-cream)] text-[var(--color-ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(propertySchema) }}
      />
      <section className="px-6 py-6 md:px-10 lg:px-14">
        <div className="mx-auto max-w-[104rem] rounded-[2rem] border border-white/35 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_35%),linear-gradient(135deg,_rgba(24,47,60,0.96),_rgba(43,69,83,0.92)_48%,_rgba(198,122,66,0.88))] px-6 py-8 text-white shadow-[0_30px_80px_rgba(24,47,60,0.18)] md:px-12 md:py-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/78">
            <Link href="/" className="transition hover:text-white">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/#propiedades" className="transition hover:text-white">
              Propiedades
            </Link>
            <span>/</span>
            <span className="text-white">{property.title}</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-6 self-start">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-white/12 px-4 py-2 text-white">
                  {property.operation}
                </span>
                <span className="rounded-full border border-white/20 px-4 py-2 text-white/84">
                  {property.type}
                </span>
                <span className="rounded-full border border-white/20 px-4 py-2 text-white/84">
                  {property.location}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-5xl font-serif-display text-5xl leading-none md:text-7xl">
                  {property.title}
                </h1>
              </div>

              <div className="max-w-4xl rounded-[1.75rem] border border-white/16 bg-white/8 p-5 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-sand)]">
                  Descripcion
                </p>
                <p className="mt-4 text-lg leading-8 text-white/78">
                  {description}
                </p>
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-white/18 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-sand)]">
                Valor de referencia
              </p>
              <p className="mt-4 font-serif-display text-5xl leading-none">
                {property.price}
              </p>
              <div className="mt-6 grid gap-3 text-sm text-white/84 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3">
                  <p className="text-white/58">Superficie</p>
                  <p className="mt-1 text-base text-white">{property.surface}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3">
                  <p className="text-white/58">Cubiertos</p>
                  <p className="mt-1 text-base text-white">
                    {property.coveredSurfaceM2} m2
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3">
                  <p className="text-white/58">Ambientes</p>
                  <p className="mt-1 text-base text-white">{property.rooms}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3">
                  <p className="text-white/58">Dormitorios</p>
                  <p className="mt-1 text-base text-white">{property.bedrooms}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3">
                  <p className="text-white/58">Baños</p>
                  <p className="mt-1 text-base text-white">{property.bathrooms}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/16 bg-black/10 px-4 py-3 sm:col-span-2">
                  <p className="text-white/58">Cochera</p>
                  <p className="mt-1 text-base text-white">
                    {property.garageSpaces > 0
                      ? `${property.garageSpaces} espacio${property.garageSpaces === 1 ? "" : "s"}`
                      : "Sin cochera"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                >
                  Consultar por WhatsApp
                </a>
                {property.mapsUrl ? (
                  <a
                    href={property.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-white/22 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Ver ubicacion
                  </a>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[104rem] space-y-8 px-6 py-8 md:px-12 lg:px-16">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <article className="overflow-hidden rounded-[2rem] border border-[var(--color-line)] bg-white shadow-[0_22px_60px_rgba(35,43,50,0.08)]">
            <div className="relative aspect-[16/10]">
              <Image
                src={property.cover}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
              Ficha
            </p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Operacion</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">{property.operation}</p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Tipo</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">{property.type}</p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Zona</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">{property.location}</p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">m2 cubiertos</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">
                  {property.coveredSurfaceM2}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Ambientes</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">{property.rooms}</p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Baños</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">{property.bathrooms}</p>
              </div>
              <div className="rounded-[1.35rem] bg-[var(--color-cream)] px-4 py-4">
                <p className="text-sm text-[var(--color-muted)]">Cocheras</p>
                <p className="mt-1 text-lg text-[var(--color-deep)]">
                  {property.garageSpaces}
                </p>
              </div>
            </div>
          </article>
        </div>

        {property.services.length > 0 || property.amenities.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {property.services.length > 0 ? (
              <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
                <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
                  Servicios
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {property.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-2 text-sm text-[var(--color-deep)]"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </article>
            ) : null}

            {property.amenities.length > 0 ? (
              <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-6 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
                <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
                  Adicionales
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {property.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full border border-[var(--color-line)] bg-[var(--color-cream)] px-4 py-2 text-sm text-[var(--color-deep)]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </article>
            ) : null}
          </div>
        ) : null}

        {property.gallery.length > 1 ? (
          <section className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
                Galeria
              </p>
              <h2 className="mt-3 font-serif-display text-4xl">Recorrido visual</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {property.gallery.slice(1).map((image, index) => (
                <article
                  key={`${image}-${index}`}
                  className="overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-white shadow-[0_18px_50px_rgba(35,43,50,0.06)]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image}
                      alt={`${property.title} imagen ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <PropertyDetailContact
          propertyId={property.id}
          propertyTitle={property.title}
        />

        {relatedProperties.length > 0 ? (
          <section className="space-y-4 py-4">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
                Otras opciones
              </p>
              <h2 className="mt-3 font-serif-display text-4xl">
                Propiedades relacionadas
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedProperties.map((relatedProperty) => (
                <article
                  key={relatedProperty.id}
                  className="overflow-hidden rounded-[1.85rem] border border-[var(--color-line)] bg-white shadow-[0_18px_50px_rgba(35,43,50,0.06)]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={relatedProperty.cover}
                      alt={relatedProperty.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-[var(--color-cream)] px-3 py-1 text-[var(--color-deep)]">
                        {relatedProperty.operation}
                      </span>
                      <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[var(--color-muted)]">
                        {relatedProperty.type}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif-display text-3xl">
                        {relatedProperty.title}
                      </h3>
                      <p className="mt-2 text-[var(--color-muted)]">
                        {relatedProperty.location}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[var(--color-deep)]">{relatedProperty.price}</p>
                      <Link
                        href={`/propiedades/${relatedProperty.slug}`}
                        className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                      >
                        Ver ficha
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
