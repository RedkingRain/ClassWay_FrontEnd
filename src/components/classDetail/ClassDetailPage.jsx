// useParams: 주소에서 값 꺼내기 (/classes/1 → classId = "1")
import { useParams } from 'react-router-dom'

function ClassDetailPage() {
    // App.jsx의 path="/classes/:classId" 에서 :classId 자리 값
    const { classId} = useParams();


    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            {/* 1. 대표 이미지 / 영상 */}
            <div className="flex aspect-[16/7] items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                대표 이미지 영역 (클래스 {classId}번)
            </div>

            {/* 왼쪽 내용 + 오른쪽 결제 박스 (넓은 화면에서만 2칸) */}
            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
                {/* 왼쪽 */}
                <div>
                    {/* 2. 상세 정보 */}
                    <section className="rounded-lg border border-dashed border-gray-300 p-6 text-gray-400">
                        상세 정보 영역
                    </section>

                    {/* 3. 탭 */}
                    <section className="mt-8 rounded-lg border border-dashed border-gray-300 p-6 text-gray-400">
                        탭 영역 (강의 소개 / 커리큘럼 / 수강평 / Q&A)
                    </section>
                </div>

                {/* 4. 결제 박스 — 스크롤해도 화면 위쪽에 붙어서 따라옴 본문 보조 역할이라 aside 사용 */}
                <aside className="self-start lg:sticky lg:top-6">
                    <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-400">
                        결제 박스 영역
                    </div>
                </aside>
            </div>
        </main>
    );
}


export default ClassDetailPage;