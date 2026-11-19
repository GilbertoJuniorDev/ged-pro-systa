import { validate } from './env.validation';

const BASE_ENV: Record<string, unknown> = {
  DATABASE_URL: 'postgresql://ged:ged@localhost:5432/ged',
  JWT_SECRET: 'x'.repeat(32),
  JWT_REFRESH_SECRET: 'y'.repeat(32),
  MAIL_HOST: 'localhost',
  S3_BUCKET: 'ged-conteudos',
  S3_REGION: 'us-east-1',
};

describe('validate (env)', () => {
  describe('S3_FORCE_PATH_STYLE', () => {
    it('should default to false when the variable is absent', () => {
      expect(validate(BASE_ENV).S3_FORCE_PATH_STYLE).toBe(false);
    });

    it('should default to false when the variable is an empty string', () => {
      expect(validate({ ...BASE_ENV, S3_FORCE_PATH_STYLE: '' }).S3_FORCE_PATH_STYLE).toBe(false);
    });

    it('should parse true when the variable is "true"', () => {
      expect(validate({ ...BASE_ENV, S3_FORCE_PATH_STYLE: 'true' }).S3_FORCE_PATH_STYLE).toBe(true);
    });

    it('should parse false when the variable is "false"', () => {
      expect(validate({ ...BASE_ENV, S3_FORCE_PATH_STYLE: 'false' }).S3_FORCE_PATH_STYLE).toBe(
        false,
      );
    });

    it.each(['TRUE', '1', 'yes', 'tru'])(
      'should fail with a PT-BR message when the variable is "%s"',
      (value) => {
        expect(() => validate({ ...BASE_ENV, S3_FORCE_PATH_STYLE: value })).toThrow(
          /S3_FORCE_PATH_STYLE deve ser 'true' ou 'false'/,
        );
      },
    );
  });
});
