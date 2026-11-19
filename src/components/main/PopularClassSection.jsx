import ClassSlider from './ClassSlider.jsx';
import { useClassCards } from '../../utils/classApi.js';

// 메인 인기 클래스 TOP 10 (MAIN-003): 순위 배지 + 가로 슬라이드
function PopularClassSection() {
    // 1. 인기 클래스 요청 + 결과
    const { state, data } = useClassCards('/classes/popular');
    const classes = data ?? []; // 아직 없으면 빈 목록

    // 2. 불러오는 중 / 에러 / 0개 → 섹션 숨김
    if (state !== 'done' || classes.length === 0) {
        return null;
    }

    // 3. 순위 배지를 붙여서 슬라이드
    return (
        <section className="mx-auto max-w-6xl px-4 py-10">
            <ClassSlider title="지금 인기 있는 클래스 TOP 10" classes={classes} showRank />
        </section>
    );
}

export default PopularClassSection;
