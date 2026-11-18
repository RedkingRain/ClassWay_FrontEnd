import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';

const CARD_GAP = 16; // 카드 사이 간격 (gap-4 = 16px)

// 슬라이드를 카드 1장만큼 이동 (direction: 1 오른쪽, -1 왼쪽)
function slideByCard(box, direction) {
    if (!box || !box.firstElementChild) return;
    const step = box.firstElementChild.offsetWidth + CARD_GAP;
    box.scrollBy({ left: step * direction, behavior: 'smooth' });
}

// 메인 가로 슬라이드 (인기 / 이벤트에서 같이 사용), 화살표를 누를 때만 이동
// title: 섹션 제목
// classes: 카드 목록 (받은 순서 그대로 보여줌)
// showRank: true면 순서대로 1위, 2위 ... 배지
// showEventLabel: true면 이벤트 배지
// dark: 진초록 배경 위 (제목, 화살표 흰색 + 카드 흰 상자)
function ClassSlider({ title, classes, showRank = false, showEventLabel = false, dark = false }) {
    const scrollRef = useRef(null); // 가로로 움직일 목록 상자

    const titleColor = dark ? 'text-white' : 'text-gray-900';
    const arrowColor = dark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-900';

    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h2 className={`text-2xl font-semibold ${titleColor}`}>{title}</h2>

                <div className="flex gap-3">
                    <button
                        type="button"
                        aria-label="이전 클래스"
                        onClick={() => slideByCard(scrollRef.current, -1)}
                        className={`p-1 transition ${arrowColor}`}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        type="button"
                        aria-label="다음 클래스"
                        onClick={() => slideByCard(scrollRef.current, 1)}
                        className={`p-1 transition ${arrowColor}`}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* 한 화면에 4장 + 다음 카드 일부 */}
            <ul
                ref={scrollRef}
                className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none]"
            >
                {classes.map((card, index) => (
                    <li key={card.classId} className="w-[23%] shrink-0 snap-start">
                        <ClassCard
                            card={card}
                            rank={showRank ? index + 1 : undefined}
                            showEventLabel={showEventLabel}
                            boxed={dark}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ClassSlider;
