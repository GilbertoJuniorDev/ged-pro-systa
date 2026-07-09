import type { TipoDocumento } from '@ged/types';

/** Formata 11 dígitos numéricos como CPF: XXX.XXX.XXX-XX */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Remove máscara de CPF, retornando apenas os 11 dígitos */
export function stripCpfMask(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata 14 dígitos numéricos como CNPJ: XX.XXX.XXX/XXXX-XX */
export function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/** Remove máscara de CNPJ, retornando apenas os 14 dígitos */
export function stripCnpjMask(value: string): string {
  return value.replace(/\D/g, '');
}

const CPF_FIRST_DIGIT_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CPF_SECOND_DIGIT_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_FIRST_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_SECOND_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Calcula um dígito verificador pelo algoritmo padrão de módulo 11 (Receita Federal) */
function calcularDigitoVerificadorModulo11(
  digitos: readonly number[],
  pesos: readonly number[],
): number {
  const soma = digitos.reduce((acumulado, digito, indice) => acumulado + digito * pesos[indice], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** true quando todos os dígitos da string são idênticos (ex.: "00000000000") */
function isSequenciaRepetida(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

/** Valida um CPF (com ou sem máscara) pelos dois dígitos verificadores do módulo 11 */
export function isValidCpf(value: string): boolean {
  const digits = stripCpfMask(value);
  if (digits.length !== 11 || isSequenciaRepetida(digits)) return false;

  const numbers = digits.split('').map(Number);
  const base = numbers.slice(0, 9);
  const primeiroDigito = calcularDigitoVerificadorModulo11(base, CPF_FIRST_DIGIT_WEIGHTS);
  const segundoDigito = calcularDigitoVerificadorModulo11(
    [...base, primeiroDigito],
    CPF_SECOND_DIGIT_WEIGHTS,
  );

  return numbers[9] === primeiroDigito && numbers[10] === segundoDigito;
}

/** Valida um CNPJ (com ou sem máscara) pelos dois dígitos verificadores do módulo 11 */
export function isValidCnpj(value: string): boolean {
  const digits = stripCnpjMask(value);
  if (digits.length !== 14 || isSequenciaRepetida(digits)) return false;

  const numbers = digits.split('').map(Number);
  const base = numbers.slice(0, 12);
  const primeiroDigito = calcularDigitoVerificadorModulo11(base, CNPJ_FIRST_DIGIT_WEIGHTS);
  const segundoDigito = calcularDigitoVerificadorModulo11(
    [...base, primeiroDigito],
    CNPJ_SECOND_DIGIT_WEIGHTS,
  );

  return numbers[12] === primeiroDigito && numbers[13] === segundoDigito;
}

/** Detecta se uma string de dígitos representa um CPF (11 dígitos) ou CNPJ (14 dígitos) */
export function detectarTipoDocumento(digitsOnly: string): TipoDocumento | null {
  const digits = digitsOnly.replace(/\D/g, '');
  if (digits.length === 11) return 'CPF';
  if (digits.length === 14) return 'CNPJ';
  return null;
}

/** Aplica a máscara de CPF ou CNPJ conforme o tipo de documento informado */
export function formatDocumento(value: string, tipo: TipoDocumento): string {
  return tipo === 'CPF' ? formatCpf(value) : formatCnpj(value);
}
