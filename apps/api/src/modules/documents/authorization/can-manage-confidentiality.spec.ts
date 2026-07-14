import { ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { canManageConfidentiality } from './can-manage-confidentiality';

const makeUser = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.VIEWER,
  ...overrides,
});

describe('canManageConfidentiality', () => {
  it('returns true for ADMIN without checking permissions', async () => {
    const hasPermission = jest.fn();
    const result = await canManageConfidentiality(makeUser({ role: ROLE.ADMIN }), {
      hasPermission,
    });
    expect(result).toBe(true);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('returns true for SUPER_ADMIN without checking permissions', async () => {
    const hasPermission = jest.fn();
    const result = await canManageConfidentiality(makeUser({ role: ROLE.SUPER_ADMIN }), {
      hasPermission,
    });
    expect(result).toBe(true);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it('returns false for VIEWER without the permission and forwards user id + permission name to the checker', async () => {
    const hasPermission = jest.fn().mockResolvedValue(false);
    const result = await canManageConfidentiality(makeUser({ role: ROLE.VIEWER }), {
      hasPermission,
    });
    expect(result).toBe(false);
    expect(hasPermission).toHaveBeenCalledWith('user-1', 'DOCUMENTS_MANAGE_CONFIDENTIALITY');
  });

  it('returns true for VIEWER with the granted permission', async () => {
    const hasPermission = jest.fn().mockResolvedValue(true);
    const result = await canManageConfidentiality(
      makeUser({ sub: 'viewer-9', role: ROLE.VIEWER }),
      { hasPermission },
    );
    expect(result).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith('viewer-9', 'DOCUMENTS_MANAGE_CONFIDENTIALITY');
  });

  it('returns false for VIEWER without the permission', async () => {
    const hasPermission = jest.fn().mockResolvedValue(false);
    const result = await canManageConfidentiality(makeUser({ role: ROLE.VIEWER }), {
      hasPermission,
    });
    expect(result).toBe(false);
  });
});
