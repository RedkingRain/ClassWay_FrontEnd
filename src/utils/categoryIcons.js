// 카테고리 아이콘 (SVG 파일)
import drawingIcon from '../assets/category-icons/drawing.svg';
import craftIcon from '../assets/category-icons/craft.svg';
import bakingIcon from '../assets/category-icons/baking.svg';
import fitnessIcon from '../assets/category-icons/fitness.svg';
import musicIcon from '../assets/category-icons/music.svg';
import photoIcon from '../assets/category-icons/photo.svg';
import designIcon from '../assets/category-icons/design.svg';
import itIcon from '../assets/category-icons/it.svg';
import aiIcon from '../assets/category-icons/ai.svg';
import languageIcon from '../assets/category-icons/language.svg';

// 카테고리 번호 -> 아이콘 파일 (화면 꾸미기용이라 프론트에서 정함)
// 관리자가 새 카테고리를 추가하면 여기 없는 번호가 생김 -> 기본 아이콘 (LayoutGrid)으로 표시
const CATEGORY_ICONS = {
    1: drawingIcon,
    2: craftIcon,
    3: bakingIcon,
    4: fitnessIcon,
    5: musicIcon,
    6: photoIcon,
    7: designIcon,
    8: itIcon,
    9: aiIcon,
    10: languageIcon,
};

// 카테고리 1개의 아이콘 주소 (헤더 카테고리 메뉴 · 클래스 목록 아이콘 줄에서 같이 사용)
// 순서: 서버가 준 iconUrl → 프론트 SVG → null (null이면 쓰는 쪽에서 기본 아이콘 LayoutGrid)
// TODO(icon_url): categories 테이블에 icon_url 칸이 생기면 GET /categories 응답의 iconUrl이 먼저 쓰임
export function getCategoryIcon(category) {
    return category.iconUrl || CATEGORY_ICONS[category.categoryId] || null;
}