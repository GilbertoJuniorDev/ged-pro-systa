import { accessScopeSqlFragment } from './access-scope';

describe('accessScopeSqlFragment', () => {
  it('includes the "documento não classificado" branch (departamento_id IS NULL + criado_por)', () => {
    const fragment = accessScopeSqlFragment();

    expect(fragment).toContain('document.departamento_id IS NULL');
    expect(fragment).toContain('document.criado_por = :userId');
  });

  it('substitutes a custom alias in every branch, including the unclassified-document one', () => {
    const fragment = accessScopeSqlFragment('doc');

    expect(fragment).toContain('doc.departamento_id IS NULL');
    expect(fragment).toContain('doc.criado_por = :userId');
    expect(fragment).not.toContain('document.departamento_id');
  });
});
