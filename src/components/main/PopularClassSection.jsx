import {useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';
import {fetchClassCards} from '../../utils/classApi.js';

const CARD_GAP = 16; // 카드 사이 간격 (gap-4 = 16px)

// 슬라이드를 카드 1장만큼 이동 (direction: 1 오른쪽, -1 왼쪽)
function slideByCard(box, direction) {
    if (!box || !box.firstElementChild) return;
    const step = box.firstElementChild.offsetWidth + CARD_GAP;
    box.scrollBy({left: step * direction, behavior: 'smooth'});
}

// 메인 인기 클래스 TOP 10 (MAIN-003): 순위 배지 + 가로 슬라이드
function PopularClassSection() {
    // 1. 상태
    const [loaded, setLoaded] = useState({state: 'loading', classes: []});
    const scrollRef = useRef(null);                  // 가로로 움직일 목록 상자

    const classes = loaded.classes;

    // 2. 처음 한 번 인기 클래스 요청
    useEffect(() => {
        let ignore = false;

        fetchClassCards('/classes/popular')
            .then((data) => {
                if (ignore) return;
                setLoaded({state: 'done', classes: data});
            })
            .catch(() => {
                if (ignore) return;
                setLoaded({state: 'error', classes: []});
            });

        return () => {
            ignore = true;
        };
    }, []);

    // 5. 불러오는 중 / 에러 / 0개 → 섹션 숨김
    if (loaded.state !== 'done' || classes.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">지금 인기 있는 클래스 TOP 10</h2>

                {/* 4. 화살표 */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        aria-label="이전 클래스"
                        onClick={() => slideByCard(scrollRef.current, -1)}
                        className="p-1 text-gray-400 transition hover:text-gray-900"
                    >
                        <ChevronLeft size={24}/>
                    </button>
                    <button
                        type="button"
                        aria-label="다음 클래스"
                        onClick={() => slideByCard(scrollRef.current, 1)}
                        className="p-1 text-gray-400 transition hover:text-gray-900"
                    >
                        <ChevronRight size={24}/>
                    </button>
                </div>
            </div>

            {/* 6. 카드 목록 (한 화면에 4장 + 다음 카드 일부) */}
            <ul
                ref={scrollRef}
                className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none]"
            >
                {classes.map((card, index) => (
                    <li key={card.classId} className="w-[23%] shrink-0 snap-start">
                        <ClassCard card={card} rank={index + 1}/>
                    </li>
                ))}
            </ul>
        </section>
    );
}

export default PopularClassSection;