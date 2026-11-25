import { X } from 'lucide-react';
import ClassTypeTabs from '../common/ClassTypeTabs.jsx';
import Dropdown from '../common/Dropdown.jsx';

// classes.region 앞부분과 같은 글자여야 검색됨
const REGIONS = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기',
    '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const REGION_OPTIONS = [
    { value: '', label: '지역 전체' },
    ...REGIONS.map((item) => ({ value: item, label: `${item} 전체` })),
];

const SORTS = [
    { value: 'popular', label: '인기순' },
    { value: 'latest', label: '최신순' },
    { value: 'rating', label: '별점순' },
];

// 클래스 목록 필터 (MAIN-002), onChange에 '' 값을 넘기면 그 필터를 해제함
function ClassListFilters({ filters, mode, categories, onChange, onReset }) {
    const { category, classType, region, sort } = filters;
    const isKeywordMode = mode === 'keyword';

    // 주소에서 온 category는 글자라서 categoryId도 글자로 바꿔야 같은 값으로 찾아짐
    const categoryOptions = [
        { value: '', label: '카테고리 전체' },
        ...categories.map((item) => ({ value: String(item.categoryId), label: item.name })),
    ];

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
                    <Dropdown
                        small
                        label="카테고리"
                        options={categoryOptions}
                        value={category}
                        onChange={(value) => onChange({ category: value })}
                    />
                )}

                {classType === 'OFFLINE' && (
                    <Dropdown
                        small
                        label="지역"
                        options={REGION_OPTIONS}
                        value={region}
                        onChange={(value) => onChange({ region: value })}
                    />
                )}

                <Dropdown
                    small
                    label="정렬"
                    options={SORTS}
                    value={sort}
                    onChange={(value) => onChange({ sort: value })}
                    className="ml-auto w-32"
                />
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