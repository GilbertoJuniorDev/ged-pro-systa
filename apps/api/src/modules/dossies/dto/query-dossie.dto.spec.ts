// `@Type(() => Number)` (class-transformer) reads design-time type metadata via
// Reflect.getMetadata at class-decoration time. In production this polyfill is loaded by
// Nest's own bootstrap chain before any DTO is imported; this spec can run in a fresh
// Jest worker that never pulls in @nestjs/* (which loads it as a side effect), so it must
// be imported explicitly and first here.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryDossieDto } from './query-dossie.dto';

describe('QueryDossieDto', () => {
  it('coerces the query string "true"/"false" for semArquivo without validation errors', async () => {
    const instance = plainToInstance(QueryDossieDto, { semArquivo: 'true' });

    expect(instance.semArquivo).toBe(true);
    const errors = await validate(instance);
    expect(errors.filter((e) => e.property === 'semArquivo')).toEqual([]);
  });

  it('rejects an invalid uuid for arquivoId', async () => {
    const instance = plainToInstance(QueryDossieDto, { arquivoId: 'not-a-uuid' });

    const errors = await validate(instance);
    const arquivoIdErrors = errors.filter((e) => e.property === 'arquivoId');
    expect(arquivoIdErrors).toHaveLength(1);
    expect(arquivoIdErrors[0]?.constraints).toHaveProperty('isUuid');
  });

  it('coerces page/limit query strings to numbers', async () => {
    const instance = plainToInstance(QueryDossieDto, { page: '2', limit: '50' });

    expect(instance.page).toBe(2);
    expect(instance.limit).toBe(50);
    const errors = await validate(instance);
    expect(errors).toEqual([]);
  });

  it('rejects a search term longer than 200 characters', async () => {
    const instance = plainToInstance(QueryDossieDto, { search: 'a'.repeat(201) });

    const errors = await validate(instance);
    const searchErrors = errors.filter((e) => e.property === 'search');
    expect(searchErrors).toHaveLength(1);
    expect(searchErrors[0]?.constraints).toHaveProperty('maxLength');
  });
});
