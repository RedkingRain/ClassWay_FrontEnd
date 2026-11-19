import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ClassCard from '../common/ClassCard.jsx';

// 목록의 gap-4(16px)와 같아야 카드 1장만큼 정확히 움직임
const CARD_GAP = 16;

// direction은 1이면 오른쪽, -1이면 왼쪽
function slideByCard(box, direction) {
    if (!box || !box.firstElementChild) return;
    const step = box.firstElementChild.offsetWidth + CARD_GAP;
    box.scrollBy({ left: step * direction, behavior: 'smooth' });
}

// 메인 가로 슬라이드 (MAIN-003 인기, 이벤트), 화살표를 누를 때만 움직이고 dark는 진초록 배경용
function ClassSlider({ title, classes, showRank = false, showEventLabel = false, dark = false }) {
    const scrollRef = useRef(null);

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

            {/* 다음 카드 일부를 보여줘서 옆에 더 있다는 걸 알려줌 */}
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
