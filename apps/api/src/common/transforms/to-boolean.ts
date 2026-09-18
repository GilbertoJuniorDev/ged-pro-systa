// Query strings and multipart/form-data fields always arrive as raw strings. Coerce the
// "true"/"false" strings a checkbox/query param sends into real booleans before @IsBoolean()
// runs, while still accepting a real boolean (e.g. JSON callers, tests).
export const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
