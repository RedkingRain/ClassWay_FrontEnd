import BannerSection from './BannerSection.jsx';
import PopularClassSection from './PopularClassSection.jsx';
import EventClassSection from './EventClassSection.jsx';
import AllClassSection from './AllClassSection.jsx';
import CategoryIconRow from '../common/CategoryIconRow.jsx';
import { useCategories } from '../../utils/api.js';

function MainPage() {
    // 카테고리 목록 (GET /categories, 헤더 메뉴와 요청 1번을 같이 씀)
    const { state: categoryState, data: categories } = useCategories();

    return (
        <main>
            {/* MAIN-004 홍보 배너 */}
            <BannerSection />

            {/* MAIN-002 카테고리 탐색 (불러오는 중, 실패면 숨김) */}
            {categoryState === 'done' && (
                <section className="mx-auto max-w-6xl px-4 pt-14 pb-10">
                    <CategoryIconRow categories={categories} />
                </section>
            )}

            {/* MAIN-003 인기 클래스 TOP 10 */}
            <PopularClassSection />

            {/* MAIN-003 이벤트 중인 클래스 (4개 미만이면 숨김) */}
            <EventClassSection />

            {/* MAIN-003 전체 클래스 */}
            <AllClassSection />

            {/* MAIN-004 수강 후기 */}
            <section>
                <p>수강 후기 영역</p>
            </section>
        </main>
    );
}

export default MainPage;
