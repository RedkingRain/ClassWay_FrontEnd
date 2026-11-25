import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ClassDetailInfo from './ClassDetailInfo.jsx';
import ClassDetailTabs from './ClassDetailTabs.jsx';
import ClassBookingBox from './ClassBookingBox.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';

function ClassDetailPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    // 로그인 상태가 바뀌면 수강 중 여부(isEnrolled)가 달라져서 상세를 다시 받음
    const { user, isLoading: isAuthLoading } = useAuth();

    // 클래스 번호나 로그인한 사람이 바뀌면 이름표가 바뀌어서 다시 불러옴
    const requestKey = `${classId}:${user?.userId ?? 'guest'}`;

    const [loaded, setLoaded] = useState({ key: null, state: 'loading', detail: null });

    // 받아 둔 결과의 이름표가 지금과 다르면 아직 새 결과를 기다리는 중
    const loadState = loaded.key === requestKey ? loaded.state : 'loading';
    const detail = loaded.detail;

    useEffect(() => {
        // 새로고침 직후 로그인 복원이 끝난 뒤 토큰을 붙여 요청해야 isEnrolled가 정확함
        if (isAuthLoading) return;

        // 응답이 오기 전에 다른 클래스로 이동하면 늦게 온 예전 응답은 무시함
        let ignore = false;

        async function fetchDetail() {
            try {
                // 비로그인도 보는 화면이라 토큰 문제가 있어도 로그인 페이지로 보내지 않음
                const response = await authFetch(`/classes/${encodeURIComponent(classId)}`, {
                    silentAuthError: true,
                });
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                if (response.status === 404) {
                    // 없는 번호와 비공개 클래스는 404
                    setLoaded({ key: requestKey, state: 'notFound', detail: null });
                    return;
                }
                if (!response.ok || !result.success) {
                    setLoaded({ key: requestKey, state: 'error', detail: null });
                    return;
                }

                setLoaded({ key: requestKey, state: 'done', detail: result.data });
            } catch {
                // 서버가 꺼져 있는 등 서버에 닿지 못한 실패
                if (!ignore) setLoaded({ key: requestKey, state: 'error', detail: null });
            }
        }

        fetchDetail();

        return () => {
            ignore = true;
        };
    }, [classId, requestKey, isAuthLoading]);

    if (loadState === 'loading') {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center text-gray-400">
                불러오는 중...
            </main>
        );
    }

    // 없는 번호, 비공개 클래스, 서버 오류 화면 (와이어프레임 CLASS-001)
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
            <div className="aspect-[16/7] overflow-hidden rounded-xl bg-gray-100">
                {detail.thumbnailUrl && (
                    <img src={detail.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                )}
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
                <div>
                    <ClassDetailInfo key={detail.classId} detail={detail} />

                    <ClassDetailTabs detail={detail} />
                </div>

                <aside className="self-start lg:sticky lg:top-6">
                    <ClassBookingBox detail={detail} />
                </aside>
            </div>
        </main>
    );
}

export default ClassDetailPage;