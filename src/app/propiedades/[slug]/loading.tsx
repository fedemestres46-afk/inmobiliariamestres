export default function Loading() {
  return (
    <main className="flex-1 bg-[var(--color-cream)] text-[var(--color-ink)]">
      <section className="px-6 py-6 md:px-10 lg:px-14">
        <div className="mx-auto max-w-7xl animate-pulse rounded-[2rem] border border-white/35 bg-[linear-gradient(135deg,_rgba(24,47,60,0.96),_rgba(43,69,83,0.92)_48%,_rgba(198,122,66,0.88))] px-6 py-10 md:px-10">
          <div className="h-4 w-48 rounded-full bg-white/20" />
          <div className="mt-8 h-20 max-w-3xl rounded-[2rem] bg-white/16" />
          <div className="mt-5 h-8 max-w-2xl rounded-full bg-white/14" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 md:px-10 lg:px-14">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="aspect-[16/10] animate-pulse rounded-[2rem] bg-white/70" />
          <div className="animate-pulse rounded-[2rem] bg-white/70" />
        </div>
      </section>
    </main>
  );
}
