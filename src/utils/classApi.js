import { useEffect, useState } from 'react';
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

// 클래스 카드 요청 + 결과 기억 (인기 / 이벤트 / 전체 섹션에서 같이 사용)
// path가 바뀌면 다시 요청 (전체 클래스 탭 전환)
// 돌려주는 값: { state: 'loading' | 'done' | 'error', data }
export function useClassCards(path) {
    // 마지막으로 받은 결과 (어떤 주소의 결과인지 이름표 key와 함께 저장)
    const [loaded, setLoaded] = useState({ key: null, state: 'loading', data: null });

    useEffect(() => {
        let ignore = false; // 늦게 온 예전 응답 무시

        fetchClassCards(path)
            .then((data) => {
                if (ignore) return;
                setLoaded({ key: path, state: 'done', data });
            })
            .catch(() => {
                if (ignore) return;
                setLoaded({ key: path, state: 'error', data: null });
            });

        return () => {
            ignore = true;
        };
    }, [path]);

    // 이름표가 다르면 = 아직 지금 주소의 결과를 기다리는 중
    // previousData: 바로 전에 받은 결과 (새 결과가 올 때까지 화면에 흐리게 남겨둘 때 사용)
    if (loaded.key !== path) {
        return { state: 'loading', data: null, previousData: loaded.data };
    }
    return loaded;
}


// 카테고리 목록 요청 (헤더 카테고리 메뉴, 클래스 목록에서 같이 사용)
// 첫 요청의 약속(Promise)을 기억해 두고 같이 씀 → 한 화면에서 두 곳이 불러도 요청은 1번
// shortcut: 새로고침 전까지 다시 받지 않음, 관리자가 카테고리를 자주 바꾸게 되면 다시 받는 시점 추가
let categoriesPromise = null;

function fetchCategories() {
    if (!categoriesPromise) {
        // 응답 모양 { success, data }가 클래스 목록과 같아서 같은 요청 함수 사용
        categoriesPromise = fetchClassCards('/categories').catch((error) => {
            categoriesPromise = null; // 실패는 기억하지 않음 → 다음에 다시 요청
            throw error;
        });
    }
    return categoriesPromise;
}

// 카테고리 요청 + 결과 기억
// 돌려주는 값: { state: 'loading' | 'done' | 'error', data: 카테고리 목록 (받기 전, 실패는 빈 목록) }
export function useCategories() {
    const [loaded, setLoaded] = useState({ state: 'loading', data: [] });

    useEffect(() => {
        let ignore = false; // 화면이 사라진 뒤 온 응답 무시

        fetchCategories()
            .then((data) => {
                if (!ignore) setLoaded({ state: 'done', data });
            })
            .catch(() => {
                if (!ignore) setLoaded({ state: 'error', data: [] });
            });

        return () => {
            ignore = true;
        };
    }, []);

    return loaded;
}