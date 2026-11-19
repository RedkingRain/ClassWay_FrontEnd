import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';
import CategoryIconRow from '../common/CategoryIconRow.jsx';
import ClassListFilters from './ClassListFilters.jsx';
import { useCategories, useClassCards } from '../../utils/classApi.js';

const PAGE_SIZE = 20; // 한 페이지 개수 (4열 × 5줄)
const PAGE_GROUP = 5; // 페이지 번호를 몇 개씩 묶어 보여줄지 (1~5, 6~10)
const CLASS_TYPE_VALUES = ['OFFLINE', 'ONLINE'];
const SORT_VALUES = ['popular', 'latest', 'rating'];

// 진초록 버튼 (결과 없음 상자 안)
const PRIMARY_BUTTON = 'inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90';

// 결과 없음 상자 (돋보기 + 문구 + 버튼)
function EmptyResult({ message, children }) {
    return (
        <div className="rounded-2xl bg-gray-50 px-4 py-16 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                <Search size={22} className="text-point" />
            </span>
            <p className="mb-5 text-lg font-semibold text-gray-900">{message}</p>
            {children}
        </div>
    );
}

// 페이지 번호 「‹ 이전 1 2 다음 ›」 (page는 화면 기준 1부터)
function Pagination({ page, totalPages, onChange }) {
    // 지금 페이지가 속한 묶음의 첫 번호 ~ 끝 번호 (예: 7페이지 → 6~10)
    const start = Math.floor((page - 1) / PAGE_GROUP) * PAGE_GROUP + 1;
    const end = Math.min(start + PAGE_GROUP - 1, totalPages);
    const numbers = Array.from({ length: end - start + 1 }, (_, index) => start + index);

    return (
        <nav aria-label="페이지" className="mt-12 flex items-center justify-center gap-1">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className="flex items-center px-3 py-2 text-sm text-gray-700 disabled:cursor-default disabled:text-gray-300"
            >
                <ChevronLeft size={16} />
                이전
            </button>
            {numbers.map((number) => (
                <button
                    key={number}
                    type="button"
                    onClick={() => onChange(number)}
                    aria-current={number === page ? 'page' : undefined}
                    className={
                        number === page
                            ? 'h-9 w-9 rounded-lg bg-brand text-sm font-semibold text-white'
                            : 'h-9 w-9 rounded-lg text-sm text-gray-700 hover:bg-brand-light'
                    }
                >
                    {number}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center px-3 py-2 text-sm text-gray-700 disabled:cursor-default disabled:text-gray-300"
            >
                다음
                <ChevronRight size={16} />
            </button>
        </nav>
    );
}

// 클래스 목록 (MAIN-002): /classes 하나로 전체 · 카테고리 · 키워드 검색 3가지 모드
// 주소 예: /classes?keyword=베이킹&category=3&classType=OFFLINE&region=서울&sort=latest&page=2
function ClassListPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 카테고리 목록 (GET /categories, 헤더 메뉴와 요청 1번을 같이 씀)
    const { state: categoryState, data: categories } = useCategories();

    // 1. 주소 읽기 (주소는 누구나 고쳐 칠 수 있으니 이상한 값은 기본값으로)
    //    값이 없으면 null 대신 '' → 드롭다운(select)에 그대로 넘길 수 있게
    const keyword = (searchParams.get('keyword') ?? '').trim();
    // 카테고리는 목록에 있는 번호만 인정 (?category=abc, ?category=999 → 카테고리 없음 = 전체)
    // 단, 목록을 다 받은 뒤에만 검사 (받는 중에는 주소 값 그대로 → 전체 목록으로 튕기지 않게)
    const categoryParam = searchParams.get('category') ?? '';
    const selectedCategory = categories.find((item) => String(item.categoryId) === categoryParam);
    const category = categoryState === 'done' && !selectedCategory ? '' : categoryParam;
    const classTypeParam = searchParams.get('classType');
    const classType = CLASS_TYPE_VALUES.includes(classTypeParam) ? classTypeParam : 'ALL';
    const region = classType === 'OFFLINE' ? (searchParams.get('region') ?? '') : ''; // 지역은 오프라인일 때만
    const sortParam = searchParams.get('sort');
    const sort = SORT_VALUES.includes(sortParam) ? sortParam : 'popular';
    const pageParam = Number(searchParams.get('page'));
    const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;

    // 2. 모드 정하기 (검색어가 있으면 카테고리가 있어도 키워드 모드)
    const mode = keyword ? 'keyword' : category ? 'category' : 'all';

    // 3. API 주소 (화면 page는 1부터, API page는 0부터 → 1 빼기), 값 있는 조건만 붙이기
    const query = new URLSearchParams({ page: String(page - 1), size: String(PAGE_SIZE), sort });
    if (keyword) query.set('keyword', keyword);
    if (category) query.set('categoryId', category);
    if (classType !== 'ALL') query.set('classType', classType);
    if (region) query.set('region', region);

    // 4. 요청 + 결과 (주소가 바뀌면 다시 요청, 기다리는 동안은 이전 결과를 흐리게)
    const { state, data, previousData } = useClassCards(`/classes?${query}`);
    const shownData = state === 'loading' ? previousData : data;
    const classes = shownData?.classes ?? [];
    const totalCount = shownData?.totalCount ?? 0;
    const totalPages = shownData?.totalPages ?? 0;
    const isChanging = state === 'loading' && classes.length > 0;

    // 칩이 하나라도 있는지 (ClassListFilters의 칩 조건과 같음)
    const hasFilter = classType !== 'ALL' || region !== '' || (mode === 'keyword' && category !== '');

    // 5. 주소 바꾸기 (필터 · 정렬 · 페이지 버튼이 전부 여기로)
    //    changes 예: { classType: 'OFFLINE' }, { region: '' } ('' = 지우기)
    function updateParams(changes) {
        const next = new URLSearchParams(searchParams); // 지금 주소 복사 (keyword 등 나머지 유지)
        Object.entries(changes).forEach(([name, value]) => {
            if (value) {
                next.set(name, value);
            } else {
                next.delete(name);
            }
        });
        // 오프라인이 아니면 지역도 지우기 (지역 드롭다운이 사라지니까)
        if (next.get('classType') !== 'OFFLINE') {
            next.delete('region');
        }
        // 페이지 버튼이 아니면 1페이지로 (조건이 바뀌면 결과도 바뀌어서)
        if (!('page' in changes)) {
            next.delete('page');
        }
        setSearchParams(next);
    }

    // 6. 필터 초기화: 칩으로 보이는 것만 지우기 (검색어 · 카테고리 모드의 카테고리 · 정렬은 유지)
    function resetFilters() {
        const changes = { classType: '', region: '' };
        if (mode === 'keyword') {
            changes.category = '';
        }
        updateParams(changes);
    }

    // 페이지 이동 + 화면 맨 위로 (1페이지는 주소에서 page를 빼서 깔끔하게)
    function goToPage(nextPage) {
        updateParams({ page: nextPage === 1 ? '' : String(nextPage) });
        window.scrollTo({ top: 0 });
    }

    return (
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
            {/* 7. 윗부분: 키워드 모드는 제목, 나머지는 「홈 › 전체 클래스 › 카테고리명」 */}
            <div className="mb-6 border-b border-gray-200 pb-6">
                {mode === 'keyword' ? (
                    <h1 className="text-3xl font-semibold text-gray-900">
                        '<span className="text-point">{keyword}</span>' 검색 결과
                        {shownData && (
                            <span className="ml-2 text-lg font-normal text-gray-400">
                                {totalCount.toLocaleString()}개
                            </span>
                        )}
                    </h1>
                ) : (
                    <>
                        {/* 눈에는 안 보이는 제목 (화면 읽기 프로그램용) */}
                        <h1 className="sr-only">{mode === 'category' ? (selectedCategory?.name ?? '카테고리') : '전체 클래스'}</h1>
                        <nav aria-label="현재 위치" className="mb-5">
                            <ol className="flex items-center gap-1 text-sm text-gray-500">
                                <li>
                                    <Link to="/" className="hover:text-brand">홈</Link>
                                </li>
                                {mode === 'category' ? (
                                    <>
                                        <li className="flex items-center gap-1">
                                            <ChevronRight size={14} aria-hidden="true" />
                                            <Link to="/classes" className="hover:text-brand">전체 클래스</Link>
                                        </li>
                                        <li aria-current="page" className="flex items-center gap-1 font-semibold text-gray-900">
                                            <ChevronRight size={14} aria-hidden="true" />
                                            {selectedCategory?.name}
                                        </li>
                                    </>
                                ) : (
                                    <li aria-current="page" className="flex items-center gap-1 font-semibold text-gray-900">
                                        <ChevronRight size={14} aria-hidden="true" />
                                        전체 클래스
                                    </li>
                                )}
                            </ol>
                        </nav>

                        {/* 8. 카테고리 아이콘 줄 (키워드 모드는 드롭다운이 대신함) */}
                        <CategoryIconRow categories={categories} selectedId={category} />
                    </>
                )}
            </div>

            {/* 필터 (탭 · 드롭다운 · 정렬 · 칩) */}
            <div className="mb-6">
                <ClassListFilters
                    filters={{ category, classType, region, sort }}
                    mode={mode}
                    categories={categories}
                    onChange={updateParams}
                    onReset={resetFilters}
                />
            </div>

            {/* 9. 목록 상태 (위에서부터 맞는 것 하나만) */}
            {state === 'loading' && classes.length === 0 && (
                <p className="py-20 text-center text-gray-400">불러오는 중...</p>
            )}
            {state === 'error' && (
                <p className="py-20 text-center text-gray-400">클래스 목록을 불러오지 못했습니다.</p>
            )}
            {state === 'done' && classes.length === 0 && (
                // 필터를 적용했거나, 주소에 없는 페이지를 쳤으면 → 필터 초기화
                hasFilter || page > 1 ? (
                    <EmptyResult message="조건에 맞는 클래스가 없습니다">
                        <button type="button" onClick={resetFilters} className={PRIMARY_BUTTON}>
                            필터 초기화
                        </button>
                    </EmptyResult>
                ) : mode === 'keyword' ? (
                    <EmptyResult message={`'${keyword}'에 맞는 클래스가 없습니다`}>
                        <Link to="/classes" className={PRIMARY_BUTTON}>전체 클래스 보기</Link>
                    </EmptyResult>
                ) : mode === 'category' ? (
                    <EmptyResult message="이 카테고리에 아직 클래스가 없습니다">
                        <Link to="/classes" className={PRIMARY_BUTTON}>전체 클래스 보기</Link>
                    </EmptyResult>
                ) : (
                    <EmptyResult message="등록된 클래스가 없습니다" />
                )
            )}
            {classes.length > 0 && (
                <>
                    <ul
                        className={`grid grid-cols-4 gap-x-4 gap-y-8 transition-opacity ${isChanging ? 'opacity-50' : ''}`}
                        aria-busy={isChanging}
                    >
                        {classes.map((card) => (
                            <li key={card.classId}>
                                <ClassCard card={card} />
                            </li>
                        ))}
                    </ul>

                    {/* 10. 페이지 번호 (2페이지 이상일 때만) */}
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={goToPage} />}
                </>
            )}
        </main>
    );
}

export default ClassListPage;