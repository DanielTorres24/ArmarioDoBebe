import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from './api';
import { guardarConvidado, lerConvidado, type Convidado } from './guest';
import type { AgeRange, Category, SiteSettings, StatusSetting } from '../types';

/**
 * Dados que praticamente todas as páginas precisam: definições do site,
 * categorias, faixas etárias, estados e a identidade do convidado.
 * Carregados uma vez à entrada.
 */

interface Catalogo {
  settings: SiteSettings | null;
  categories: Category[];
  ageRanges: AgeRange[];
  statuses: StatusSetting[];
  carregando: boolean;
  erro: string;
  recarregar: () => Promise<void>;

  convidado: Convidado | null;
  guardarNome: (nome: string, email?: string) => Convidado | null;
}

const Contexto = createContext<Catalogo | null>(null);

export function CatalogoProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ageRanges, setAgeRanges] = useState<AgeRange[]>([]);
  const [statuses, setStatuses] = useState<StatusSetting[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [convidado, setConvidado] = useState<Convidado | null>(lerConvidado);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const [s, c, f, e] = await Promise.all([
        api.settings(),
        api.categories(),
        api.ageRanges(),
        api.statuses(),
      ]);
      setSettings(s);
      setCategories(c);
      setAgeRanges(f);
      setStatuses(e);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : 'Não foi possível carregar o site.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const guardarNome = useCallback((nome: string, email?: string) => {
    const guardado = guardarConvidado(nome, email);
    if (guardado) setConvidado(guardado);
    return guardado;
  }, []);

  const valor = useMemo<Catalogo>(
    () => ({
      settings,
      categories,
      ageRanges,
      statuses,
      carregando,
      erro,
      recarregar,
      convidado,
      guardarNome,
    }),
    [settings, categories, ageRanges, statuses, carregando, erro, recarregar, convidado, guardarNome],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCatalogo(): Catalogo {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useCatalogo tem de ser usado dentro de <CatalogoProvider>.');
  return contexto;
}

/** Procura a configuração visual de um estado, com uma alternativa segura. */
export function useEstado(statuses: StatusSetting[]) {
  return useCallback(
    (chave: string) =>
      statuses.find((estado) => estado.status === chave) ?? {
        id: 0,
        status: chave as StatusSetting['status'],
        label: chave,
        icon: '•',
        color: 'neutro',
        description: '',
        sortOrder: 99,
      },
    [statuses],
  );
}

/** Traduz a cor guardada pelos pais no tom usado pelas etiquetas. */
export function tomDoEstado(color: string): 'verde' | 'ambar' | 'amarelo' | 'rosa' | 'neutro' {
  switch (color) {
    case 'green':
    case 'verde':
      return 'verde';
    case 'amber':
    case 'ambar':
      return 'ambar';
    case 'yellow':
    case 'amarelo':
      return 'amarelo';
    case 'rose':
    case 'red':
    case 'rosa':
      return 'rosa';
    default:
      return 'neutro';
  }
}
