import { ROLE } from '@ged/database';
import { getAssignableRoles } from './assignable-roles';

describe('getAssignableRoles', () => {
  it('should allow ADMIN, MANAGER and VIEWER when acting user is SUPER_ADMIN', () => {
    const result = getAssignableRoles(ROLE.SUPER_ADMIN);

    expect(result).toEqual([ROLE.ADMIN, ROLE.MANAGER, ROLE.VIEWER]);
  });

  it('should allow only MANAGER and VIEWER when acting user is ADMIN', () => {
    const result = getAssignableRoles(ROLE.ADMIN);

    expect(result).toEqual([ROLE.MANAGER, ROLE.VIEWER]);
    expect(result).not.toContain(ROLE.ADMIN);
    expect(result).not.toContain(ROLE.SUPER_ADMIN);
  });

  it('should never include SUPER_ADMIN regardless of acting role', () => {
    expect(getAssignableRoles(ROLE.SUPER_ADMIN)).not.toContain(ROLE.SUPER_ADMIN);
    expect(getAssignableRoles(ROLE.ADMIN)).not.toContain(ROLE.SUPER_ADMIN);
    expect(getAssignableRoles(ROLE.MANAGER)).not.toContain(ROLE.SUPER_ADMIN);
  });
});
