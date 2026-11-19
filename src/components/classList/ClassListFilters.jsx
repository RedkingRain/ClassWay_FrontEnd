import { ChevronDown, X } from 'lucide-react';

// 수업 형태 탭 (메인 AllClassSection과 같은 순서), value는 백엔드 classType 값
const CLASS_TYPES = [
    { value: 'ALL', label: '전체' },
    { value: 'OFFLINE', label: '오프라인' },
    { value: 'ONLINE', label: '온라인' },
];

// 지역 (시/도 단위, 값은 classes.region에 저장된 글자와 같아야 검색됨)
const REGIONS = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

// 정렬 (기본 인기순)
const SORTS = [
    { value: 'popular', label: '인기순' },
    { value: 'latest', label: '최신순' },
    { value: 'rating', label: '별점순' },
];

// 이름표 + 드롭다운 한 개 (「지역 서울 전체 ⌄」 모양)
// 브라우저 기본 select를 꾸며서 사용 → 키보드 · 화면 읽기 프로그램 지원이 자동
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
            {/* 화살표는 꾸밈용 → 클릭이 select로 가도록 pointer-events-none */}
            <ChevronDown size={16} className="pointer-events-none absolute right-3 text-gray-500" />
        </label>
    );
}

// 클래스 목록 필터 (MAIN-002): 수업 형태 탭 + 카테고리 · 지역 드롭다운 + 정렬 + 적용된 필터 칩
// filters: { category, classType, region, sort } (주소에서 꺼낸 값, classType은 'ALL' | 'OFFLINE' | 'ONLINE')
// mode: 'all' | 'category' | 'keyword' (키워드 모드일 때만 카테고리 드롭다운 · 카테고리 칩)
// onChange({ 이름: 값 }): 주소 바꾸기 (빈 글자 '' = 그 필터 해제)
// onReset(): 필터 초기화
function ClassListFilters({ filters, mode, categories, onChange, onReset }) {
    const { category, classType, region, sort } = filters;
    const isKeywordMode = mode === 'keyword';

    // 1. 적용된 필터 칩 (와이어프레임 순서: 카테고리 → 수업 형태 → 지역)
    const chips = [];
    if (isKeywordMode && category) {
        const found = categories.find((item) => String(item.categoryId) === category);
        chips.push({ key: 'category', label: found ? found.name : '카테고리' });
    }
    if (classType !== 'ALL') {
        chips.push({ key: 'classType', label: CLASS_TYPES.find((item) => item.value === classType).label });
    }
    if (region) {
        chips.push({ key: 'region', label: `${region} 전체` });
    }

    return (
        <div className="space-y-6">
            {/* 2. 위 줄: 탭 · 드롭다운 (왼쪽) + 정렬 (오른쪽) */}
            <div className="flex flex-wrap items-center gap-2">
                {/* 수업 형태 탭 */}
                <div className="flex gap-2" role="group" aria-label="수업 형태">
                    {CLASS_TYPES.map((item) => {
                        const isActive = item.value === classType;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                aria-pressed={isActive}
                                // 「전체」는 주소에서 classType을 지움
                                onClick={() => onChange({ classType: item.value === 'ALL' ? '' : item.value })}
                                className={
                                    isActive
                                        ? 'h-9 rounded-full bg-brand px-4 text-sm font-medium text-white'
                                        : 'h-9 rounded-full border border-gray-300 px-4 text-sm text-gray-700 transition hover:bg-brand-light'
                                }
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* 탭과 드롭다운 사이 세로선 (드롭다운이 있을 때만) */}
                {(isKeywordMode || classType === 'OFFLINE') && (
                    <span aria-hidden="true" className="mx-2 h-6 w-px bg-gray-200" />
                )}

                {/* 카테고리 드롭다운: 키워드 모드에서만 (다른 모드는 아이콘 줄이 대신함) */}
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

                {/* 지역 드롭다운: 오프라인일 때만 */}
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

                {/* 정렬: 오른쪽 끝 (ml-auto) */}
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

            {/* 3. 아래 줄: 적용된 필터 칩 + 필터 초기화 (칩이 있을 때만) */}
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