import { useCatalogo } from '../lib/catalogo';

/**
 * Nota dos pais sobre prendas em segunda mão.
 * O texto vem das definições do site, para os pais o poderem mudar em /admin
 * sem mexer no código. Se estiver vazio, não aparece nada.
 */
export default function NotaDePrendas({ className = '' }: { className?: string }) {
  const { settings } = useCatalogo();
  const nota = settings?.giftNote?.trim();

  if (!nota) return null;

  return (
    <aside
      className={`rounded-card border border-estado-verde/25 bg-estado-verde-fundo p-4 sm:p-5 ${className}`}
    >
      <p className="flex gap-3 text-sm text-tinta sm:text-base">
        <span aria-hidden="true" className="text-xl leading-none">
          ♻️
        </span>
        <span className="[overflow-wrap:anywhere]">{nota}</span>
      </p>
    </aside>
  );
}
