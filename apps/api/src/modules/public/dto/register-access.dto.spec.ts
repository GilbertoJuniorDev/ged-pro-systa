import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterAccessDto } from './register-access.dto';

// CPF/CNPJ hand-verified em Task 3 (packages/@ged/utils) — 111.444.777-35 / 11.222.333/0001-81.
const VALID_CPF = '11144477735';
const VALID_CNPJ = '11222333000181';

const base = {
  email: 'lead@example.com',
  nome: 'Fulano de Tal',
};

describe('RegisterAccessDto', () => {
  it('should pass validation when documento is a mathematically valid CPF and tipoDocumento is CPF', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      documento: VALID_CPF,
      tipoDocumento: 'CPF',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should pass validation when documento is a mathematically valid CNPJ and tipoDocumento is CNPJ', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      documento: VALID_CNPJ,
      tipoDocumento: 'CNPJ',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject the DTO when documento is a CPF with an invalid check digit', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      // Base 111444777 mantida; 1º dígito verificador correto é 3, aqui usamos 8.
      documento: '11144477785',
      tipoDocumento: 'CPF',
    });

    const errors = await validate(dto);
    const documentoError = errors.find((error) => error.property === 'documento');

    expect(documentoError).toBeDefined();
    expect(documentoError?.constraints).toHaveProperty('documentoValidoParaTipo');
  });

  it('should reject the DTO when documento is a CNPJ with an invalid check digit', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      // Base 11222333000 1 mantida; 2º dígito verificador correto é 1, aqui usamos 2.
      documento: '11222333000182',
      tipoDocumento: 'CNPJ',
    });

    const errors = await validate(dto);
    const documentoError = errors.find((error) => error.property === 'documento');

    expect(documentoError).toBeDefined();
    expect(documentoError?.constraints).toHaveProperty('documentoValidoParaTipo');
  });

  it('should reject the DTO when documento has 11 digits but tipoDocumento is CNPJ', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      documento: VALID_CPF,
      tipoDocumento: 'CNPJ',
    });

    const errors = await validate(dto);
    const documentoError = errors.find((error) => error.property === 'documento');

    expect(documentoError).toBeDefined();
  });

  it('should reject the DTO when documento is not a string (e.g. a raw JSON number)', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      documento: 11144477735,
      tipoDocumento: 'CPF',
    });

    const errors = await validate(dto);
    const documentoError = errors.find((error) => error.property === 'documento');

    expect(documentoError).toBeDefined();
  });

  it('should reject the DTO when tipoDocumento is neither CPF nor CNPJ', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      documento: VALID_CPF,
      tipoDocumento: 'RG',
    });

    const errors = await validate(dto);
    const tipoDocumentoError = errors.find((error) => error.property === 'tipoDocumento');

    expect(tipoDocumentoError).toBeDefined();
    expect(tipoDocumentoError?.constraints).toHaveProperty('isIn');
  });

  it('should reject the DTO when email is not a valid email address', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      email: 'not-an-email',
      documento: VALID_CPF,
      tipoDocumento: 'CPF',
    });

    const errors = await validate(dto);
    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();
  });

  it('should reject the DTO when nome is shorter than 2 characters', async () => {
    const dto = plainToInstance(RegisterAccessDto, {
      ...base,
      nome: 'A',
      documento: VALID_CPF,
      tipoDocumento: 'CPF',
    });

    const errors = await validate(dto);
    const nomeError = errors.find((error) => error.property === 'nome');

    expect(nomeError).toBeDefined();
  });
});
