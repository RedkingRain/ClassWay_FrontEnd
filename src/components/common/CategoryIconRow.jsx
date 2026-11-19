import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { getCategoryIcon } from '../../utils/categoryIcons.js';

// 「전체 + 카테고리 아이콘」 한 줄 (클래스 목록 MAIN-002, 나중에 메인 카테고리 영역에서도 사용)
// categories: 카테고리 목록 (지금은 mockCategories, 나중에 GET /categories 응답)
// selectedId: 고른 카테고리 번호 (주소 ?category= 값이라 글자일 수 있음, 없으면 「전체」가 선택됨)
function CategoryIconRow({ categories, selectedId }) {
    // 1. 한 줄에 그릴 칸 = 맨 앞 「전체」 + 카테고리들
    const items = [
        { key: 'all', name: '전체', to: '/classes', iconSrc: null, isActive: !selectedId },
        ...categories.map((category) => ({
            key: category.categoryId,
            name: category.name,
            to: `/classes?category=${category.categoryId}`,
            iconSrc: getCategoryIcon(category),
            // 주소에서 온 값은 글자("3"), 목록 번호는 숫자(3) → 글자로 맞춰서 비교
            isActive: String(category.categoryId) === String(selectedId),
        })),
    ];

    return (
        <nav aria-label="카테고리">
            {/* 2. 칸이 많아 화면이 좁으면 가로로 밀어서 보기 */}
            <ul className="flex justify-between gap-2 overflow-x-auto pb-2">
                {items.map((item) => (
                    <li key={item.key} className="shrink-0">
                        {/* 3. 카테고리를 누르면 다른 필터 없이 그 카테고리 목록으로 새로 시작 */}
                        <Link
                            to={item.to}
                            aria-current={item.isActive ? 'page' : undefined}
                            className="group flex w-16 flex-col items-center gap-2"
                        >
                            {/* 4. 아이콘 상자: 고른 칸은 진한 테두리 */}
                            <span
                                className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                                    item.isActive
                                        ? 'border-2 border-brand bg-white'
                                        : 'border-2 border-transparent bg-gray-100 group-hover:bg-brand-light'
                                }`}
                            >
                                {item.iconSrc ? (
                                    // alt="" : 바로 아래 이름이 있어서 아이콘은 꾸밈용
                                    <img src={item.iconSrc} alt="" className="h-6 w-6" />
                                ) : (
                                    // 「전체」 칸, 아이콘 없는 새 카테고리 → 기본 아이콘
                                    <LayoutGrid size={22} className={item.key === 'all' ? 'text-brand' : 'text-gray-400'} />
                                )}
                            </span>

                            {/* 5. 이름: 고른 칸은 굵게 */}
                            <span
                                className={`whitespace-nowrap text-xs ${
                                    item.isActive ? 'font-semibold text-gray-900' : 'text-gray-600'
                                }`}
                            >
                                {item.name}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default CategoryIconRow;