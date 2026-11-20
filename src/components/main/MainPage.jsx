import PopularClassSection from './PopularClassSection.jsx';
import EventClassSection from './EventClassSection.jsx';
import AllClassSection from './AllClassSection.jsx';

function MainPage() {
    return (
        <main>
            {/* MAIN-004 홍보 배너 */}
            <section>
                <p>홍보 배너 영역</p>
            </section>

            {/* MAIN-002 카테고리 탐색 */}
            <section>
                <p>카테고리 영역</p>
            </section>

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
