// 링크 주소 검사 (알림, 메인 배너에서 같이 사용)

// 우리 사이트 안 주소만 허용 (잘못 저장돼도 다른 사이트나 javascript: 주소로 가지 않게)
export function isSafeInternalLink(url) {
    if (typeof url !== 'string' || !url.startsWith('/')) return false;
    try {
        return new URL(url, window.location.origin).origin === window.location.origin;
    } catch {
        return false;
    }
}

// 새 창으로 열 외부 주소 (http, https이고 사이트 주소까지 있는 것만)
export function isExternalLink(url) {
    if (typeof url !== 'string') return false;
    try {
        const { protocol } = new URL(url);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}