// `@Type(() => Number)` (class-transformer) reads design-time type metadata via
// Reflect.getMetadata at class-decoration time. In production this polyfill is loaded by
// Nest's own bootstrap chain before any DTO is imported; this spec can run in a fresh
// Jest worker that never pulls in @nestjs/* (which loads it as a side effect), so it must
// be imported explicitly and first here.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryPublicDocumentsDto, QueryRecentesDto } from './query-public-documents.dto';

describe('QueryPublicDocumentsDto', () => {
  it('should pass validation and coerce page/limit query string values to numbers', async () => {
    const dto = plainToInstance(QueryPublicDocumentsDto, { page: '2', limit: '10' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('should pass validation when every field is omitted', async () => {
    const dto = plainToInstance(QueryPublicDocumentsDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject a non-numeric page value', async () => {
    const dto = plainToInstance(QueryPublicDocumentsDto, { page: 'not-a-number' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('should reject a serieId that is not a UUID', async () => {
    const dto = plainToInstance(QueryPublicDocumentsDto, { serieId: 'not-a-uuid' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'serieId')).toBe(true);
  });
});

describe('QueryRecentesDto', () => {
  it('should pass validation and coerce a valid limit query string to a number', async () => {
    const dto = plainToInstance(QueryRecentesDto, { limit: '10' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.limit).toBe(10);
  });

  it('should pass validation when limit is omitted', async () => {
    const dto = plainToInstance(QueryRecentesDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject a limit greater than 20', async () => {
    const dto = plainToInstance(QueryRecentesDto, { limit: '21' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });

  it('should reject a limit lower than 1', async () => {
    const dto = plainToInstance(QueryRecentesDto, { limit: '0' });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});
