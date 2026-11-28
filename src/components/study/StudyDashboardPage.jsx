import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';
import { formatDateWithDay, formatDuration, formatTime, toDateKey } from '../../utils/format.js';
import StudyLectureList from './StudyLectureList.jsx';
import StudyPostTable from './StudyPostTable.jsx';
import StudyApprovalButton from './StudyApprovalButton.jsx';

// 응답이 올 때까지 화면 모양을 회색 상자로 미리 보여 줌
function StudyDashboardSkeleton() {
    return (
        <main role="status" aria-label="강의실 불러오는 중" className="mx-auto max-w-6xl animate-pulse px-4 py-10">
            <div className="mb-8 h-4 w-32 rounded bg-gray-200" />
            <div className="flex items-center gap-7">
                <div className="h-32 w-52 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="mt-3 h-7 w-2/3 rounded bg-gray-200" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
                </div>
            </div>
            <div className="mt-12 h-64 rounded-2xl bg-gray-200" />
            <div className="mt-8 h-48 rounded-2xl bg-gray-200" />
        </main>
    );
}

// 클래스 학습 대시보드 (STUDY-001), 구매한 회원, 클래스 주인 강사, 관리자만 서버가 보여 줌
function StudyDashboardPage() {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();

    // 클래스 번호나 로그인한 사람이 바뀌면 이름표가 바뀌어서 다시 불러옴
    const requestKey = `${classId}:${user?.userId ?? 'guest'}`;
    const [loaded, setLoaded] = useState({ key: null, state: 'loading', dashboard: null });
    const loadState = loaded.key === requestKey ? loaded.state : 'loading';
    const dashboard = loaded.dashboard;

    useEffect(() => {
        // 새로고침 직후 로그인 복원이 끝나야 토큰이 붙음
        if (isAuthLoading) return;

        if (!user) {
            navigate(`/login?returnUrl=${encodeURIComponent(`/study/${classId}`)}`, { replace: true });
            return;
        }

        // 응답이 오기 전에 다른 클래스로 이동하면 늦게 온 예전 응답은 무시함
        let ignore = false;

        async function fetchDashboard() {
            try {
                const response = await authFetch(`/study/${encodeURIComponent(classId)}`);
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                // 구매하지 않은 회원, 다른 강사는 상세 페이지로
                if (response.status === 403) {
                    navigate(`/classes/${encodeURIComponent(classId)}`, { replace: true });
                    return;
                }
                if (response.status === 404) {
                    setLoaded({ key: requestKey, state: 'notFound', dashboard: null });
                    return;
                }
                if (!response.ok || !result.success) {
                    setLoaded({ key: requestKey, state: 'error', dashboard: null });
                    return;
                }

                setLoaded({ key: requestKey, state: 'done', dashboard: result.data });
            } catch {
                // 서버가 꺼져 있는 등 서버에 닿지 못한 실패
                if (!ignore) setLoaded({ key: requestKey, state: 'error', dashboard: null });
            }
        }

        fetchDashboard();

        return () => {
            ignore = true;
        };
    }, [classId, user, isAuthLoading, requestKey, navigate]);

    if (loadState === 'loading') {
        return <StudyDashboardSkeleton />;
    }

    if (loadState === 'notFound' || loadState === 'error') {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center">
                <p className="text-lg font-semibold text-gray-900">
                    {loadState === 'notFound'
                        ? '존재하지 않는 강의입니다.'
                        : '강의실 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
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

    const isOnline = dashboard.classType === 'ONLINE';
    // 관리자는 수강 내역에서 들어오지 않아서 돌아갈 경로를 보여 주지 않음
    const isAdmin = user?.role === 'ADMIN';

    const lectures = dashboard.chapters.flatMap((chapter) => chapter.lectures);
    const totalMinutes = lectures.reduce((sum, lecture) => sum + lecture.durationMinutes, 0);
    // 총 약 3시간은 어색해서 총 3시간으로 씀 (상세 커리큘럼과 같은 방식)
    const totalText = formatDuration(totalMinutes).replace('약 ', '');

    // 오프라인: 남은 회차가 없거나 강사, 관리자면 nextScheduleAt이 null이라 날짜를 빼고 이어 붙임
    const offlineInfo = [
        `${dashboard.tutorNickname} 강사`,
        dashboard.nextScheduleAt &&
        `${formatDateWithDay(toDateKey(dashboard.nextScheduleAt))} ${formatTime(dashboard.nextScheduleAt)}`,
        dashboard.address,
    ]
        .filter(Boolean)
        .join(' | ');

    // 서버는 이미 PENDING으로 바뀌어서 다시 불러오지 않고 화면 값만 맞춤
    function handleApprovalRequested() {
        setLoaded({ ...loaded, dashboard: { ...dashboard, status: 'PENDING' } });
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-10">
            {/* 강사는 클래스 관리에서, 수강생은 예약·수강 내역(MY-002)에서 들어옴 */}
            {!isAdmin && (
                <nav aria-label="경로" className="mb-8 flex items-center gap-1 text-sm text-gray-500">
                    {dashboard.isTutor ? (
                        <Link to="/instructor/classes" className="hover:text-gray-800">클래스 관리</Link>
                    ) : (
                        <Link to="/my/classes" className="hover:text-gray-800">예약 · 수강 내역</Link>
                    )}
                    <ChevronRight size={14} />
                    <span className="text-gray-900">강의실</span>
                </nav>
            )}

            <div className="flex items-center gap-7">
                <div className="h-32 w-52 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {dashboard.thumbnailUrl && (
                        <img src={dashboard.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-sm text-gray-500">{isOnline ? '온라인 | VOD' : '오프라인 | 원데이'}</p>
                    <h1 className="mt-1 text-2xl font-semibold text-gray-900">{dashboard.title}</h1>
                    {isOnline ? (
                        <>
                            <p className="mt-2 text-sm text-gray-600">{dashboard.tutorNickname} 강사</p>
                            {lectures.length > 0 && (
                                <p className="mt-1 text-sm text-gray-600">
                                    CH {dashboard.chapters.length}개 | {lectures.length}강 | 총 {totalText}
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="mt-2 text-sm text-gray-600">{offlineInfo}</p>
                    )}
                </div>

                {dashboard.isTutor && (
                    <StudyApprovalButton
                        classId={dashboard.classId}
                        status={dashboard.status}
                        onRequested={handleApprovalRequested}
                    />
                )}
            </div>

            {/* 강의실 탭은 강사 화면에만 있음 (와이어프레임) */}
            {dashboard.isTutor && (
                <div className="mt-10 flex items-center justify-between border-b border-gray-200">
                    <span className="-mb-px flex h-12 w-[120px] items-center justify-center border-b-[3px] border-brand font-semibold text-gray-900">
                        강의실
                    </span>
                    {!isOnline && (
                        <Link
                            to={`/instructor/classes/${dashboard.classId}/schedules`}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            회차 · 예약자 관리 ›
                        </Link>
                    )}
                </div>
            )}

            <div className="mt-10 space-y-10">
                {isOnline && (
                    <StudyLectureList
                        classId={dashboard.classId}
                        chapters={dashboard.chapters}
                        isTutor={dashboard.isTutor}
                    />
                )}
                <StudyPostTable classId={dashboard.classId} posts={dashboard.posts} isTutor={dashboard.isTutor} />
            </div>
        </main>
    );
}

export default StudyDashboardPage;