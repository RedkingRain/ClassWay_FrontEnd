export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';

const REFRESH_TOKEN_KEY = 'classway_refresh_token';

// accessToken은 브라우저 스토리지에 저장하지 않고 JS 메모리에만 보관
let accessToken = null;
let refreshPromise = null;
let onAuthExpiredHandler = null;

export function registerAuthExpiredHandler(handler) {
    onAuthExpiredHandler = handler;
}

export function getAccessToken() {
    return accessToken;
}

export function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

// 로그인 응답({ accessToken, refreshToken }) 저장
export function saveTokens({ accessToken: newAccessToken, refreshToken }) {
    accessToken = newAccessToken || null;
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

export function clearAuth() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function requestNewAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('리프레시 토큰이 없습니다.');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success || !result.data?.accessToken) {
        throw new Error(result.message || '토큰 재발급에 실패했습니다.');
    }

    accessToken = result.data.accessToken;
    return accessToken;
}

// 동시 401 또는 초기 복구 시 /auth/refresh가 1번만 실행되도록 보장
export async function refreshAccessTokenOnce() {
    if (!refreshPromise) {
        refreshPromise = requestNewAccessToken().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

/**
 * 인증이 필요한 API 요청용 fetch 래퍼 (Response 그대로 반환)
 * @param {string} url
 * @param {RequestInit & { silentAuthError?: boolean, _retry?: boolean }} options
 */
export async function authFetch(url, options = {}) {
    const { silentAuthError = false, _retry = false, headers = {}, ...restOptions } = options;
    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

    const requestHeaders = { ...headers };
    // FormData 전송 시 브라우저가 multipart boundary를 자동 설정하도록 Content-Type을 지정하지 않음
    if (!(restOptions.body instanceof FormData) && !requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/json';
    }

    if (accessToken) {
        requestHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(targetUrl, {
        ...restOptions,
        headers: requestHeaders,
    });

    if (response.status === 401 && !_retry && (accessToken || getRefreshToken())) {
        try {
            await refreshAccessTokenOnce();
            return authFetch(url, { ...options, _retry: true });
        } catch (error) {
            clearAuth();
            if (!silentAuthError && onAuthExpiredHandler) {
                onAuthExpiredHandler();
            }
            throw error;
        }
    }

    return response;
}
