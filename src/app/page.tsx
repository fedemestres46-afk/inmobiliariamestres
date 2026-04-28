import Link from "next/link";
import { PropertiesExplorer } from "@/components/properties-explorer";
import { getPublishedProperties } from "@/lib/properties";

export const dynamic = "force-dynamic";

export default async function Home() {
  const properties = await getPublishedProperties();

  return (
    <main className="flex-1 bg-[var(--color-cream)] text-[var(--color-ink)]">
      <section className="hero-shell px-6 py-6 md:px-10 lg:px-14">
        <div className="hero-panel overflow-hidden rounded-[2rem] border border-white/30 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.26),_transparent_35%),linear-gradient(135deg,_rgba(24,47,60,0.96),_rgba(43,69,83,0.92)_48%,_rgba(198,122,66,0.88))] text-white shadow-[0_30px_80px_rgba(24,47,60,0.18)]">
          <header className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-center md:flex-row md:px-10 md:text-left">
            <div className="w-full md:w-auto">
              <h1 className="font-serif-display text-2xl tracking-[0.18em] md:text-3xl">
                MESTRES INMOBILIARIA
              </h1>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/80 md:gap-6">
              <a
                href="#propiedades"
                className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-white/85 transition hover:bg-white/18"
              >
                Propiedades
              </a>
              <a
                href="#servicios"
                className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-white/85 transition hover:bg-white/18"
              >
                Servicios
              </a>
              <a
                href="#contacto"
                className="rounded-full border border-white/18 bg-white/10 px-4 py-2 text-white/85 transition hover:bg-white/18"
              >
                Contacto
              </a>
            </nav>
          </header>

          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-10 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-20">
            <div className="space-y-8">
              <div className="space-y-5">
                <p className="max-w-xl text-sm uppercase tracking-[0.4em] text-[var(--color-sand)]">
                  Casilda y alrededores
                </p>
                <h2 className="max-w-3xl font-serif-display text-5xl leading-none md:text-7xl">
                  Propiedades con presencia premium y gestion simple.
                </h2>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a
                  href="#propiedades"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
                >
                  Ver propiedades destacadas
                </a>
                <Link
                  href="/propiedades"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver todas las propiedades
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <article className="rounded-[1.75rem] border border-white/20 bg-black/15 p-6 backdrop-blur-sm">
                <p className="mt-4 text-2xl leading-9">
                  Una mirada contemporanea para propiedades con caracter,
                  contexto y valor real.
                </p>
              </article>
              <article className="rounded-[1.75rem] border border-white/20 bg-white/12 p-6 backdrop-blur-sm">
                <p className="text-sm uppercase tracking-[0.3em] text-white/65">
                  Enfoque
                </p>
                <ul className="mt-4 space-y-3 text-white/82">
                  <li>Seleccion curada de propiedades</li>
                  <li>Presentacion visual cuidada</li>
                  <li>Acompanamiento comercial cercano</li>
                  <li>Procesos claros de punta a punta</li>
                </ul>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        id="servicios"
        className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:px-10 lg:grid-cols-3 lg:px-14"
      >
        {[
          {
            title: "Ventas",
            copy: "Acompanamiento comercial para publicar, posicionar y concretar operaciones con una presentacion cuidada.",
          },
          {
            title: "Compras",
            copy: "Busqueda y seleccion de oportunidades con seguimiento cercano para comprar con mas claridad y confianza.",
          },
          {
            title: "Tasaciones",
            copy: "Valoraciones realistas segun zona, contexto y demanda para tomar decisiones mejor informadas.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-[var(--color-line)] bg-white p-7 shadow-[0_18px_50px_rgba(35,43,50,0.06)]"
          >
            <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
              Servicio
            </p>
            <h3 className="mt-4 font-serif-display text-3xl">{item.title}</h3>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
              {item.copy}
            </p>
          </article>
        ))}
      </section>

      <section
        id="propiedades"
        className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-14"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-clay)]">
            Destacadas
          </p>
          <h3 className="mt-3 font-serif-display text-4xl md:text-5xl">
            Una portada que ya se siente inmobiliaria.
          </h3>
        </div>

        <PropertiesExplorer properties={properties} />
      </section>

      <section
        id="contacto"
        className="mx-auto max-w-7xl px-6 py-12 md:px-10 lg:px-14"
      >
        <div className="rounded-[2rem] bg-[var(--color-deep)] px-8 py-10 text-white md:px-10">
          <p className="text-sm uppercase tracking-[0.35em] text-[var(--color-sand)]">
            Asesoramiento integral
          </p>
          <h3 className="mt-4 max-w-3xl font-serif-display text-4xl md:text-5xl">
            Compra, venta y alquiler con una mirada clara y cercana.
          </h3>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">
            Acompanamos cada operacion con criterio comercial, seguimiento
            personalizado y una comunicacion simple para que cada decision se
            tome con mas confianza.
          </p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl items-center justify-between px-6 pb-10 pt-2 text-sm text-[var(--color-muted)] md:px-10 lg:px-14">
        <p>MESTRES INMOBILIARIA</p>
        <Link
          href="/admin"
          className="opacity-55 transition hover:opacity-100"
        >
          Acceso privado
        </Link>
      </footer>
    </main>
  );
}
