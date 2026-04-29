import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthConfig } from 'next-auth';
import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/types';
import type { AuthTokensResponse, Role } from '@ged/types';

const config: NextAuthConfig = {
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

          return {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role as Role,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expiresIn: response.expiresIn,
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
        token.expiresAt = Date.now() + authUser.expiresIn * 1000;
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
