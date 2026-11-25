import { useEffect, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';
import { ClassListSkeleton } from './ClassCardSkeleton.jsx';
import InstructorClassCard from './InstructorClassCard.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import OfflineRefundConfirmModal from './OfflineRefundConfirmModal.jsx';
import AlertModal from '../common/AlertModal.jsx';

const PAGE_SIZE = 6;

function InstructorClassListPage() {
    const { tutorStatus } = useOutletContext() || {};
    const isApproved = tutorStatus === 'APPROVED';

    const [searchParams, setSearchParams] = useSearchParams();
    const pageParam = parseInt(searchParams.get('page') || '0', 10);
    const currentPage = isNaN(pageParam) || pageParam < 0 ? 0 : pageParam;

    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    const [classData, setClassData] = useState({
        totalCount: 0,
        totalPages: 0,
        currentPage: 0,
        classes: [],
    });

    const [pendingTarget, setPendingTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '에러가 발생하였습니다.',
        message: '',
    });

    useEffect(() => {
        if (!isApproved) {
            return;
        }

        let ignore = false;

        authFetch(`/tutor/classes?page=${currentPage}&size=${PAGE_SIZE}`)
            .then(async (response) => {
                const result = await response.json().catch(() => ({}));
                if (ignore) return;
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '클래스 목록을 불러오지 못했습니다.');
                }
                setClassData(result.data || { totalCount: 0, totalPages: 0, currentPage: 0, classes: [] });
                setFetchError(false);
                setIsLoading(false);
            })
            .catch((error) => {
                if (ignore) return;
                setFetchError(true);
                setIsLoading(false);
                setAlertState({
                    isOpen: true,
                    title: '목록 조회 실패',
                    message: error.message,
                });
            });

        return () => {
            ignore = true;
        };
    }, [currentPage, isApproved, reloadKey]);

    // 승인되지 않은 강사 전용 화면 처리
    // TODO: 추후 TutorPendingView 컴포넌트 개발 시 아래 반환부를 <TutorPendingView status={tutorStatus} /> 로 교체
    if (!isApproved) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-center shadow-sm">
                <p className="text-lg font-bold text-gray-900">
                    {tutorStatus === 'REJECTED' ? '강사 신청이 반려되었습니다' : '강사 승인 심사가 진행 중입니다'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    관리자 승인이 완료된 후 클래스를 등록하고 운영할 수 있습니다.
                </p>
            </div>
        );
    }

    function handleToggleClick(item) {
        if (!item.canToggle || item.status === 'DRAFT' || item.status === 'PENDING' || item.status === 'STOPPED') {
            return;
        }
        const nextStatus = item.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
        setPendingTarget({ item, nextStatus });
    }

    async function executeStatusChange(refundUpcomingReservations) {
        if (!pendingTarget) return;
        const { item, nextStatus } = pendingTarget;
        setIsSubmitting(true);

        try {
            const bodyData = { status: nextStatus };
            if (refundUpcomingReservations !== undefined) {
                bodyData.refundUpcomingReservations = refundUpcomingReservations;
            }

            const response = await authFetch(`/tutor/${item.classId}/status`, {
                method: 'PATCH',
                body: JSON.stringify(bodyData),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                throw new Error(result.message || '상태 변경 중 오류가 발생하였습니다.');
            }

            // 로컬 상태 즉시 반영
            setClassData((prev) => ({
                ...prev,
                classes: prev.classes.map((c) =>
                    c.classId === item.classId ? { ...c, status: nextStatus } : c
                ),
            }));

            setPendingTarget(null);
        } catch (error) {
            setPendingTarget(null);
            setAlertState({
                isOpen: true,
                title: '에러가 발생하였습니다.',
                message: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    function handlePageChange(newPage) {
        setIsLoading(true);
        setFetchError(false);
        setSearchParams({ page: String(newPage) });
    }

    const { totalCount, totalPages, classes } = classData;
    const isEmpty = !isLoading && !fetchError && classes.length === 0;

    const isTargetOfflineWithReservations =
        pendingTarget &&
        pendingTarget.nextStatus === 'HIDDEN' &&
        pendingTarget.item.classType === 'OFFLINE' &&
        (pendingTarget.item.offlineInfo?.reservedCount || 0) > 0;

    function getConfirmContent() {
        if (!pendingTarget) return { title: '', message: '' };
        const { item, nextStatus } = pendingTarget;

        if (nextStatus === 'PUBLISHED') {
            return {
                title: '해당 강의를 오픈 하시겠습니까?',
                message: '오픈하면 수강생이 클래스를 보고 예약할 수 있습니다.',
            };
        }

        if (item.classType === 'ONLINE') {
            return {
                title: '해당 강의를 비활성화 하시겠습니까?',
                message: '비활성화하면 검색과 목록에서 숨겨지고 새 수강생을 받지 않습니다.\n(기존 유료 수강생은 계속 시청 가능하며, 무료 강좌는 즉시 수강이 중단됩니다.)',
            };
        }

        return {
            title: '해당 강의를 비활성화 하시겠습니까?',
            message: '비활성화하면 검색과 목록에서 숨겨지고 새 예약을 받을 수 없습니다.',
        };
    }

    const confirmContent = getConfirmContent();

    return (
        <div>
            {/* 상단 타이틀 */}
            <h1 className="text-xl font-bold text-gray-900">클래스 관리</h1>
            <p className="mt-1 text-xs text-gray-500">
                내가 등록한 클래스를 관리합니다. 클래스를 누르면 오프라인은 회차·예약자 관리, 온라인은 강의실로 이동합니다.
            </p>

            {/* 상단 카운트 및 등록 버튼 */}
            {!isEmpty && !fetchError && (
                <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">
                        전체 <span className="text-point">{totalCount}</span>개
                    </p>
                    <Link
                        to="/instructor/classes/new"
                        className="flex h-9 items-center gap-1 rounded-lg bg-brand px-3.5 text-xs font-semibold text-white transition hover:bg-brand/90"
                    >
                        <Plus size={14} />
                        클래스 등록
                    </Link>
                </div>
            )}

            {/* 카드 목록 / 스켈레톤 / 에러 재시도 / 빈 목록 */}
            <div className="mt-4">
                {isLoading ? (
                    <ClassListSkeleton />
                ) : fetchError ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center shadow-sm">
                        <p className="text-base font-semibold text-gray-800">클래스 목록을 불러오지 못했습니다</p>
                        <p className="mt-1 text-xs text-gray-500">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLoading(true);
                                setFetchError(false);
                                setReloadKey((k) => k + 1);
                            }}
                            className="mt-4 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 transition cursor-pointer"
                        >
                            다시 시도
                        </button>
                    </div>
                ) : isEmpty ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-24 text-center">
                        <p className="text-base font-medium text-gray-700">아직 등록한 클래스가 없습니다</p>
                        <p className="mt-1 text-xs text-gray-400">새로운 지식과 경험을 수강생들과 나누어 보세요.</p>
                        <Link
                            to="/instructor/classes/new"
                            className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                        >
                            첫 클래스 등록하기
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {classes.map((item) => (
                            <InstructorClassCard
                                key={item.classId}
                                item={item}
                                onToggleClick={handleToggleClick}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 페이지네이션 */}
            {!isLoading && !fetchError && totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="rounded px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                        &lt; 이전
                    </button>
                    {Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => handlePageChange(idx)}
                            className={`h-7 w-7 rounded text-xs font-semibold transition ${
                                currentPage === idx
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="rounded px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                        다음 &gt;
                    </button>
                </div>
            )}

            {/* 1. 일반 확인 모달 (ConfirmModal 재사용) */}
            {pendingTarget && !isTargetOfflineWithReservations && (
                <ConfirmModal
                    title={confirmContent.title}
                    message={confirmContent.message}
                    cancelLabel="취소"
                    confirmLabel="확인"
                    onCancel={() => setPendingTarget(null)}
                    onConfirm={() => executeStatusChange(undefined)}
                />
            )}

            {/* 2. 오프라인 예약자 존재 시 라디오 선택 모달 */}
            {isTargetOfflineWithReservations && (
                <OfflineRefundConfirmModal
                    isOpen={true}
                    reservedCount={pendingTarget.item.offlineInfo?.reservedCount || 0}
                    isSubmitting={isSubmitting}
                    onCancel={() => setPendingTarget(null)}
                    onConfirm={(refund) => executeStatusChange(refund)}
                />
            )}

            {/* 3. 에러 알림 모달 */}
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState({ isOpen: false, title: '', message: '' })}
            />
        </div>
    );
}

export default InstructorClassListPage;
