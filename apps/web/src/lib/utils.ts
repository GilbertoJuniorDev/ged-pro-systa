import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ArquivoDto } from '@/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function localizacaoArquivo(arquivo: Pick<ArquivoDto, 'predio' | 'sala' | 'estante' | 'prateleira' | 'caixa'>): string {
  const partes = [arquivo.predio, arquivo.sala, arquivo.estante, arquivo.prateleira, arquivo.caixa].filter(
    (p): p is string => Boolean(p),
  );
  return partes.length > 0 ? partes.join(' / ') : '—';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
