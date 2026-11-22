import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';
import AdminSidebar from './AdminSidebar.jsx';
import TutorApplicationList from './TutorApplicationList.jsx';
import TutorApplicationDetail from './TutorApplicationDetail.jsx';

// 상태 탭 (countKey: 건수 API 응답에서 꺼낼 이름)
const STATUS_TABS = [
    { status: 'PENDING', label: '승인 대기', countKey: 'pending' },
    { status: 'APPROVED', label: '승인', countKey: 'approved' },
    { status: 'REJECTED', label: '반려', countKey: 'rejected' },
];

// 관리자 API 요청 (응답 { success, message, data })
// 실패하면 HTTP 상태(status)와 서버 message를 담은 에러를 던짐 → 화면에서 상태별로 다르게 처리
// 컴포넌트 밖에 둔 이유: 화면이 다시 그려질 때마다 함수를 새로 만들지 않게
async function requestAdminApi(path, options) {
    const response = await authFetch(path, options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        const error = new Error(result.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        error.status = response.status;
        throw error;
    }
    return result.data;
}

// 상세 자리에 띄우는 안내 (불러오는 중 · 실패)
function DetailMessage({ text }) {
    return (
        <div className="rounded-2xl border border-gray-200 px-8 py-24 text-center text-sm text-gray-400">
            {text}
        </div>
    );
}

// 화면 두 가지를 주소로 구분 (뒤로 가기 · 새로고침해도 같은 화면 유지)
//  - 목록 화면: /admin/tutors?status=PENDING
//  - 상세 화면: /admin/tutors?status=PENDING&tutorId=3  (목록에서 신청을 클릭하면 들어감)
function AdminTutorApprovalPage() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const isAdmin = user?.role === 'ADMIN';

    // ── 1. 관리자 확인 ──────────────────────────────
    // 새로고침 직후 로그인 복원(isAuthLoading)이 끝난 뒤에 판단
    // 개발 모드(StrictMode)에서 alert가 두 번 뜨지 않게 한 번만 안내
    const hasWarnedRef = useRef(false);
    useEffect(() => {
        if (isAuthLoading || isAdmin || hasWarnedRef.current) return;
        hasWarnedRef.current = true;
        alert('관리자만 접근할 수 있는 페이지입니다.');
        navigate('/', { replace: true });
    }, [isAuthLoading, isAdmin, navigate]);

    // ── 2. 주소에서 지금 탭 · 상세 번호 읽기 ──────────
    const [searchParams, setSearchParams] = useSearchParams();
    // 탭: 주소에 없거나 잘못된 값이면 승인 대기
    const statusParam = searchParams.get('status');
    const status = STATUS_TABS.some((tab) => tab.status === statusParam) ? statusParam : 'PENDING';
    // 상세 번호: 숫자일 때만 상세 화면, 없으면 목록 화면
    const tutorIdParam = searchParams.get('tutorId');
    const selectedId = /^\d+$/.test(tutorIdParam ?? '') ? Number(tutorIdParam) : null;
    const isListView = selectedId === null;

    // 목록에서 신청 클릭 → 상세 화면으로 (뒤로 가기 하면 목록으로 돌아옴)
    function openDetail(tutorId) {
        setSearchParams({ status, tutorId: String(tutorId) });
    }

    // 상세 → 목록 화면으로 (replace: 처리 후 뒤로 가기로 처리 끝난 상세가 다시 열리지 않게)
    function backToList({ replace = false } = {}) {
        setSearchParams({ status }, { replace });
    }

    // 1씩 늘리면 건수 · 목록 · 상세를 전부 다시 조회 (승인 · 반려 후, 오류 후)
    const [reloadKey, setReloadKey] = useState(0);
    const reload = () => setReloadKey((key) => key + 1);

    // ── 3. 탭 건수 (GET /admin/tutors/counts) ───────
    const [counts, setCounts] = useState(null); // { pending, approved, rejected }
    useEffect(() => {
        if (!isAdmin || !isListView) return; // 건수는 목록 화면에서만 보임
        let ignore = false; // 늦게 온 예전 응답 무시

        requestAdminApi('/admin/tutors/counts')
            .then((data) => {
                if (!ignore) setCounts(data);
            })
            .catch(() => {
                // 건수만 실패하면 탭 숫자를 예전 값 그대로 둠 (목록은 따로 안내)
            });

        return () => {
            ignore = true;
        };
    }, [isAdmin, isListView, reloadKey]);

    // ── 4. 신청 목록 (GET /admin/tutors?status=) ────
    // 지금 보여줘야 할 목록의 「이름표」 = 탭 + 새로고침 번호
    const listKey = `${status}:${reloadKey}`;
    const [loadedList, setLoadedList] = useState({ key: null, state: 'loading', items: [], message: '' });
    // 이름표가 다르면 = 아직 새 목록을 기다리는 중
    const listState = loadedList.key === listKey ? loadedList.state : 'loading';
    const items = listState === 'done' ? loadedList.items : [];

    useEffect(() => {
        if (!isAdmin || !isListView) return; // 목록 화면으로 올 때마다 최신 목록 조회
        let ignore = false;

        requestAdminApi(`/admin/tutors?status=${status}`)
            .then((data) => {
                if (!ignore) setLoadedList({ key: listKey, state: 'done', items: data, message: '' });
            })
            .catch((error) => {
                if (!ignore) setLoadedList({ key: listKey, state: 'error', items: [], message: error.message });
            });

        return () => {
            ignore = true;
        };
    }, [isAdmin, isListView, status, listKey]);

    // ── 5. 신청 상세 (GET /admin/tutors/{tutorId}) ──
    const detailKey = `${selectedId}:${reloadKey}`;
    const [loadedDetail, setLoadedDetail] = useState({ key: null, state: 'loading', data: null, message: '' });
    const detailState = loadedDetail.key === detailKey ? loadedDetail.state : 'loading';

    useEffect(() => {
        if (!isAdmin || selectedId === null) return; // 상세 화면일 때만 조회
        let ignore = false;

        requestAdminApi(`/admin/tutors/${selectedId}`)
            .then((data) => {
                if (!ignore) setLoadedDetail({ key: detailKey, state: 'done', data, message: '' });
            })
            .catch((error) => {
                if (ignore) return;
                // 404 신청서 없음: 안내 후 목록 화면으로 (목록 · 건수 새로 조회)
                if (error.status === 404) {
                    alert(error.message);
                    setSearchParams({ status }, { replace: true });
                    return;
                }
                // 403 등: 상세 자리에 message 표시
                setLoadedDetail({ key: detailKey, state: 'error', data: null, message: error.message });
            });

        return () => {
            ignore = true;
        };
    }, [isAdmin, selectedId, detailKey, status, setSearchParams]);

    // ── 6. 승인 · 반려 (PATCH) ──────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 상세 카드가 확인 팝업 뒤에 호출 → 성공하면 true (상세 카드가 입력칸을 비움)
    async function handleProcess(action, tutorId, rejectReason) {
        setIsSubmitting(true);
        try {
            if (action === 'approve') {
                await requestAdminApi(`/admin/tutors/${tutorId}/approve`, { method: 'PATCH' });
            } else {
                await requestAdminApi(`/admin/tutors/${tutorId}/reject`, {
                    method: 'PATCH',
                    body: JSON.stringify({ rejectReason }),
                });
            }
            // 성공: 목록 화면으로 돌아가서 건수 · 목록 다시 조회 → 처리한 신청이 목록에서 빠짐
            reload();
            backToList({ replace: true });
            return true;
        } catch (error) {
            alert(error.message);
            if (error.status === 404) {
                backToList({ replace: true }); // 신청서 없음 → 목록으로
            } else if (error.status === 400) {
                reload(); // 이미 처리됨 · 사유 오류 → 상세를 최신 상태로 다시 조회
            }
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    // 탭 클릭: 해당 상태 목록 조회 (같은 탭을 다시 누르면 새로고침)
    function handleTabClick(nextStatus) {
        if (nextStatus === status) {
            reload();
        } else {
            setSearchParams({ status: nextStatus }, { replace: true });
        }
    }

    // 로그인 복원 중이거나 관리자가 아니면 화면을 그리지 않음 (관리자 아니면 위에서 메인으로 이동)
    if (!isAdmin) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-32 text-center text-gray-400">
                {isAuthLoading ? '불러오는 중...' : ''}
            </main>
        );
    }

    // 상세 화면에 보여줄 내용
    let detailContent = null;
    if (!isListView) {
        if (detailState === 'loading') {
            detailContent = <DetailMessage text="불러오는 중..." />;
        } else if (detailState === 'error') {
            detailContent = <DetailMessage text={loadedDetail.message} />;
        } else {
            detailContent = (
                // key: 다른 신청으로 바뀌면 반려 사유 입력칸 · 팝업이 새로 시작되게
                <TutorApplicationDetail
                    key={selectedId}
                    detail={loadedDetail.data}
                    isSubmitting={isSubmitting}
                    onProcess={handleProcess}
                />
            );
        }
    }

    return (
        <main className="mx-auto flex max-w-6xl gap-12 px-4 py-10">
            {/* 왼쪽: 관리자 메뉴 */}
            <AdminSidebar adminName={user.name} />

            <section className="min-w-0 flex-1">
                {/* 1. 제목 */}
                <h1 className="text-2xl font-bold text-gray-900">강사 승인</h1>
                <p className="mt-3 text-sm text-gray-500">
                    강사 신청자의 정보와 제출 자료를 확인하고 승인 또는 반려합니다.
                </p>

                {isListView ? (
                    // 2-1. 목록 화면: 상태 탭 + 신청 목록
                    <>
                        {/* 상태 탭 (선택된 탭은 진한 초록) */}
                        <div role="tablist" aria-label="신청 상태" className="mt-6 flex gap-2">
                            {STATUS_TABS.map((tab) => {
                                const isActive = tab.status === status;
                                return (
                                    <button
                                        key={tab.status}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => handleTabClick(tab.status)}
                                        className={`h-10 rounded-full border px-4 text-sm transition ${
                                            isActive
                                                ? 'border-brand bg-brand text-white'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {tab.label} {counts ? counts[tab.countKey] : ''}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6">
                            <TutorApplicationList
                                listState={listState}
                                items={items}
                                errorMessage={loadedList.message}
                                onSelect={openDetail}
                                onRetry={reload}
                            />
                        </div>
                    </>
                ) : (
                    // 2-2. 상세 화면: 목록으로 돌아가기 + 상세 카드
                    <>
                        <button
                            type="button"
                            onClick={() => backToList()}
                            className="mt-6 flex items-center gap-1 text-sm text-gray-600 transition hover:text-gray-900"
                        >
                            <ChevronLeft size={16} />
                            목록으로
                        </button>
                        <div className="mt-4">{detailContent}</div>
                    </>
                )}
            </section>
        </main>
    );
}

export default AdminTutorApprovalPage;
