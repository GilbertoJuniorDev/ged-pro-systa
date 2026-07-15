import { z } from 'zod';
import { CONFIDENCIALIDADE } from '@/types';

// Compartilhado entre UploadDocumentForm e EditConfidentialityDialog — espelha a
// regra do backend (ApplyDocumentConfidentialityUseCase): documentos Confidenciais
// exigem ao menos um usuário com acesso.
export const confidentialitySchema = z
  .object({
    confidencialidade: z.enum(
      [CONFIDENCIALIDADE.PUBLICO, CONFIDENCIALIDADE.RESTRITO, CONFIDENCIALIDADE.CONFIDENCIAL],
      { required_error: 'Selecione a confidencialidade' },
    ),
    accessDepartamentoIds: z.array(z.string().uuid()),
    accessUserIds: z.array(z.string().uuid()),
    exigeCadastro: z.boolean(),
    destaque: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.confidencialidade === CONFIDENCIALIDADE.CONFIDENCIAL && val.accessUserIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['accessUserIds'],
        message: 'Selecione ao menos um usuário com acesso',
      });
    }
  });
