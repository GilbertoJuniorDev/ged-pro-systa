import type { Role } from '@ged/types';

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly iconPaths: readonly string[];
  readonly moduloSlug?: string | null;
  readonly children?: readonly NavItem[];
  readonly requiredRole?: Role | readonly Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    moduloSlug: null,
    iconPaths: [
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    ],
  },
  {
    label: 'Documentos',
    href: '/documents',
    moduloSlug: 'documentos',
    iconPaths: [
      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    ],
    children: [
      {
        label: 'Upload',
        href: '/documents/upload',
        moduloSlug: 'documentos',
        iconPaths: [
          'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3',
        ],
      },
      {
        label: 'Classificação',
        href: '/documents/classificacao',
        moduloSlug: 'documentos',
        iconPaths: [
          'M4 6h16M4 10h10M4 14h16M4 18h10',
        ],
      },
      {
        label: 'Temporalidade',
        href: '/documents/temporalidade',
        moduloSlug: 'documentos',
        iconPaths: [
          'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        ],
      },
      {
        label: 'Dossiês',
        href: '/documents/dossies',
        moduloSlug: 'documentos',
        iconPaths: [
          'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
        ],
      },
      {
        label: 'Transferências',
        href: '/documents/transferencias',
        moduloSlug: 'documentos',
        iconPaths: [
          'M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4',
        ],
      },
    ],
  },
  {
    label: 'Minha Assinatura',
    href: '/configuracoes/assinatura',
    moduloSlug: null,
    iconPaths: [
      'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    ],
  },
  {
    label: 'Sobre',
    href: '/sobre',
    moduloSlug: null,
    iconPaths: [
      'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    ],
  },
] as const;

export const ADMIN_NAV_ITEMS: readonly NavItem[] = [
  {
    label: 'Setup',
    href: '/admin/settings',
    moduloSlug: null,
    iconPaths: [
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      'M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    ],
    children: [
      {
        label: 'Usuários',
        href: '/admin/users',
        moduloSlug: null,
        iconPaths: [
          'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
        ],
      },
      {
        label: 'Módulos',
        href: '/admin/modulos',
        moduloSlug: null,
        requiredRole: 'SUPER_ADMIN',
        iconPaths: [
          'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
        ],
      },
      {
        label: 'Permissões',
        href: '/admin/permissoes',
        moduloSlug: null,
        requiredRole: 'SUPER_ADMIN',
        iconPaths: [
          'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
        ],
      },
      {
        label: 'Departamentos',
        href: '/admin/departamentos',
        moduloSlug: null,
        iconPaths: [
          'M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01',
        ],
      },
      {
        label: 'Audit Logs',
        href: '/admin/audit-logs',
        moduloSlug: null,
        requiredRole: 'SUPER_ADMIN',
        iconPaths: [
          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
        ],
      },
      {
        label: 'Versão do Sistema',
        href: '/admin/sobre',
        moduloSlug: null,
        iconPaths: [
          'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
        ],
      },
    ],
  },
] as const;
