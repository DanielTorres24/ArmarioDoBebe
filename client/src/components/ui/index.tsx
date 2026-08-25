import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/** Peças de interface partilhadas por toda a aplicação. */

export const juntar = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

/* --------------------------------- Botão ---------------------------------- */

type Variante = 'primario' | 'suave' | 'contorno' | 'perigo' | 'ligacao';
type Tamanho = 'normal' | 'pequeno' | 'grande';

const variantes: Record<Variante, string> = {
  primario: 'bg-azul-500 text-white shadow-botao hover:bg-azul-600',
  suave: 'bg-azul-100 text-azul-800 hover:bg-azul-200',
  contorno: 'border border-azul-200 bg-white text-tinta hover:bg-azul-50',
  perigo: 'bg-estado-rosa-fundo text-estado-rosa hover:bg-rose-100',
  ligacao: 'text-azul-700 underline underline-offset-2 hover:text-azul-800',
};

const tamanhos: Record<Tamanho, string> = {
  pequeno: 'min-h-[40px] px-3 py-2 text-sm',
  normal: 'min-h-[44px] px-4 py-2.5',
  grande: 'min-h-[48px] px-6 py-3 text-lg',
};

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
}

export function Botao({
  variante = 'suave',
  tamanho = 'normal',
  className,
  ...props
}: BotaoProps) {
  const base =
    variante === 'ligacao'
      ? 'inline-flex items-center gap-1 font-bold transition disabled:opacity-60'
      : juntar(
          'inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition',
          'disabled:cursor-not-allowed disabled:opacity-60',
          tamanhos[tamanho],
        );

  return <button className={juntar(base, variantes[variante], className)} {...props} />;
}

/* -------------------------------- Etiquetas ------------------------------- */

export function Etiqueta({
  children,
  tom = 'azul',
  className,
}: {
  children: ReactNode;
  tom?: 'azul' | 'neutro' | 'verde' | 'ambar' | 'amarelo' | 'rosa';
  className?: string;
}) {
  const tons = {
    azul: 'bg-azul-100 text-azul-700',
    neutro: 'bg-slate-100 text-tinta-suave',
    verde: 'bg-estado-verde-fundo text-estado-verde',
    ambar: 'bg-estado-ambar-fundo text-estado-ambar',
    amarelo: 'bg-estado-amarelo-fundo text-estado-amarelo',
    rosa: 'bg-estado-rosa-fundo text-estado-rosa',
  } as const;

  return (
    <span
      className={juntar(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-bold',
        tons[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Modal --------------------------------- */

/**
 * Fecha com Esc, devolve o foco ao elemento anterior e prende o foco dentro do
 * diálogo. No telemóvel comporta-se como folha inferior.
 */
export function Modal({
  titulo,
  onFechar,
  children,
  largura = 'max-w-lg',
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  largura?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const focoAnterior = useRef<Element | null>(null);

  useEffect(() => {
    focoAnterior.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    const focaveis = () =>
      caixa.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) ?? ([] as unknown as NodeListOf<HTMLElement>);

    focaveis()[0]?.focus();

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onFechar();
        return;
      }
      if (evento.key !== 'Tab') return;

      const lista = focaveis();
      if (lista.length === 0) return;

      const primeiro = lista[0]!;
      const ultimo = lista[lista.length - 1]!;

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = '';
      (focoAnterior.current as HTMLElement | null)?.focus?.();
    };
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onFechar();
      }}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-do-modal"
        className={juntar(
          'max-h-[92dvh] w-full overflow-y-auto overscroll-contain bg-white p-5 shadow-forte',
          'rounded-t-3xl sm:rounded-3xl',
          largura,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="titulo-do-modal" className="text-xl">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="grid h-10 w-10 place-items-center rounded-full text-tinta-suave hover:bg-azul-50 hover:text-tinta"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* --------------------------------- Campos --------------------------------- */

export function Campo({
  id,
  label,
  erro,
  children,
  dica,
}: {
  id: string;
  label: string;
  erro?: string;
  children: ReactNode;
  dica?: string;
}) {
  return (
    <div className="mb-3.5">
      <label className="rotulo" htmlFor={id}>
        {label}
      </label>
      {children}
      {dica && !erro && <p className="mt-1.5 text-xs text-tinta-suave">{dica}</p>}
      {erro && (
        <p className="erro-campo" role="alert">
          {erro}
        </p>
      )}
    </div>
  );
}

/* ------------------------------- Mensagens -------------------------------- */

export function MensagemDeErro({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-2xl bg-estado-rosa-fundo px-3.5 py-2.5 text-sm font-semibold text-estado-rosa"
    >
      {children}
    </p>
  );
}

export function EstadoVazio({
  emoji,
  imagem,
  titulo,
  texto,
  children,
}: {
  emoji?: string;
  imagem?: string;
  titulo: string;
  texto?: string;
  children?: ReactNode;
}) {
  return (
    <div className="cartao px-6 py-10 text-center">
      {imagem ? (
        <img src={imagem} alt="" width={96} height={96} className="mx-auto mb-3 h-24 w-24 object-contain" />
      ) : (
        <span className="mb-2 block text-4xl" aria-hidden="true">
          {emoji ?? '🧸'}
        </span>
      )}
      <h2 className="mb-2 text-lg">{titulo}</h2>
      {texto && <p className="mx-auto mb-4 max-w-md text-sm text-tinta-suave">{texto}</p>}
      {children}
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <span aria-hidden="true" className={juntar('block esqueleto', className)} />;
}

/* --------------------------------- Toast ---------------------------------- */

export interface Aviso {
  tipo: 'sucesso' | 'erro';
  mensagem: string;
}

export function Toast({ aviso, onFechar }: { aviso: Aviso | null; onFechar: () => void }) {
  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(onFechar, 4000);
    return () => clearTimeout(temporizador);
  }, [aviso, onFechar]);

  if (!aviso) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={juntar(
        'fixed bottom-24 left-1/2 z-[60] flex w-[min(460px,calc(100%-1.5rem))] -translate-x-1/2',
        'animate-entrar items-center justify-between gap-3 rounded-2xl border px-4 py-3',
        'text-sm font-semibold shadow-forte sm:bottom-6',
        aviso.tipo === 'sucesso'
          ? 'border-emerald-200 bg-estado-verde-fundo text-estado-verde'
          : 'border-rose-200 bg-estado-rosa-fundo text-estado-rosa',
      )}
    >
      <span className="[overflow-wrap:anywhere]">{aviso.mensagem}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar aviso" className="shrink-0 px-1">
        ✕
      </button>
    </div>
  );
}
