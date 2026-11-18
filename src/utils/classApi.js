import { authFetch } from './auth.js';

// 클래스 카드 목록 요청 (메인 인기 / 이벤트 / 전체에서 같이 사용)
// path 예: '/classes/popular', '/classes/events', '/classes?size=8'
export async function fetchClassCards(path) {
    const response = await authFetch(path, {
        silentAuthError: true, // 비로그인도 보는 화면 → 토큰 문제로 로그인 페이지로 튕기지 않게
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '클래스 목록을 불러오지 못했습니다.');
    }
    return result.data;
}