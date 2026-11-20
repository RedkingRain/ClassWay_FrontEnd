import { useEffect, useState } from 'react';
import { authFetch } from './auth.js';

// 로그인 없이 보는 목록 요청 (클래스 카드, 카테고리, 배너에서 같이 사용)
// 응답이 { success, data } 모양이면 어떤 주소든 사용 가능
// path 예: '/classes/popular', '/classes?size=8', '/banners'
export async function fetchApiData(path) {
    const response = await authFetch(path, {
        silentAuthError: true, // 비로그인도 보는 화면 → 토큰 문제로 로그인 페이지로 튕기지 않게
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '목록을 불러오지 못했습니다.');
    }
    return result.data;
}

// 요청 + 결과 기억 (메인 인기 / 이벤트 / 전체, 클래스 목록, 배너에서 같이 사용)
// path가 바뀌면 다시 요청 (전체 클래스 탭 전환, 목록 필터 변경)
// 돌려주는 값: { state: 'loading' | 'done' | 'error', data }
export function useApiData(path) {
    // 마지막으로 받은 결과 (어떤 주소의 결과인지 이름표 key와 함께 저장)
    const [loaded, setLoaded] = useState({ key: null, state: 'loading', data: null });

    useEffect(() => {
        let ignore = false; // 늦게 온 예전 응답 무시

        fetchApiData(path)
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

// 헤더 메뉴, 메인, 클래스 목록이 한 화면에서 같이 불러서 첫 요청을 기억해 두고 나눠 씀 (새로고침 전까지 다시 받지 않음)
let categoriesPromise = null;

function fetchCategories() {
    if (!categoriesPromise) {
        categoriesPromise = fetchApiData('/categories').catch((error) => {
            categoriesPromise = null; // 실패는 기억하지 않아야 다음에 다시 요청함
            throw error;
        });
    }
    return categoriesPromise;
}

// 카테고리 목록 (받기 전이나 실패하면 빈 목록)
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