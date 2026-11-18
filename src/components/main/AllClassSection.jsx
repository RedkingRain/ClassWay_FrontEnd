import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';
import { useClassCards } from '../../utils/classApi.js';

const MAIN_CLASS_COUNT = 8; // 메인에 보여줄 개수 (4개 × 2줄)

// 탭 (와이어프레임 순서: 전체 / 오프라인 / 온라인), value는 백엔드 classType 값
const TABS = [
    { value: 'ALL', label: '전체' },
    { value: 'OFFLINE', label: '오프라인' },
    { value: 'ONLINE', label: '온라인' },
];

// 메인 전체 클래스 (MAIN-003): 탭 + 8개 그리드 + 더보기
function AllClassSection() {
    // 1. 선택한 탭
    const [tab, setTab] = useState('ALL');

    // 2. 탭에 맞는 요청 주소 (전체는 classType 없이)
    const query = new URLSearchParams({ size: String(MAIN_CLASS_COUNT), sort: 'random' });
    if (tab !== 'ALL') {
        query.set('classType', tab);
    }
    const path = `/classes?${query}`;

    // 3. 요청 + 결과 (탭이 바뀌면 주소가 바뀌어서 다시 요청)
    const { state, data, previousData } = useClassCards(path);

    // 새 결과를 기다리는 동안은 이전 탭 결과를 보여줌 (화면 높이가 줄었다 늘어나는 것 방지)
    const shownData = state === 'loading' ? previousData : data;
    const classes = shownData?.classes ?? []; // 목록 API는 { classes, totalCount, totalPages } 모양
    const isChanging = state === 'loading' && classes.length > 0; // 탭 바꾸는 중

    // 4. 더보기: 선택한 탭을 유지한 채 전체 목록으로
    const moreLink = tab === 'ALL' ? '/classes' : `/classes?classType=${tab}`;

    return (
        <section className="mx-auto max-w-6xl px-4 py-10">
            {/* 제목 + 더보기 */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">전체 클래스</h2>
                <Link
                    to={moreLink}
                    className="flex items-center text-sm font-semibold text-gray-700 hover:text-brand"
                >
                    더보기
                    <ChevronRight size={16} />
                </Link>
            </div>

            {/* 탭 */}
            <div className="mb-5 flex gap-2" role="tablist">
                {TABS.map((item) => {
                    const isActive = item.value === tab;
                    return (
                        <button
                            key={item.value}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setTab(item.value)}
                            className={
                                isActive
                                    ? 'rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white'
                                    : 'rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-700 transition hover:bg-brand-light'
                            }
                        >
                            {item.label}
                        </button>
                    );
                })}
            </div>

            {/* 카드 그리드 (4개 × 2줄) / 상태 안내 */}
            {state === 'loading' && classes.length === 0 && (
                <p className="py-20 text-center text-gray-400">불러오는 중...</p>
            )}
            {state === 'error' && (
                <p className="py-20 text-center text-gray-400">클래스 목록을 불러오지 못했습니다.</p>
            )}
            {state === 'done' && classes.length === 0 && (
                <p className="py-20 text-center text-gray-400">등록된 클래스가 없습니다.</p>
            )}
            {classes.length > 0 && (
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
            )}
        </section>
    );
}

export default AllClassSection;
