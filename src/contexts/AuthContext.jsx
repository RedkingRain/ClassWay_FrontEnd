import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    API_BASE_URL,
    authFetch,
    clearAuth,
    getAccessToken,
    getRefreshToken,
    refreshAccessTokenOnce,
    registerAuthExpiredHandler,
    saveTokens,
} from '../utils/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(() => Boolean(getRefreshToken()));

    // GET /auth/me 호출 → { userId, email, name, role } 반환
    const fetchMe = useCallback(async ({ silentAuthError = false } = {}) => {
        const response = await authFetch('/auth/me', { silentAuthError });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || '사용자 정보를 불러오지 못했습니다.');
        }

        setUser(result.data);
        return result.data;
    }, []);

    // 새로고침 시 refreshToken이 있으면 accessToken 재발급 후 /auth/me 복원
    useEffect(() => {
        if (!getRefreshToken()) return;

        let isMounted = true;

        async function restoreSession() {
            try {
                await refreshAccessTokenOnce();
                await fetchMe({ silentAuthError: true });
            } catch {
                clearAuth();
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        restoreSession();

        return () => {
            isMounted = false;
        };
    }, [fetchMe]);

    // 사용 중 리프레시 토큰까지 만료되면 상태 비우고 로그인 페이지로 이동
    useEffect(() => {
        registerAuthExpiredHandler(() => {
            setUser(null);
            navigate('/login', { replace: true });
        });
        return () => registerAuthExpiredHandler(null);
    }, [navigate]);

    // 로그인 성공 시: 토큰 저장 → /auth/me로 사용자 정보 조회
    const loginSuccess = useCallback(
        async (tokenData) => {
            saveTokens(tokenData);
            try {
                return await fetchMe();
            } catch (error) {
                clearAuth();
                setUser(null);
                throw error;
            }
        },
        [fetchMe],
    );

    // 로그아웃: POST /auth/logout 호출 후 토큰 및 상태 초기화
    const logout = useCallback(async () => {
        const currentAccessToken = getAccessToken();

        try {
            if (currentAccessToken) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${currentAccessToken}`,
                    },
                });
            }
        } catch {
            // 서버 통신 실패 시에도 클라이언트 로그아웃 정상 진행
        } finally {
            clearAuth();
            setUser(null);
            navigate('/', { replace: true });
        }
    }, [navigate]);

    return (
        <AuthContext.Provider
            value={{
                user, // { userId, email, name, role } | null
                isAuthenticated: Boolean(user),
                isLoading,
                loginSuccess,
                refreshUser: fetchMe,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
    }
    return context;
}
