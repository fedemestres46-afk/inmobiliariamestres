import type { Metadata } from "next";
import Link from "next/link";
import { PropertiesExplorer } from "@/components/properties-explorer";
import { getPublishedProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propiedades | Mestres Inmobiliaria",
  description:
    "Explora propiedades publicadas de Mestres Inmobiliaria con filtros, mapa y fichas individuales listas para compartir.",
};

export default async function PropertiesPage() {
  const properties = await getPublishedProperties();

  return (
    <main className="flex-1 bg-[var(--color-cream)] text-[var(--color-ink)]">
      <section className="hero-shell px-6 py-6 md:px-10 lg:px-14">
        <div className="mx-auto max-w-[96rem] overflow-hidden rounded-[2rem] border border-white/30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_35%),linear-gradient(135deg,_rgba(24,47,60,0.96),_rgba(43,69,83,0.92)_48%,_rgba(198,122,66,0.88))] px-6 py-8 text-white shadow-[0_30px_80px_rgba(24,47,60,0.18)] md:px-10 md:py-12">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/78">
            <Link href="/" className="transition hover:text-white">
              Inicio
            </Link>
            <span>/</span>
            <span className="text-white">Propiedades</span>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-sand)]">
                Catalogo completo
              </p>
              <h1 className="max-w-5xl font-serif-display text-5xl leading-none md:text-7xl">
                Un listado pensado para explorar, compartir y convertir.
              </h1>
              <p className="max-w-4xl text-lg leading-8 text-white/78">
                Todas las propiedades publicadas en un solo lugar, con filtros,
                mapa y acceso directo a cada ficha individual.
              </p>
            </div>

            <article className="rounded-[1.75rem] border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.3em] text-white/65">
                En esta vista
              </p>
              <ul className="mt-4 space-y-3 text-white/84">
                <li>Filtros por operacion, tipo y zona</li>
                <li>Orden por precio, metros y ambientes</li>
                <li>Mapa con propiedades geolocalizadas</li>
                <li>Fichas individuales listas para compartir</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[96rem] px-6 py-12 md:px-10 lg:px-14">
        <PropertiesExplorer properties={properties} />
      </section>
    </main>
  );
}
