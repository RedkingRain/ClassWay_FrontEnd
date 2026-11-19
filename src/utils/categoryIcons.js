// 카테고리 아이콘 주소
// 아이콘 파일은 백엔드 static/images/category-icons, 주소는 DB categories.icon_url (GET /categories의 iconUrl)
import { API_BASE_URL } from './auth.js';

// 카테고리 1개의 아이콘 주소 (헤더 카테고리 메뉴, 클래스 목록 아이콘 줄에서 같이 사용)
// iconUrl이 없으면 null → 쓰는 쪽에서 기본 아이콘 LayoutGrid
export function getCategoryIcon(category) {
    const { iconUrl } = category;
    if (!iconUrl) return null;
    // '/'로 시작하면 백엔드에 있는 파일 → 서버 주소를 앞에 붙임 (http..., '//'로 시작하면 그대로)
    return iconUrl.startsWith('/') && !iconUrl.startsWith('//') ? `${API_BASE_URL}${iconUrl}` : iconUrl;
}