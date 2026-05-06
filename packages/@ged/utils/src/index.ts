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
