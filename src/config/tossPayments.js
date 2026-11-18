/**
 * 토스페이먼츠 연동 설정
 * .env.local의 VITE_TOSS_CLIENT_KEY 환경 변수에서 클라이언트 키를 읽어옵니다.
 */
export const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || '';
