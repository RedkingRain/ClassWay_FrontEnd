import ClassSlider from './ClassSlider.jsx';
import { useClassCards } from '../../utils/classApi.js';

// 이벤트 클래스가 이 개수보다 적으면 섹션 숨김 (와이어프레임: 4개 미만이면 영역 자체를 숨김)
const MIN_EVENT_COUNT = 4;

// 메인 이벤트 중인 클래스 (MAIN-003): 진초록 배경 + 이벤트 배지 + 가로 슬라이드
function EventClassSection() {
    // 1. 이벤트 클래스 요청 + 결과 (마감 임박순, 최대 8개)
    const { state, data } = useClassCards('/classes/events');
    const classes = data ?? [];

    // 2. 불러오는 중 / 에러 / 4개 미만 → 섹션 숨김
    if (state !== 'done' || classes.length < MIN_EVENT_COUNT) {
        return null;
    }

    // 3. 화면 가로 전체 진초록 배경, 안쪽은 다른 섹션과 같은 폭
    return (
        <section className="bg-brand py-14">
            <div className="mx-auto max-w-6xl px-4">
                <ClassSlider title="이벤트 중인 클래스" classes={classes} showEventLabel dark />
            </div>
        </section>
    );
}

export default EventClassSection;
