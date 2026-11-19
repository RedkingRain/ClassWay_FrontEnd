import { ChevronDown, X } from 'lucide-react';
import ClassTypeTabs from '../common/ClassTypeTabs.jsx';

// classes.region 앞부분과 같은 글자여야 검색됨
const REGIONS = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const SORTS = [
    { value: 'popular', label: '인기순' },
    { value: 'latest', label: '최신순' },
    { value: 'rating', label: '별점순' },
];

// 드롭다운을 직접 만들지 않고 select 태그에 모양만 입혀서, 키보드로 고르기와 화면 읽어주기가 저절로 됨
function FilterSelect({ label, value, onChange, children }) {
    return (
        <label className="relative flex h-9 items-center gap-2 rounded-lg border border-gray-300 pl-4 pr-9 text-sm">
            {label && <span className="shrink-0 text-gray-400">{label}</span>}
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent font-medium text-gray-900 focus:outline-none"
            >
                {children}
            </select>
            {/* 화살표를 눌러도 select가 열리게 클릭을 통과시킴 */}
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-gray-500" />
        </label>
    );
}

// 클래스 목록 필터 (MAIN-002), onChange에 '' 값을 넘기면 그 필터를 해제함
function ClassListFilters({ filters, mode, categories, onChange, onReset }) {
    const { category, classType, region, sort } = filters;
    const isKeywordMode = mode === 'keyword';

    // 칩 순서는 와이어프레임 기준 (카테고리, 수업 형태, 지역)
    const chips = [];
    if (isKeywordMode && category) {
        const found = categories.find((item) => String(item.categoryId) === category);
        chips.push({ key: 'category', label: found ? found.name : '카테고리' });
    }
    if (classType !== 'ALL') {
        chips.push({ key: 'classType', label: classType === 'OFFLINE' ? '오프라인' : '온라인' });
    }
    if (region) {
        chips.push({ key: 'region', label: `${region} 전체` });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                {/* 전체를 고르면 주소에서 classType을 지움 */}
                <ClassTypeTabs
                    value={classType}
                    onChange={(value) => onChange({ classType: value === 'ALL' ? '' : value })}
                />

                {(isKeywordMode || classType === 'OFFLINE') && (
                    <span aria-hidden="true" className="mx-2 h-6 w-px bg-gray-200" />
                )}

                {/* 키워드 화면에만 둠, 다른 화면은 아이콘 줄이 대신함 */}
                {isKeywordMode && (
                    <FilterSelect label="카테고리" value={category} onChange={(value) => onChange({ category: value })}>
                        <option value="">전체</option>
                        {categories.map((item) => (
                            <option key={item.categoryId} value={item.categoryId}>
                                {item.name}
                            </option>
                        ))}
                    </FilterSelect>
                )}

                {classType === 'OFFLINE' && (
                    <FilterSelect label="지역" value={region} onChange={(value) => onChange({ region: value })}>
                        <option value="">전체</option>
                        {REGIONS.map((item) => (
                            <option key={item} value={item}>
                                {item} 전체
                            </option>
                        ))}
                    </FilterSelect>
                )}

                <div className="ml-auto w-32">
                    <FilterSelect value={sort} onChange={(value) => onChange({ sort: value })}>
                        {SORTS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </FilterSelect>
                </div>
            </div>

            {chips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {chips.map((chip) => (
                        <span
                            key={chip.key}
                            className="flex items-center gap-1.5 rounded-full bg-brand-light py-1.5 pl-3.5 pr-2.5 text-sm text-gray-900"
                        >
                            {chip.label}
                            <button
                                type="button"
                                onClick={() => onChange({ [chip.key]: '' })}
                                aria-label={`${chip.label} 필터 해제`}
                                className="rounded-full p-0.5 hover:bg-white"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}
                    <button
                        type="button"
                        onClick={onReset}
                        className="ml-2 text-sm text-gray-500 underline hover:text-gray-900"
                    >
                        필터 초기화
                    </button>
                </div>
            )}
        </div>
    );
}

export default ClassListFilters;