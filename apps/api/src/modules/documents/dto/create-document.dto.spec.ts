import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CONFIDENCIALIDADE } from '@ged/database';
import { CreateDocumentDto } from './create-document.dto';

// POST /documents (documents.controller.ts) is a multipart/form-data endpoint
// (FileInterceptor), so `destaque`/`exigeCadastro` always arrive as raw strings
// ("true"/"false") from a form/checkbox, not real booleans. This exercises the
// @Transform coercion added to the DTO so @IsBoolean() doesn't reject them.
describe('CreateDocumentDto', () => {
  const requiredFields = {
    nome: 'Contrato',
    confidencialidade: CONFIDENCIALIDADE.RESTRITO,
    departamentoId: '11111111-1111-1111-1111-111111111111',
    serieId: '22222222-2222-2222-2222-222222222222',
  };

  it('coerces multipart string booleans "true"/"false" to real booleans without validation errors', async () => {
    const instance = plainToInstance(CreateDocumentDto, {
      ...requiredFields,
      destaque: 'true',
      exigeCadastro: 'false',
    });

    expect(instance.destaque).toBe(true);
    expect(instance.exigeCadastro).toBe(false);

    const errors = await validate(instance);
    const flagErrors = errors.filter((e) => e.property === 'destaque' || e.property === 'exigeCadastro');
    expect(flagErrors).toEqual([]);
  });

  it('still accepts real booleans (e.g. non-multipart JSON callers)', async () => {
    const instance = plainToInstance(CreateDocumentDto, {
      ...requiredFields,
      destaque: true,
      exigeCadastro: false,
    });

    expect(instance.destaque).toBe(true);
    expect(instance.exigeCadastro).toBe(false);

    const errors = await validate(instance);
    const flagErrors = errors.filter((e) => e.property === 'destaque' || e.property === 'exigeCadastro');
    expect(flagErrors).toEqual([]);
  });

  it('still rejects garbage values instead of silently coercing them', async () => {
    const instance = plainToInstance(CreateDocumentDto, {
      ...requiredFields,
      destaque: 'yes-please',
    });

    const errors = await validate(instance);
    const flagErrors = errors.filter((e) => e.property === 'destaque');
    expect(flagErrors).toHaveLength(1);
    expect(flagErrors[0]?.constraints).toHaveProperty('isBoolean');
  });
});
