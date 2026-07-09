import {
  detectarTipoDocumento,
  formatCnpj,
  formatCpf,
  formatDocumento,
  isValidCnpj,
  isValidCpf,
  stripCnpjMask,
  stripCpfMask,
} from './index';

// CPF matematicamente válido, de uso público consolidado em testes/documentação BR.
const VALID_CPF_RAW = '11144477735';
const VALID_CPF_MASKED = '111.444.777-35';

// CNPJ matematicamente válido, de uso público consolidado em testes/documentação BR.
const VALID_CNPJ_RAW = '11222333000181';
const VALID_CNPJ_MASKED = '11.222.333/0001-81';

describe('formatCpf', () => {
  it('should return only digits when input has 3 or fewer digits', () => {
    expect(formatCpf('111')).toBe('111');
  });

  it('should mask up to the first group dot when input has between 4 and 6 digits', () => {
    expect(formatCpf('111444')).toBe('111.444');
  });

  it('should mask up to the second group dot when input has between 7 and 9 digits', () => {
    expect(formatCpf('111444777')).toBe('111.444.777');
  });

  it('should mask fully with the check-digit separator when input has 10 or 11 digits', () => {
    expect(formatCpf(VALID_CPF_RAW)).toBe(VALID_CPF_MASKED);
  });

  it('should cap the output at 11 digits when given extra trailing digits', () => {
    expect(formatCpf('111444777359999')).toBe(VALID_CPF_MASKED);
  });

  it('should strip non-digit characters before masking when input is already masked', () => {
    expect(formatCpf(VALID_CPF_MASKED)).toBe(VALID_CPF_MASKED);
  });
});

describe('stripCpfMask', () => {
  it('should return only the 11 raw digits when given a masked CPF', () => {
    expect(stripCpfMask(VALID_CPF_MASKED)).toBe(VALID_CPF_RAW);
  });
});

describe('formatCnpj', () => {
  it('should return only digits when input has 2 or fewer digits', () => {
    expect(formatCnpj('11')).toBe('11');
  });

  it('should mask up to the first group dot when input has between 3 and 5 digits', () => {
    expect(formatCnpj('11222')).toBe('11.222');
  });

  it('should mask up to the second group dot when input has between 6 and 8 digits', () => {
    expect(formatCnpj('11222333')).toBe('11.222.333');
  });

  it('should mask up to the branch slash when input has between 9 and 12 digits', () => {
    expect(formatCnpj('112223330001')).toBe('11.222.333/0001');
  });

  it('should mask fully with the check-digit separator when input has 13 or 14 digits', () => {
    expect(formatCnpj(VALID_CNPJ_RAW)).toBe(VALID_CNPJ_MASKED);
  });

  it('should cap the output at 14 digits when given extra trailing digits', () => {
    expect(formatCnpj('112223330001819999')).toBe(VALID_CNPJ_MASKED);
  });

  it('should strip non-digit characters before masking when input is already masked', () => {
    expect(formatCnpj(VALID_CNPJ_MASKED)).toBe(VALID_CNPJ_MASKED);
  });
});

describe('stripCnpjMask', () => {
  it('should return only the 14 raw digits when given a masked CNPJ', () => {
    expect(stripCnpjMask(VALID_CNPJ_MASKED)).toBe(VALID_CNPJ_RAW);
  });
});

describe('isValidCpf', () => {
  it('should return true when given a mathematically valid raw CPF', () => {
    expect(isValidCpf(VALID_CPF_RAW)).toBe(true);
  });

  it('should return true when given a mathematically valid masked CPF', () => {
    expect(isValidCpf(VALID_CPF_MASKED)).toBe(true);
  });

  it('should return true when the computed check digit is zero', () => {
    // Base 123456789 produz resto < 2 no 1º dígito verificador (vira 0).
    expect(isValidCpf('12345678909')).toBe(true);
  });

  it('should return false when the first check digit does not match', () => {
    // Dígito verificador correto para essa base é 3; aqui usamos 8.
    expect(isValidCpf('11144477835')).toBe(false);
  });

  it('should return false when the second check digit does not match', () => {
    // Dígito verificador correto para essa base é 5; aqui usamos 4.
    expect(isValidCpf('11144477734')).toBe(false);
  });

  it('should return false when all digits are the same repeated sequence', () => {
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
  });

  it('should return false when the stripped length is not 11 digits', () => {
    expect(isValidCpf('123456789')).toBe(false);
    expect(isValidCpf('111444777351')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidCpf('')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('should return true when given a mathematically valid raw CNPJ', () => {
    expect(isValidCnpj(VALID_CNPJ_RAW)).toBe(true);
  });

  it('should return true when given a mathematically valid masked CNPJ', () => {
    expect(isValidCnpj(VALID_CNPJ_MASKED)).toBe(true);
  });

  it('should return false when the first check digit does not match', () => {
    // Dígito verificador correto para essa base é 8; aqui usamos 9.
    expect(isValidCnpj('11222333000191')).toBe(false);
  });

  it('should return false when the second check digit does not match', () => {
    // Dígito verificador correto para essa base é 1; aqui usamos 2.
    expect(isValidCnpj('11222333000182')).toBe(false);
  });

  it('should return false when all digits are the same repeated sequence', () => {
    expect(isValidCnpj('00000000000000')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('should return false when the stripped length is not 14 digits', () => {
    expect(isValidCnpj('112223330001')).toBe(false);
    expect(isValidCnpj('1122233300018199')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidCnpj('')).toBe(false);
  });
});

describe('detectarTipoDocumento', () => {
  it('should return CPF when given 11 digits', () => {
    expect(detectarTipoDocumento(VALID_CPF_RAW)).toBe('CPF');
  });

  it('should return CNPJ when given 14 digits', () => {
    expect(detectarTipoDocumento(VALID_CNPJ_RAW)).toBe('CNPJ');
  });

  it('should return null when digit count is neither 11 nor 14', () => {
    expect(detectarTipoDocumento('123')).toBeNull();
    expect(detectarTipoDocumento('')).toBeNull();
  });

  it('should strip non-digit characters before counting when input is masked', () => {
    expect(detectarTipoDocumento(VALID_CPF_MASKED)).toBe('CPF');
    expect(detectarTipoDocumento(VALID_CNPJ_MASKED)).toBe('CNPJ');
  });
});

describe('formatDocumento', () => {
  it('should apply the CPF mask when tipo is CPF', () => {
    expect(formatDocumento(VALID_CPF_RAW, 'CPF')).toBe(VALID_CPF_MASKED);
  });

  it('should apply the CNPJ mask when tipo is CNPJ', () => {
    expect(formatDocumento(VALID_CNPJ_RAW, 'CNPJ')).toBe(VALID_CNPJ_MASKED);
  });
});
