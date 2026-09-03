// `@Type(() => Number)` (class-transformer) reads design-time type metadata via
// Reflect.getMetadata at class-decoration time. In production this polyfill is loaded by
// Nest's own bootstrap chain before any DTO is imported; this spec can run in a fresh
// Jest worker that never pulls in @nestjs/* (which loads it as a side effect), so it must
// be imported explicitly and first here.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryDocumentDto } from './query-document.dto';

describe('QueryDocumentDto', () => {
  it('coerces the query string "true"/"false" for semDossie without validation errors', async () => {
    const instance = plainToInstance(QueryDocumentDto, { semDossie: 'true' });

    expect(instance.semDossie).toBe(true);
    const errors = await validate(instance);
    expect(errors.filter((e) => e.property === 'semDossie')).toEqual([]);
  });

  it('rejects an invalid uuid for dossieId', async () => {
    const instance = plainToInstance(QueryDocumentDto, { dossieId: 'not-a-uuid' });

    const errors = await validate(instance);
    const dossieIdErrors = errors.filter((e) => e.property === 'dossieId');
    expect(dossieIdErrors).toHaveLength(1);
    expect(dossieIdErrors[0]?.constraints).toHaveProperty('isUuid');
  });

  it('rejects a search term longer than 200 characters', async () => {
    const instance = plainToInstance(QueryDocumentDto, { search: 'a'.repeat(201) });

    const errors = await validate(instance);
    const searchErrors = errors.filter((e) => e.property === 'search');
    expect(searchErrors).toHaveLength(1);
    expect(searchErrors[0]?.constraints).toHaveProperty('maxLength');
  });
});
