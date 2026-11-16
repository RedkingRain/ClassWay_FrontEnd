import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClassDetailInfo from './ClassDetailInfo.jsx';
import ClassDetailTabs from './ClassDetailTabs.jsx';
import ClassBookingBox from './ClassBookingBox.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';

function ClassDetailPage() {
    // 주소 /classes/1 → classId = "1"
    const { classId } = useParams();
    // 뒤로가기 등 코드로 페이지 이동할 때 쓰는 도구
    const navigate = useNavigate();
    // 로그인 상태 — 바뀌면 상세를 다시 받아서 isEnrolled(수강 중인지)를 새로 반영
    const { user, isLoading: isAuthLoading } = useAuth();

    // 상세 API 응답 data
    const [detail, setDetail] = useState(null);
    // 불러오기 상태: loading(불러오는 중) / done(성공) / notFound(없는 클래스) / error(그 외 실패)
    const [loadState, setLoadState] = useState('loading');

    // 상세 API 호출 (GET /classes/{classId})
    useEffect(() => {
        // 새로고침 직후 로그인 복원 중이면 기다림 → 끝난 뒤 토큰을 붙여 요청해야 isEnrolled가 정확함
        if (isAuthLoading) return;

        // 응답이 오기 전에 다른 클래스로 이동하면, 늦게 온 예전 응답은 무시
        let ignore = false;
        setLoadState('loading');

        async function fetchDetail() {
            try {
                // authFetch: 로그인했으면 토큰을 자동으로 붙여줌 (팀 공용 함수)
                // silentAuthError: 비로그인도 보는 화면이라 토큰 문제가 있어도 로그인 페이지로 튕기지 않게
                const response = await authFetch(`/classes/${encodeURIComponent(classId)}`, {
                    silentAuthError: true,
                });
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                if (response.status === 404) {
                    setLoadState('notFound'); // 없는 번호 · 비공개 클래스
                    return;
                }
                if (!response.ok || !result.success) {
                    setLoadState('error');
                    return;
                }

                setDetail(result.data);
                setLoadState('done');
            } catch {
                // 서버가 꺼져 있는 등 요청 자체가 실패
                if (!ignore) setLoadState('error');
            }
        }

        fetchDetail();

        return () => {
            ignore = true;
        };
    }, [classId, isAuthLoading, user?.userId]);

    // 불러오는 중
    if (loadState === 'loading') {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center text-gray-400">
                불러오는 중...
            </main>
        );
    }

    // 없는 번호 · 비공개 클래스 (와이어프레임 CLASS-001) / 서버 오류
    if (loadState === 'notFound' || loadState === 'error') {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center">
                <p className="text-lg font-semibold text-gray-900">
                    {loadState === 'notFound'
                        ? '존재하지 않는 강의입니다.'
                        : '클래스 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
                </p>
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
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
                    <ClassDetailTabs detail={detail} />
                </div>

                {/* 4. 결제 박스 */}
                <aside className="self-start lg:sticky lg:top-6">
                    <ClassBookingBox detail={detail} />
                </aside>
            </div>
        </main>
    );
}

export default ClassDetailPage;