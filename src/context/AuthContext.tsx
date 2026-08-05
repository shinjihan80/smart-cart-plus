'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

interface AuthContextValue {
  user:          User | null;
  session:       Session | null;
  loading:       boolean;
  signInGoogle:  () => Promise<void>;
  signInKakao:   () => Promise<void>;
  signUpEmail:   (email: string, password: string) => Promise<string | null>;
  signInEmail:   (email: string, password: string) => Promise<string | null>;
  signOut:       () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, loading: false,
  signInGoogle: async () => {}, signInKakao: async () => {},
  signUpEmail: async () => '클라우드 동기화 준비 중이에요.',
  signInEmail: async () => '클라우드 동기화 준비 중이에요.',
  signOut: async () => {},
});

/** Supabase 에러 메시지를 한국어로 다듬어 보여준다. */
function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요.';
  if (message.includes('User already registered'))   return '이미 가입된 이메일이에요. 로그인해주세요.';
  if (message.includes('Password should be at least')) return '비밀번호는 6자 이상이어야 해요.';
  if (message.includes('Unable to validate email address')) return '이메일 형식을 확인해주세요.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseEnabled);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 로그인 시작 시 현재 페이지를 next로 실어보내, 콜백 후 홈이 아니라
  // 원래 있던 화면(대개 설정)으로 돌아오게 한다.
  const callbackUrl = useCallback(() => {
    const next = encodeURIComponent(location.pathname + location.search);
    return `${location.origin}/auth/callback?next=${next}`;
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
  }, [callbackUrl]);

  const signInKakao = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: callbackUrl(),
        // 이메일(account_email)은 사업자 인증 전이라 카카오 콘솔에서 활성화 불가 —
        // 닉네임·프로필 사진만 요청. profiles.email은 nullable이라 문제없음.
        scopes: 'profile_nickname profile_image',
      },
    });
  }, [callbackUrl]);

  /** 성공 시 null, 실패 시 사용자에게 보여줄 에러 메시지를 반환. */
  const signUpEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return '클라우드 동기화 준비 중이에요.';
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? friendlyAuthError(error.message) : null;
  }, []);

  const signInEmail = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return '클라우드 동기화 준비 중이에요.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? friendlyAuthError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signInGoogle, signInKakao, signUpEmail, signInEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
