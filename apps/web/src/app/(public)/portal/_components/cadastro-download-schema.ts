import { z } from 'zod';
import { detectarTipoDocumento, isValidCnpj, isValidCpf } from '@ged/utils';

// Validação client-side espelhando RegisterAccessDto/DocumentoValidoParaTipoConstraint da
// API (apps/api/src/modules/public/dto/register-access.dto.ts): o dígito verificador do
// CPF/CNPJ é checado aqui para dar feedback imediato, mas o backend sempre revalida.
export const cadastroDownloadSchema = z
  .object({
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    nome: z.string().min(2, 'Mínimo 2 caracteres').max(200, 'Máximo 200 caracteres'),
    documento: z.string().min(1, 'Informe o CPF ou CNPJ'),
  })
  .superRefine((data, ctx) => {
    const tipo = detectarTipoDocumento(data.documento);
    if (!tipo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documento'],
        message: 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)',
      });
      return;
    }
    const valido = tipo === 'CPF' ? isValidCpf(data.documento) : isValidCnpj(data.documento);
    if (!valido) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['documento'],
        message: tipo === 'CPF' ? 'CPF inválido' : 'CNPJ inválido',
      });
    }
  });

export type CadastroDownloadFormData = z.infer<typeof cadastroDownloadSchema>;
