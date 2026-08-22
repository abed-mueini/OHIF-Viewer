import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getCurrentAccountQueryKey, useCurrentAccount } from '../../api/generated/me/me';
import type { Me, TokenResponse } from '../../api/generated/model';
import { useAuthTokenCreate, useLogout } from '../../api/generated/auth/auth';
import { ApiError } from '../../lib/http/errors';
import {
  readSession,
  saveSession,
  subscribeToSession,
  type AuthSession,
} from '../../lib/session/session';

interface AuthContextValue {
  session: AuthSession | null;
  user: Me | null;
  loading: boolean;
  establishSession: (token: TokenResponse) => Promise<AuthSession>;
  login: (username: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<Me | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toSession(token: TokenResponse): AuthSession {
  if (!token.refresh) {
    throw new ApiError(500, {
      code: 'invalid_token_response',
      detail: 'پاسخ ورود کامل نیست.',
    });
  }
  return token as AuthSession;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null>(() => readSession());
  const accountQuery = useCurrentAccount({
    query: {
      enabled: Boolean(session),
      retry: false,
    },
  });
  const loginMutation = useAuthTokenCreate();
  const logoutMutation = useLogout();

  useEffect(
    () =>
      subscribeToSession(() => {
        const next = readSession();
        setSession(next);
        if (!next) {
          queryClient.removeQueries({ queryKey: getCurrentAccountQueryKey() });
        }
      }),
    [queryClient]
  );

  useEffect(() => {
    if (
      !session ||
      !accountQuery.data ||
      session.account_status === accountQuery.data.account_status
    )
      return;
    saveSession({ ...session, account_status: accountQuery.data.account_status });
  }, [accountQuery.data, session]);

  const establishSession = useCallback(
    async (token: TokenResponse) => {
      const next = toSession(token);
      saveSession(next);
      setSession(next);
      await queryClient.invalidateQueries({ queryKey: getCurrentAccountQueryKey() });
      return next;
    },
    [queryClient]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const token = await loginMutation.mutateAsync({ data: { username, password } });
      return establishSession(token);
    },
    [establishSession, loginMutation]
  );

  const logout = useCallback(async () => {
    const current = readSession();
    let revoked = false;
    try {
      if (current?.refresh) {
        await logoutMutation.mutateAsync({ data: { refresh: current.refresh } });
      }
      revoked = true;
    } catch {
      revoked = false;
    } finally {
      saveSession(null);
      setSession(null);
      queryClient.clear();
    }
    return revoked;
  }, [logoutMutation, queryClient]);

  const refreshUser = useCallback(async () => {
    const result = await accountQuery.refetch();
    return result.data || null;
  }, [accountQuery]);

  const value = useMemo(
    () => ({
      session,
      user: accountQuery.data || null,
      loading: Boolean(session) && accountQuery.isLoading,
      establishSession,
      login,
      logout,
      refreshUser,
    }),
    [
      accountQuery.data,
      accountQuery.isLoading,
      establishSession,
      login,
      logout,
      refreshUser,
      session,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
