import { toBoolean } from './to-boolean';

describe('toBoolean', () => {
  it('coerces the string "true" to true', () => {
    expect(toBoolean({ value: 'true' })).toBe(true);
  });

  it('coerces the string "false" to false', () => {
    expect(toBoolean({ value: 'false' })).toBe(false);
  });

  it('passes real booleans through untouched', () => {
    expect(toBoolean({ value: true })).toBe(true);
    expect(toBoolean({ value: false })).toBe(false);
  });

  it('returns other values untouched so @IsBoolean() can reject them', () => {
    expect(toBoolean({ value: 'yes-please' })).toBe('yes-please');
    expect(toBoolean({ value: undefined })).toBeUndefined();
  });
});
