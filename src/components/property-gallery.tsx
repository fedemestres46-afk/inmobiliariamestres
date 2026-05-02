"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  title: string;
  images: string[];
};

export function PropertyGallery({ title, images }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const visibleImages = useMemo(
    () => (isExpanded ? images : images.slice(0, 3)),
    [images, isExpanded],
  );

  const remainingCount = Math.max(images.length - 3, 0);

  if (images.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-[var(--color-clay)]">
          Galeria
        </p>
        <h2 className="mt-3 font-serif-display text-4xl">Recorrido visual</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {visibleImages.map((image, index) => {
          const isLastCollapsedCard =
            !isExpanded && index === visibleImages.length - 1 && remainingCount > 0;

          const Card = (
            <article
              key={`${image}-${index}`}
              className="overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-white shadow-[0_18px_50px_rgba(35,43,50,0.06)]"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={image}
                  alt={`${title} imagen ${index + 2}`}
                  fill
                  className="object-cover"
                />
                {isLastCollapsedCard ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(24,47,60,0.48)]">
                    <div className="rounded-full border border-white/45 bg-[rgba(19,30,38,0.68)] px-6 py-3 text-center text-white shadow-[0_18px_40px_rgba(19,30,38,0.22)] backdrop-blur-sm">
                      <p className="text-4xl font-bold leading-none">+{remainingCount}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-white/82">
                        fotos
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );

          if (isLastCollapsedCard) {
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setIsExpanded(true)}
                className="text-left transition hover:-translate-y-0.5"
              >
                {Card}
              </button>
            );
          }

          return Card;
        })}
      </div>

      {images.length > 3 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-deep)] transition hover:bg-[var(--color-cream)]"
          >
            {isExpanded ? "Ver menos fotos" : `Ver las ${remainingCount} fotos restantes`}
          </button>
        </div>
      ) : null}
    </section>
  );
}
