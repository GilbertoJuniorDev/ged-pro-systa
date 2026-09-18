// Multipart/form-data clients (curl, Postman, plain HTML forms) send an omitted optional
// field as an empty string rather than leaving it out entirely. `@IsOptional()` only skips
// `null`/`undefined`, so without this an empty string would still reach `@IsUUID()` and fail.
export const emptyToUndefined = ({ value }: { value: unknown }): unknown => {
  if (value === '') return undefined;
  return value;
};
