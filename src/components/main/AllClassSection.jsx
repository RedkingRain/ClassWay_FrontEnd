import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';
import ClassTypeTabs from '../common/ClassTypeTabs.jsx';
import { useClassCards } from '../../utils/classApi.js';

// 4개씩 2줄이라 8개
const MAIN_CLASS_COUNT = 8;

// 메인 전체 클래스 (MAIN-003)
function AllClassSection() {
    const [tab, setTab] = useState('ALL');

    // 전체 탭은 classType 없이 요청함
    const query = new URLSearchParams({ size: String(MAIN_CLASS_COUNT), sort: 'random' });
    if (tab !== 'ALL') {
        query.set('classType', tab);
    }
    const path = `/classes?${query}`;

    const { state, data, previousData } = useClassCards(path);

    // 새 결과를 기다리는 동안은 이전 탭 결과를 보여줌 (화면 높이가 줄었다 늘어나는 것 방지)
    const shownData = state === 'loading' ? previousData : data;
    const classes = shownData?.classes ?? [];
    const isChanging = state === 'loading' && classes.length > 0;

    // 더보기는 고른 탭을 유지한 채 목록으로 감
    const moreLink = tab === 'ALL' ? '/classes' : `/classes?classType=${tab}`;

    return (
        <section className="mx-auto max-w-6xl px-4 py-10">
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

            <div className="mb-5">
                <ClassTypeTabs value={tab} onChange={setTab} />
            </div>

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
