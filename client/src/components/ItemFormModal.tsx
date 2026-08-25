import { useState } from 'react';

import { Botao, Campo, MensagemDeErro, Modal } from './ui';
import { useCatalogo } from '../lib/catalogo';
import { api } from '../lib/api';
import type { Item } from '../types';

interface Formulario {
  name: string;
  categoryId: string;
  ageRangeId: string;
  size: string;
  quantity: string;
  description: string;
}

const vazio: Formulario = {
  name: '',
  categoryId: '',
  ageRangeId: '',
  size: '',
  quantity: '1',
  description: '',
};

/** Formulário do convidado para acrescentar ou editar algo que o Diogo já tem. */
export default function ItemFormModal({
  item,
  onGuardado,
  onFechar,
  onMudarNome,
}: {
  item?: Item;
  onGuardado: (item: Item, criado: boolean) => void;
  onFechar: () => void;
  onMudarNome: () => void;
}) {
  const { categories, ageRanges, convidado } = useCatalogo();
  const aEditar = Boolean(item);

  const [form, setForm] = useState<Formulario>(() =>
    item
      ? {
          name: item.name,
          categoryId: item.categoryId,
          ageRangeId: item.ageRangeId ?? '',
          size: item.size ?? '',
          quantity: String(item.quantity),
          description: item.description ?? '',
        }
      : vazio,
  );

  const [erros, setErros] = useState<Partial<Record<keyof Formulario, string>>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [aGuardar, setAGuardar] = useState(false);

  const mudar = (campo: keyof Formulario) => (evento: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((anterior) => ({ ...anterior, [campo]: evento.target.value }));
    setErros((anterior) => ({ ...anterior, [campo]: undefined }));
  };

  const validar = () => {
    const novos: Partial<Record<keyof Formulario, string>> = {};

    if (form.name.trim().length < 1) novos.name = 'Escreve o nome do artigo.';
    else if (form.name.trim().length > 120) novos.name = 'O nome é demasiado longo (máximo 120).';

    if (!form.categoryId) novos.categoryId = 'Escolhe uma categoria.';

    const quantidade = Number(form.quantity);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 999) {
      novos.quantity = 'A quantidade tem de ser um número entre 1 e 999.';
    }

    if (form.description.trim().length > 600) {
      novos.description = 'A descrição é demasiado longa (máximo 600).';
    }

    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setErroGeral('');
    if (!convidado || !validar()) return;

    setAGuardar(true);
    try {
      const dados = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        ageRangeId: form.ageRangeId || null,
        size: form.size.trim(),
        quantity: Number(form.quantity),
        description: form.description.trim(),
      };

      const guardado = item
        ? await api.editarArtigo(item.id, { ...dados, ownerId: convidado.id })
        : await api.criarArtigo({ ...dados, ownerId: convidado.id, ownerName: convidado.name });

      onGuardado(guardado, !item);
    } catch (problema) {
      setErroGeral(problema instanceof Error ? problema.message : 'Não foi possível guardar.');
      setAGuardar(false);
    }
  };

  return (
    <Modal titulo={aEditar ? 'Editar artigo ✏️' : 'Adicionar ao armário 🧸'} onFechar={onFechar}>
      <form onSubmit={submeter} noValidate>
        {convidado && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-azul-100 px-3.5 py-2.5 text-sm text-azul-800">
            <span>
              A guardar como <strong>{convidado.name}</strong>
            </span>
            <Botao type="button" variante="ligacao" onClick={onMudarNome} className="text-sm">
              Não sou eu
            </Botao>
          </div>
        )}

        <p className="mb-4 text-sm text-tinta-suave">
          Aqui acrescentas o que o Diogo <strong>já tem</strong> — assim ninguém repete a prenda.
        </p>

        <Campo id="artigo-nome" label="O que queres acrescentar? *" erro={erros.name}>
          <input
            id="artigo-nome"
            className="campo"
            type="text"
            value={form.name}
            placeholder="Ex.: Body, chucha, manta..."
            aria-invalid={erros.name ? 'true' : 'false'}
            onChange={mudar('name')}
          />
        </Campo>

        <Campo id="artigo-categoria" label="Categoria *" erro={erros.categoryId}>
          <select
            id="artigo-categoria"
            className="campo"
            value={form.categoryId}
            aria-invalid={erros.categoryId ? 'true' : 'false'}
            onChange={mudar('categoryId')}
          >
            <option value="">Escolhe uma categoria</option>
            {categories.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.icon} {categoria.name}
              </option>
            ))}
          </select>
        </Campo>

        <div className="flex flex-wrap gap-3">
          <div className="min-w-[140px] flex-1">
            <Campo id="artigo-faixa" label="Faixa etária">
              <select id="artigo-faixa" className="campo" value={form.ageRangeId} onChange={mudar('ageRangeId')}>
                <option value="">Não se aplica</option>
                {ageRanges.map((faixa) => (
                  <option key={faixa.id} value={faixa.id}>
                    {faixa.label}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <div className="w-[110px] shrink-0">
            <Campo id="artigo-quantidade" label="Quantidade" erro={erros.quantity}>
              <input
                id="artigo-quantidade"
                className="campo"
                type="number"
                inputMode="numeric"
                min={1}
                max={999}
                value={form.quantity}
                aria-invalid={erros.quantity ? 'true' : 'false'}
                onChange={mudar('quantity')}
              />
            </Campo>
          </div>
        </div>

        <Campo id="artigo-tamanho" label="Tamanho" dica="Ex.: 0-3 meses, T2, 62">
          <input
            id="artigo-tamanho"
            className="campo"
            type="text"
            value={form.size}
            placeholder="Ex.: 0-3 meses"
            onChange={mudar('size')}
          />
        </Campo>

        <Campo id="artigo-descricao" label="Observações" erro={erros.description}>
          <textarea
            id="artigo-descricao"
            className="campo"
            rows={3}
            value={form.description}
            placeholder="Informação adicional (opcional)..."
            aria-invalid={erros.description ? 'true' : 'false'}
            onChange={mudar('description')}
          />
        </Campo>

        {erroGeral && <MensagemDeErro>{erroGeral}</MensagemDeErro>}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Botao type="button" variante="contorno" onClick={onFechar} disabled={aGuardar}>
            Cancelar
          </Botao>
          <Botao type="submit" variante="primario" disabled={aGuardar}>
            {aGuardar ? 'A guardar...' : aEditar ? 'Guardar alterações' : 'Guardar artigo'}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
