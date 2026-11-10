import { useParams, useNavigate } from 'react-router-dom';
import ClassDetailInfo from './ClassDetailInfo.jsx';
import { mockClassDetails } from '../../mocks/classDetailData.js';

function ClassDetailPage() {
    // 주소 /classes/1 → classId = "1"
    const { classId } = useParams();
    // 뒤로가기 등 코드로 페이지 이동할 때 쓰는 도구
    const navigate = useNavigate();

    // 가짜 데이터에서 찾기 (나중에 API 호출로 교체)
    const detail = mockClassDetails[classId];

    // 없는 번호 = 비공개·삭제된 클래스와 같은 화면 (와이어프레임 CLASS-001)
    if (!detail) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center">
                <p className="text-lg font-semibold text-gray-900">존재하지 않는 강의입니다.</p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-5 rounded-lg bg-[#133621] px-5 py-2.5 text-sm font-medium text-white hover:bg-green-950"
                >
                    이전 페이지로
                </button>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            {/* 1. 대표 이미지 (영상 재생은 추후) */}
            <div className="aspect-[16/7] overflow-hidden rounded-xl bg-gray-100">
                {detail.thumbnailUrl && (
                    <img src={detail.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
                <div>
                    {/* 2. 상세 정보 */}
                    <ClassDetailInfo detail={detail} />

                    {/* 3. 탭 */}
                    <section className="mt-8 rounded-lg border border-dashed border-gray-300 p-6 text-gray-400">
                        탭 영역 (강의 소개 / 커리큘럼 / 수강평 / Q&A)
                    </section>
                </div>

                {/* 4. 결제 박스 */}
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