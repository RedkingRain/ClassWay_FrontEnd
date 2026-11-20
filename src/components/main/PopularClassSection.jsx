import ClassSlider from './ClassSlider.jsx';
import { useClassCards } from '../../utils/classApi.js';

// 메인 인기 클래스 TOP 10 (MAIN-003)
function PopularClassSection() {
    const { state, data } = useClassCards('/classes/popular');
    const classes = data ?? [];

    // 불러오는 중, 실패, 0개일 때는 빈 영역 대신 섹션을 숨김
    if (state !== 'done' || classes.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto max-w-6xl px-4 py-10">
            <ClassSlider title="지금 인기 있는 클래스 TOP 10" classes={classes} showRank />
        </section>
    );
}

export default PopularClassSection;
