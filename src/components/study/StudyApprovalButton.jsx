import { useState } from 'react';
import { authFetch } from '../../utils/auth.js';
import ConfirmModal from '../common/ConfirmModal.jsx';
import AlertModal from '../common/AlertModal.jsx';

// HIDDEN은 관리자 승인 뒤 강사가 아직 공개하지 않은 상태라 승인 완료로 봄
const STATUS_LABELS = {
    DRAFT: '클래스 승인 요청',
    PENDING: '승인 대기 중',
    HIDDEN: '승인 완료',
    PUBLISHED: '승인 완료',
    STOPPED: '판매 중지',
};

// 클래스 승인 요청 버튼, 누를 수 있는지는 화면이 정하지만 최종 확인은 서버가 함
function StudyApprovalButton({ classId, status, onRequested }) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const canRequest = status === 'DRAFT' && !isRequesting;

    async function requestApproval() {
        setIsConfirmOpen(false);
        setIsRequesting(true);
        try {
            const response = await authFetch(`/study/${encodeURIComponent(classId)}/approval-request`, {
                method: 'PATCH',
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                setErrorMessage(result.message || '승인 요청을 하지 못했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            onRequested();
        } catch {
            setErrorMessage('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsRequesting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={!canRequest}
                className="shrink-0 rounded-lg bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
                {isRequesting ? '요청 중…' : STATUS_LABELS[status]}
            </button>

            {isConfirmOpen && (
                <ConfirmModal
                    title="클래스 승인을 요청하시겠습니까?"
                    message="요청하면 관리자 확인 전까지 승인 대기 중으로 바뀝니다."
                    cancelLabel="취소"
                    confirmLabel="승인 요청"
                    onCancel={() => setIsConfirmOpen(false)}
                    onConfirm={requestApproval}
                />
            )}

            <AlertModal
                isOpen={errorMessage !== ''}
                title="승인 요청 실패"
                message={errorMessage}
                onClose={() => setErrorMessage('')}
            />
        </>
    );
}

export default StudyApprovalButton;
