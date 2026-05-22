import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/types';
import type { AuthTokensResponse, MeResponseDto, Role } from '@ged/types';

const config: NextAuthConfig = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const response = await apiClient.post<AuthTokensResponse>('/auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          const meData = await apiClient.get<MeResponseDto>('/auth/me', {
              token: response.accessToken,
            });

          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as Role,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn,
            permissoes: meData.permissoes,
            modulos: meData.modulos,
          } satisfies AuthUser;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('[Auth] authorize failed — verifique se a API está acessível:', message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === 'signIn' && user) {
        const authUser = user as AuthUser;
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.role = authUser.role;
        token.permissoes = authUser.permissoes;
        token.modulos = authUser.modulos;
        token.expiresAt = Date.now() + authUser.expiresIn * 1000;
        return token;
      }

      if (trigger === 'update') {
        try {
          const meData = await apiClient.get<MeResponseDto>('/auth/me', {
            token: token.accessToken as string,
          });
          token.permissoes = meData.permissoes;
          token.modulos = meData.modulos;
        } catch {
          // mantém permissões existentes se a re-busca falhar
        }
        return token;
      }

      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() < expiresAt) {
        return token;
      }

      try {
        const refreshed = await apiClient.post<AuthTokensResponse>(
          '/auth/refresh',
          { refreshToken: token.refreshToken as string },
        );
        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.expiresAt = Date.now() + refreshed.expiresIn * 1000;
      } catch {
        token.error = 'RefreshTokenError';
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        // @ts-expect-error — extending default session user type
        sub: token.sub,
        accessToken: token.accessToken as string,
        role: token.role as string,
        permissoes: (token.permissoes ?? []) as string[],
        modulos: (token.modulos ?? []) as string[],
      };
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
