import { useEffect, useState } from 'react';

import { Botao, Campo, Esqueleto, MensagemDeErro, Toast, type Aviso } from '../../components/ui';
import { adminApi } from '../../lib/api';
import { useCatalogo } from '../../lib/catalogo';
import type { SiteSettings } from '../../types';

type Formulario = Omit<SiteSettings, 'id' | 'reservationTtlDays'> & { reservationTtlDays: string };

const PRIVACIDADE = [
  { valor: 'PUBLIC', rotulo: 'Toda a gente vê quem reservou' },
  { valor: 'ADMIN_ONLY', rotulo: 'Só nós vemos quem reservou' },
  { valor: 'HIDDEN', rotulo: 'Aparece apenas “Reservado”' },
];

/** Tudo o que os pais podem personalizar no site. */
export default function Settings() {
  const { recarregar } = useCatalogo();

  const [form, setForm] = useState<Formulario | null>(null);
  const [erros, setErros] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  useEffect(() => {
    let ativo = true;

    adminApi.settings().then((definicoes) => {
      if (!ativo) return;
      const { id: _id, reservationTtlDays, ...resto } = definicoes;
      setForm({ ...resto, reservationTtlDays: reservationTtlDays == null ? '' : String(reservationTtlDays) });
    });

    return () => {
      ativo = false;
    };
  }, []);

  if (!form) {
    return (
      <div className="flex flex-col gap-3">
        <Esqueleto className="h-56 w-full rounded-card" />
        <Esqueleto className="h-56 w-full rounded-card" />
      </div>
    );
  }

  const texto =
    (campo: keyof Formulario) => (evento: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm({ ...form, [campo]: evento.target.value } as Formulario);
      setErros((anterior) => ({ ...anterior, [campo]: undefined }));
    };

  const opcao = (campo: keyof Formulario) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [campo]: evento.target.checked } as Formulario);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');

    const novos: Partial<Record<keyof Formulario, string>> = {};
    const obrigatorios: (keyof Formulario)[] = [
      'babyName',
      'siteName',
      'heroIcon',
      'heroTitle',
      'heroSubtitle',
      'primaryCtaLabel',
      'secondaryCtaLabel',
      'preferencesTitle',
      'footerText',
    ];

    for (const campo of obrigatorios) {
      if (!String(form[campo] ?? '').trim()) novos[campo] = 'Este campo é obrigatório.';
    }

    const prazo = form.reservationTtlDays.trim();
    if (prazo !== '' && (!Number.isInteger(Number(prazo)) || Number(prazo) < 1 || Number(prazo) > 365)) {
      novos.reservationTtlDays = 'O prazo tem de ser um número de dias entre 1 e 365.';
    }

    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    setOcupado(true);
    try {
      await adminApi.guardarDefinicoes({
        ...form,
        reservationTtlDays: prazo === '' ? null : Number(prazo),
      });
      await recarregar();
      setAviso({ tipo: 'sucesso', mensagem: 'Definições guardadas. 💙' });
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={submeter} noValidate>
      <header className="mb-4">
        <h1 className="text-2xl">Definições</h1>
        <p className="mt-1 text-sm text-tinta-suave">
          Os textos e as regras do site. Guarda no fim para aplicar tudo de uma vez.
        </p>
      </header>

      <section className="cartao mb-4 p-5" aria-labelledby="d-identidade">
        <h2 id="d-identidade" className="mb-4 text-lg">
          Identidade
        </h2>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[160px] flex-1">
            <Campo id="d-bebe" label="Nome do bebé *" erro={erros.babyName}>
              <input id="d-bebe" className="campo" value={form.babyName} onChange={texto('babyName')} aria-invalid={!!erros.babyName} />
            </Campo>
          </div>
          <div className="min-w-[160px] flex-1">
            <Campo id="d-site" label="Nome do site *" erro={erros.siteName}>
              <input id="d-site" className="campo" value={form.siteName} onChange={texto('siteName')} aria-invalid={!!erros.siteName} />
            </Campo>
          </div>
          <div className="w-[110px] shrink-0">
            <Campo id="d-icone" label="Emoji *" erro={erros.heroIcon}>
              <input id="d-icone" className="campo" maxLength={4} value={form.heroIcon} onChange={texto('heroIcon')} aria-invalid={!!erros.heroIcon} />
            </Campo>
          </div>
        </div>

        <Campo id="d-rodape" label="Texto do rodapé *" erro={erros.footerText}>
          <input id="d-rodape" className="campo" value={form.footerText} onChange={texto('footerText')} aria-invalid={!!erros.footerText} />
        </Campo>
      </section>

      <section className="cartao mb-4 p-5" aria-labelledby="d-inicial">
        <h2 id="d-inicial" className="mb-4 text-lg">
          Página inicial
        </h2>

        <Campo id="d-titulo" label="Título *" erro={erros.heroTitle}>
          <input id="d-titulo" className="campo" value={form.heroTitle} onChange={texto('heroTitle')} aria-invalid={!!erros.heroTitle} />
        </Campo>

        <Campo id="d-subtitulo" label="Texto de apresentação *" erro={erros.heroSubtitle}>
          <textarea id="d-subtitulo" className="campo" rows={3} value={form.heroSubtitle} onChange={texto('heroSubtitle')} aria-invalid={!!erros.heroSubtitle} />
        </Campo>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[200px] flex-1">
            <Campo id="d-cta1" label="Botão principal *" erro={erros.primaryCtaLabel}>
              <input id="d-cta1" className="campo" value={form.primaryCtaLabel} onChange={texto('primaryCtaLabel')} aria-invalid={!!erros.primaryCtaLabel} />
            </Campo>
          </div>
          <div className="min-w-[200px] flex-1">
            <Campo id="d-cta2" label="Botão secundário *" erro={erros.secondaryCtaLabel}>
              <input id="d-cta2" className="campo" value={form.secondaryCtaLabel} onChange={texto('secondaryCtaLabel')} aria-invalid={!!erros.secondaryCtaLabel} />
            </Campo>
          </div>
        </div>
      </section>

      <section className="cartao mb-4 p-5" aria-labelledby="d-gostos">
        <h2 id="d-gostos" className="mb-4 text-lg">
          Página de preferências
        </h2>

        <Campo id="d-gostos-titulo" label="Título *" erro={erros.preferencesTitle}>
          <input id="d-gostos-titulo" className="campo" value={form.preferencesTitle} onChange={texto('preferencesTitle')} aria-invalid={!!erros.preferencesTitle} />
        </Campo>

        <Campo id="d-gostos-intro" label="Texto de introdução">
          <textarea id="d-gostos-intro" className="campo" rows={2} value={form.preferencesIntro ?? ''} onChange={texto('preferencesIntro')} />
        </Campo>
      </section>

      <section className="cartao mb-4 p-5" aria-labelledby="d-reservas">
        <h2 id="d-reservas" className="mb-1 text-lg">
          Reservas
        </h2>
        <p className="mb-4 text-sm text-tinta-suave">
          Como funciona o “Quero oferecer isto” e quanta informação fica visível.
        </p>

        <div className="mb-4 flex flex-col gap-2.5">
          {[
            { campo: 'reservationEnabled' as const, rotulo: 'Permitir reservas de prendas' },
            { campo: 'allowThinking' as const, rotulo: 'Permitir o estado “estou a pensar oferecer”' },
            { campo: 'allowCancellation' as const, rotulo: 'Permitir que cancelem a própria reserva' },
          ].map((opcaoDeReserva) => (
            <label key={opcaoDeReserva.campo} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5 accent-azul-600"
                checked={Boolean(form[opcaoDeReserva.campo])}
                onChange={opcao(opcaoDeReserva.campo)}
              />
              <span>{opcaoDeReserva.rotulo}</span>
            </label>
          ))}
        </div>

        <Campo id="d-privacidade" label="Quem vê o nome de quem reservou">
          <select id="d-privacidade" className="campo" value={form.reserverVisibility} onChange={texto('reserverVisibility')}>
            {PRIVACIDADE.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.rotulo}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          id="d-prazo"
          label="Prazo das reservas “a pensar” (dias)"
          erro={erros.reservationTtlDays}
          dica="Deixa vazio para não expirarem."
        >
          <input
            id="d-prazo"
            className="campo"
            type="number"
            min={1}
            max={365}
            value={form.reservationTtlDays}
            onChange={texto('reservationTtlDays')}
            aria-invalid={!!erros.reservationTtlDays}
          />
        </Campo>
      </section>

      {erroGeral && <MensagemDeErro>{erroGeral}</MensagemDeErro>}

      <div className="sticky bottom-0 -mx-3 mt-4 border-t border-azul-100 bg-white/95 px-3 py-3 backdrop-blur sm:-mx-4 sm:px-4">
        <Botao type="submit" variante="primario" disabled={ocupado} className="w-full sm:w-auto">
          {ocupado ? 'A guardar...' : 'Guardar definições'}
        </Botao>
      </div>

      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
    </form>
  );
}
