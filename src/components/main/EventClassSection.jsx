import ClassSlider from './ClassSlider.jsx';
import { useApiData } from '../../utils/api.js';

// 와이어프레임 기준으로 이벤트 클래스가 4개보다 적으면 섹션을 숨김
const MIN_EVENT_COUNT = 4;

// 메인 이벤트 중인 클래스 (MAIN-003)
function EventClassSection() {
    const { state, data } = useApiData('/classes/events');
    const classes = data ?? [];

    if (state !== 'done' || classes.length < MIN_EVENT_COUNT) {
        return null;
    }

    return (
        <section className="bg-brand py-14">
            <div className="mx-auto max-w-6xl px-4">
                <ClassSlider title="이벤트 중인 클래스" classes={classes} showEventLabel dark />
            </div>
        </section>
    );
}

export default EventClassSection;
