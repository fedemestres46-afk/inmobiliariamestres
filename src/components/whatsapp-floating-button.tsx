export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/543464588659"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-3 rounded-full bg-[#25d366] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(20,88,49,0.28)] transition hover:scale-[1.02] hover:bg-[#20ba59]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5 fill-white"
        >
          <path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2a9.9 9.9 0 0 0-8.58 14.85L2 22l5.3-1.39A9.89 9.89 0 0 0 22 11.91a9.8 9.8 0 0 0-2.95-7Zm-7.02 15.3a8.27 8.27 0 0 1-4.21-1.15l-.3-.18-3.15.83.84-3.07-.2-.31a8.3 8.3 0 1 1 7.02 3.88Zm4.55-6.18c-.25-.12-1.47-.73-1.7-.81-.23-.09-.4-.12-.56.12-.17.24-.65.81-.8.97-.14.16-.3.18-.55.06-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.25-1.49-1.4-1.74-.15-.24-.02-.38.11-.5.11-.11.25-.3.37-.45.12-.15.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.11.15 1.52.09.46-.07 1.47-.6 1.68-1.17.21-.58.21-1.07.15-1.17-.05-.1-.22-.16-.47-.28Z" />
        </svg>
      </span>
      <span>Contactar WhatsApp</span>
    </a>
  );
}
