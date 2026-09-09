import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CONFIDENCIALIDADE } from '@ged/database';
import { CreateDocumentDto } from './create-document.dto';

// POST /documents (documents.controller.ts) is a multipart/form-data endpoint
// (FileInterceptor), so `destaque`/`exigeCadastro` always arrive as raw strings
// ("true"/"false") from a form/checkbox, not real booleans. This exercises the
// @Transform coercion added to the DTO so @IsBoolean() doesn't reject them.
describe('CreateDocumentDto', () => {
  // Nenhum destes é mais obrigatório (upload "só repositório") — usados só como
  // payload-base válido nos testes de coerção de boolean abaixo.
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

  it('validates an empty body when only the file is sent (upload só repositório)', async () => {
    const instance = plainToInstance(CreateDocumentDto, {});

    const errors = await validate(instance);
    expect(errors).toEqual([]);
  });

  it('coerces empty multipart strings to undefined instead of failing @IsUUID', async () => {
    const instance = plainToInstance(CreateDocumentDto, {
      nome: '',
      departamentoId: '',
      serieId: '',
    });

    expect(instance.nome).toBeUndefined();
    expect(instance.departamentoId).toBeUndefined();
    expect(instance.serieId).toBeUndefined();

    const errors = await validate(instance);
    expect(errors).toEqual([]);
  });

  it('still rejects a malformed serieId', async () => {
    const instance = plainToInstance(CreateDocumentDto, { serieId: 'nope' });

    const errors = await validate(instance);
    const serieErrors = errors.filter((e) => e.property === 'serieId');
    expect(serieErrors).toHaveLength(1);
    expect(serieErrors[0]?.constraints).toHaveProperty('isUuid');
  });
});
