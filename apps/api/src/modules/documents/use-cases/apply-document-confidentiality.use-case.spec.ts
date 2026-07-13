import { BadRequestException } from '@nestjs/common';
import { CONFIDENCIALIDADE, ROLE } from '@ged/database';
import type { JwtPayload } from '@ged/types';
import { ApplyDocumentConfidentialityUseCase } from './apply-document-confidentiality.use-case';
import type { UserPermissionsService } from '../../user-permissions/user-permissions.service';

const makeUser = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
  sub: 'user-1',
  email: 'user@ged.local',
  role: ROLE.VIEWER,
  ...overrides,
});

describe('ApplyDocumentConfidentialityUseCase', () => {
  let useCase: ApplyDocumentConfidentialityUseCase;
  let userPermissionsService: jest.Mocked<Pick<UserPermissionsService, 'hasPermission'>>;
  let manager: {
    find: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    userPermissionsService = { hasPermission: jest.fn().mockResolvedValue(false) };
    useCase = new ApplyDocumentConfidentialityUseCase(
      userPermissionsService as unknown as UserPermissionsService,
    );
    manager = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      create: jest.fn((_entity, data) => data),
      save: jest.fn(),
    };
  });

  it('a VIEWER without the permission is silently held at RESTRITO with no grants, even if they request otherwise', async () => {
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
        requestedAccessDepartamentoIds: ['dept-9'],
        requestedAccessUserIds: ['user-9'],
        actingUser: makeUser({ role: ROLE.VIEWER }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
    expect(manager.delete).not.toHaveBeenCalled();
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('an ADMIN can set PUBLICO with no grants required', async () => {
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.PUBLICO,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.PUBLICO);
  });

  it('an ADMIN setting CONFIDENCIAL with no accessUserIds throws BadRequestException', async () => {
    await expect(
      useCase.execute(
        {
          documentId: 'doc-1',
          requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
          requestedAccessDepartamentoIds: undefined,
          requestedAccessUserIds: [],
          actingUser: makeUser({ role: ROLE.ADMIN }),
        },
        manager as never,
      ),
    ).rejects.toThrow(
      new BadRequestException('Documentos confidenciais exigem ao menos um usuário com acesso'),
    );
  });

  it('CONFIDENCIAL auto-includes the acting user in accessUserIds', async () => {
    await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.CONFIDENCIAL,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: ['other-user'],
        actingUser: makeUser({ sub: 'acting-user', role: ROLE.ADMIN }),
      },
      manager as never,
    );

    const savedRows = manager.save.mock.calls[0][1] as Array<{ usuarioId: string }>;
    expect(savedRows.map((r) => r.usuarioId).sort()).toEqual(['acting-user', 'other-user']);
  });

  it('a MANAGER with the granted permission can manage confidentiality', async () => {
    userPermissionsService.hasPermission.mockResolvedValue(true);

    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.RESTRITO,
        requestedAccessDepartamentoIds: ['dept-2'],
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ sub: 'manager-1', role: ROLE.MANAGER }),
      },
      manager as never,
    );

    expect(userPermissionsService.hasPermission).toHaveBeenCalledWith(
      'manager-1',
      'DOCUMENTS_MANAGE_CONFIDENTIALITY',
    );
    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
  });

  it('switching to PUBLICO clears any existing department/user grants', async () => {
    manager.find.mockImplementation((entity: { name: string }) => {
      if (entity.name === 'DocumentAccessDepartment') {
        return Promise.resolve([{ departamentoId: 'dept-1' }]);
      }
      return Promise.resolve([]);
    });

    await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: CONFIDENCIALIDADE.PUBLICO,
        requestedAccessDepartamentoIds: undefined,
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(manager.delete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'DocumentAccessDepartment' }),
      { documentId: 'doc-1' },
    );
  });

  it('requestedConfidencialidade undefined on update leaves the level unchanged (returns RESTRITO default only as the no-op signal for the caller to skip)', async () => {
    // When nothing is requested (update without touching confidentiality), the use-case
    // still needs a level to return the grant-sync no-op cleanly — the caller (documents.service.ts)
    // only invokes this use-case at all when at least one of confidencialidade/accessUserIds/
    // accessDepartamentoIds is present in the update payload (see Task 6).
    const result = await useCase.execute(
      {
        documentId: 'doc-1',
        requestedConfidencialidade: undefined,
        requestedAccessDepartamentoIds: ['dept-1'],
        requestedAccessUserIds: undefined,
        actingUser: makeUser({ role: ROLE.ADMIN }),
      },
      manager as never,
    );

    expect(result.confidencialidade).toBe(CONFIDENCIALIDADE.RESTRITO);
  });
});
