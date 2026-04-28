import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <main className="flex-1 bg-[var(--color-cream)] text-[var(--color-ink)]">
      <section className="px-6 py-6 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/35 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_35%),linear-gradient(135deg,_rgba(24,47,60,0.96),_rgba(43,69,83,0.92)_48%,_rgba(198,122,66,0.88))] px-6 py-8 text-white shadow-[0_30px_80px_rgba(24,47,60,0.18)] md:px-10 md:py-10">
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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-6">
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
                <h1 className="max-w-4xl font-serif-display text-5xl leading-none md:text-7xl">
                  {property.title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-white/78">
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
                  <p className="text-white/58">Dormitorios</p>
                  <p className="mt-1 text-base text-white">{property.bedrooms}</p>
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

      <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 md:px-10 lg:px-14">
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
            </div>
          </article>
        </div>

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

        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-7 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
              Descripcion
            </p>
            <h2 className="mt-3 font-serif-display text-4xl">
              Una ficha lista para compartir
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">
              {description}
            </p>
          </article>

          <article className="rounded-[2rem] border border-[var(--color-line)] bg-white p-7 shadow-[0_18px_50px_rgba(35,43,50,0.06)]">
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
              Contacto
            </p>
            <h2 className="mt-3 font-serif-display text-4xl">
              Seguimiento comercial simple
            </h2>
            <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">
              Esta URL ya sirve para mandar por WhatsApp, publicar en redes o usar
              como ficha individual desde el panel.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[var(--color-deep)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-92"
              >
                Consultar esta propiedad
              </a>
              <Link
                href="/#propiedades"
                className="rounded-full border border-[var(--color-line)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
              >
                Volver al listado
              </Link>
            </div>
          </article>
        </div>

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
