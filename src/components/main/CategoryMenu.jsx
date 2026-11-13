import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ChevronRight, LayoutGrid } from 'lucide-react';
import { mockCategories } from '../../mocks/categoryData.js';

// 카테고리 아이콘 (피그마에서 SVG로 내보낸 파일)
import drawingIcon from '../../assets/category-icons/drawing.svg';
import craftIcon from '../../assets/category-icons/craft.svg';
import bakingIcon from '../../assets/category-icons/baking.svg';
import fitnessIcon from '../../assets/category-icons/fitness.svg';
import musicIcon from '../../assets/category-icons/music.svg';
import photoIcon from '../../assets/category-icons/photo.svg';
import designIcon from '../../assets/category-icons/design.svg';
import itIcon from '../../assets/category-icons/it.svg';
import aiIcon from '../../assets/category-icons/ai.svg';
import languageIcon from '../../assets/category-icons/language.svg';

// 카테고리 번호 → 아이콘 파일 (화면 꾸미기용이라 프론트에서 정함)
// 관리자가 새 카테고리를 추가하면 여기 없는 번호가 생김 → 기본 아이콘(LayoutGrid)으로 표시
const CATEGORY_ICONS = {
    1: drawingIcon,   // 드로잉
    2: craftIcon,     // 공예 · DIY
    3: bakingIcon,    // 베이킹 · 요리
    4: fitnessIcon,   // 운동 · 라이프
    5: musicIcon,     // 음악
    6: photoIcon,     // 사진 · 영상
    7: designIcon,    // 디자인
    8: itIcon,        // IT
    9: aiIcon,        // AI
    10: languageIcon, // 외국어
};

// 헤더의 「카테고리」 버튼 + 펼쳐지는 전체 카테고리 메뉴 (MAIN-001 · MAIN-002)
function CategoryMenu() {
    // 메뉴가 펼쳐졌는지 기억
    const [isOpen, setIsOpen] = useState(false);
    // 메뉴 전체(버튼 + 펼친 영역)를 가리키는 표시 → "바깥 클릭"인지 판단할 때 씀
    const menuRef = useRef(null);

    // 카테고리 목록 (나중에 API 호출로 교체)
    const categories = mockCategories;

    // 메뉴가 열려 있을 때만: 바깥 클릭 · ESC 키로 닫기
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            // 누른 곳이 메뉴 안이 아니면 닫기
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setIsOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        // 메뉴가 닫히면 감시도 끝내기 (안 지우면 감시가 계속 쌓임)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    function closeMenu() {
        setIsOpen(false);
    }

    return (
        <div ref={menuRef} className="shrink-0">
            {/* 카테고리 버튼 — 누를 때마다 열기 ↔ 닫기 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="category-menu"
                className={`flex items-center gap-1.5 text-sm font-medium transition ${
                    isOpen ? 'text-brand' : 'text-gray-800 hover:text-brand'
                }`}
            >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
                카테고리
            </button>

            {isOpen && (
                <>
                    {/* 뒤 화면 어둡게 — 누르면 닫힘 */}
                    <div
                        aria-hidden="true"
                        onClick={closeMenu}
                        className="absolute inset-x-0 top-full z-30 h-screen bg-black/25"
                    />

                    {/* 펼쳐진 메뉴 — 헤더 바로 아래, 가운데 카드 */}
                    <div id="category-menu" className="absolute inset-x-0 top-full z-40 px-4">
                        <div className="mx-auto max-w-6xl rounded-b-xl border border-t-0 border-gray-200 bg-white px-8 pb-8 pt-7 shadow-lg">
                            {/* 제목 + 전체 클래스 보기 */}
                            <div className="flex items-center justify-between">
                                <p className="text-base font-semibold text-gray-900">
                                    전체 카테고리
                                    <span className="ml-1.5 text-sm font-medium text-brand">{categories.length}</span>
                                </p>
                                <Link
                                    to="/classes"
                                    onClick={closeMenu}
                                    className="flex items-center gap-0.5 text-sm font-semibold text-brand hover:underline"
                                >
                                    전체 클래스 보기
                                    <ChevronRight size={16} />
                                </Link>
                            </div>

                            {/* 카테고리 5 × 2 격자 */}
                            {categories.length > 0 ? (
                                <ul className="mt-5 grid grid-cols-5 gap-2">
                                    {categories.map((category) => {
                                        // 번호에 맞는 아이콘 파일 (없으면 undefined → 아래에서 기본 아이콘)
                                        const iconSrc = CATEGORY_ICONS[category.categoryId];
                                        return (
                                            <li key={category.categoryId}>
                                                <Link
                                                    to={`/classes?category=${category.categoryId}`}
                                                    onClick={closeMenu}
                                                    className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-brand-soft"
                                                >
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gray-100">
                                                        {iconSrc ? (
                                                            // alt="" : 바로 옆에 카테고리 이름이 있어서 아이콘은 꾸밈용
                                                            <img src={iconSrc} alt="" className="h-[22px] w-[22px]" />
                                                        ) : (
                                                            <LayoutGrid size={18} className="text-gray-400" />
                                                        )}
                                                    </span>
                                                    <span>
                                                        <span className="block text-sm font-medium text-gray-900">{category.name}</span>
                                                        <span className="block text-xs text-gray-400">{category.classCount}개 클래스</span>
                                                    </span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <p className="mt-5 text-sm text-gray-400">등록된 카테고리가 없습니다.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default CategoryMenu;