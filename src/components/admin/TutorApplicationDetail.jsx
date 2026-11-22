import { useState } from 'react';
import { FileText } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal.jsx';
import TutorStatusBadge from './TutorStatusBadge.jsx';
import { authFetch } from '../../utils/auth.js';
import { formatDate } from '../../utils/format.js';

const REJECT_REASON_MAX = 255; // 서버 검증과 같은 최대 글자 수

// 새 창에서 바로 보여줄 파일 종류 (스크립트를 담을 수 없는 이미지 · PDF만)
// html · svg 등은 안에 코드가 들어 있을 수 있어 새 창에 띄우지 않고 다운로드
const PREVIEW_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function canPreview(fileType) {
    return PREVIEW_TYPES.includes(fileType);
}

// 라벨 + 값 한 줄 (연락처 · 신청일 · 처리일 등)
function InfoRow({ label, children }) {
    return (
        <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900">{children}</dd>
        </div>
    );
}

// detail: 상세 API 응답 data
// isSubmitting: 승인 · 반려 요청 중인지 (버튼 비활성화용)
// onProcess(action, tutorId, rejectReason): 페이지가 실제 요청을 보냄 → 성공하면 true
// 페이지에서 key={tutorId}로 그려서, 다른 신청을 고르면 입력칸 · 팝업 상태가 새로 시작됨
function TutorApplicationDetail({ detail, isSubmitting, onProcess }) {
    // 반려 사유 입력값, 비어 있을 때 안내 문구
    const [rejectReason, setRejectReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    // 확인 팝업: null(닫힘) / 'approve' / 'reject'
    const [confirmAction, setConfirmAction] = useState(null);
    // 지금 여는 중인 파일 번호 (중복 클릭 방지)
    const [openingFileId, setOpeningFileId] = useState(null);

    const isPending = detail.approvalStatus === 'PENDING';

    // 경력: 줄바꿈 기준으로 나누고 빈 줄 · 앞에 붙은 「·」「-」 제거
    const careerLines = (detail.career ?? '')
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^[·•-]\s*/, ''))
        .filter(Boolean);

    // 반려 버튼: 사유가 비어 있으면 요청하지 않고 입력칸 아래에 안내
    function handleRejectClick() {
        if (!rejectReason.trim()) {
            setRejectError('반려 사유를 입력해 주세요.');
            return;
        }
        setConfirmAction('reject');
    }

    // 팝업에서 확인 → 페이지에 요청 맡기기 → 성공하면 입력칸 비우기
    async function handleConfirm() {
        const action = confirmAction;
        setConfirmAction(null);
        const isSuccess = await onProcess(action, detail.tutorId, rejectReason.trim());
        if (isSuccess) {
            setRejectReason('');
            setRejectError('');
        }
    }

    // 제출 자료 열기
    // <a href>로는 토큰이 안 실려서, authFetch로 받은 파일을 새 창에 띄움
    async function handleOpenFile(file) {
        // 응답을 기다린 뒤 창을 열면 팝업 차단에 걸려서, 클릭 순간 빈 창부터 엶
        const newWindow = window.open('', '_blank');
        setOpeningFileId(file.fileId);

        try {
            const response = await authFetch(`/admin/tutors/${detail.tutorId}/files/${file.fileId}`);
            if (!response.ok) {
                // 실패 응답만 JSON (성공은 파일 바이너리)
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || '파일을 열지 못했습니다.');
            }

            const blob = await response.blob();
            const fileUrl = URL.createObjectURL(blob);

            if (canPreview(blob.type)) {
                // 이미지 · PDF: 미리 연 새 창에 띄우기
                if (newWindow) {
                    newWindow.location.href = fileUrl;
                } else {
                    window.open(fileUrl, '_blank'); // 빈 창이 막혔으면 한 번 더 시도
                }
            } else {
                // 못 여는 형식: 빈 창은 닫고, 원래 파일명으로 다운로드
                newWindow?.close();
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = file.fileName; // 상세 API로 받은 원래 파일명
                link.click();
            }
            // 새 창 · 다운로드가 파일을 읽을 시간을 준 뒤 임시 주소 정리 (메모리 해제)
            setTimeout(() => URL.revokeObjectURL(fileUrl), 60 * 1000);
        } catch (error) {
            newWindow?.close(); // 실패하면 미리 연 빈 창 닫기
            alert(error.message);
        } finally {
            setOpeningFileId(null);
        }
    }

    return (
        <div className="rounded-2xl border border-gray-200 p-8">
            {/* 1. 프로필 (사진 API가 없어 회색 원만) + 이름 · 이메일 + 상태 */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="h-14 w-14 shrink-0 rounded-full bg-gray-200" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-gray-900">{detail.name}</p>
                    <p className="truncate text-sm text-gray-500">{detail.email}</p>
                </div>
                <TutorStatusBadge status={detail.approvalStatus} />
            </div>

            {/* 2. 기본 정보 */}
            <dl className="mt-6 space-y-4">
                <InfoRow label="연락처">{detail.phone || '-'}</InfoRow>
                <InfoRow label="신청일">{formatDate(detail.appliedAt)}</InfoRow>
            </dl>

            {/* 3. 강사 경력 */}
            <section className="mt-8">
                <h2 className="text-sm font-semibold text-gray-900">강사 경력</h2>
                <div className="mt-3 rounded-xl bg-gray-50 px-5 py-4 text-sm text-gray-800">
                    {careerLines.length > 0 ? (
                        <ul className="space-y-2">
                            {careerLines.map((line, index) => (
                                <li key={index}>· {line}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">등록된 경력이 없습니다.</p>
                    )}
                </div>
            </section>

            {/* 4. 제출 자료 (이미지 · PDF는 새 창, 그 외는 다운로드) */}
            <section className="mt-8">
                <h2 className="text-sm font-semibold text-gray-900">제출 자료</h2>
                {detail.files.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {detail.files.map((file) => (
                            <button
                                key={file.fileId}
                                type="button"
                                onClick={() => handleOpenFile(file)}
                                disabled={openingFileId !== null}
                                className="flex max-w-full items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                <FileText size={16} className="shrink-0" />
                                <span className="truncate">
                                    {openingFileId === file.fileId ? '여는 중...' : file.fileName}
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="mt-3 text-sm text-gray-400">제출한 자료가 없습니다.</p>
                )}
            </section>

            <div className="my-8 border-t border-gray-100" />

            {isPending ? (
                // 5-1. 승인 대기: 반려 사유 입력 + 반려 · 승인 버튼
                <section>
                    <label htmlFor="reject-reason" className="text-sm font-semibold text-gray-900">
                        반려 사유 <span className="ml-1 text-xs font-normal text-gray-400">반려 시 필수</span>
                    </label>
                    <textarea
                        id="reject-reason"
                        rows={4}
                        maxLength={REJECT_REASON_MAX}
                        value={rejectReason}
                        onChange={(event) => {
                            setRejectReason(event.target.value);
                            if (rejectError) setRejectError(''); // 다시 입력하면 안내 지우기
                        }}
                        placeholder="신청자에게 전달될 반려 사유를 입력하세요"
                        aria-invalid={rejectError ? 'true' : undefined}
                        className={`mt-3 w-full resize-none rounded-lg border px-4 py-3 text-sm outline-none focus:border-brand ${
                            rejectError ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {/* 안내 문구(왼쪽) + 글자 수(오른쪽) */}
                    <div className="mt-1 flex justify-between text-xs">
                        <p className="text-red-600">{rejectError}</p>
                        <p className="text-gray-400">{rejectReason.length}/{REJECT_REASON_MAX}</p>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleRejectClick}
                            disabled={isSubmitting}
                            className="h-12 w-32 rounded-lg border border-red-500 bg-white text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                            반려
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmAction('approve')}
                            disabled={isSubmitting}
                            className="h-12 w-32 rounded-lg bg-brand text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                        >
                            {isSubmitting ? '처리 중...' : '승인'}
                        </button>
                    </div>
                </section>
            ) : (
                // 5-2. 승인 · 반려 완료: 버튼 대신 처리 결과
                <section>
                    <h2 className="text-sm font-semibold text-gray-900">처리 결과</h2>
                    <dl className="mt-3 space-y-3 rounded-xl bg-gray-50 px-5 py-4">
                        <InfoRow label="처리 상태">
                            <TutorStatusBadge status={detail.approvalStatus} />
                        </InfoRow>
                        <InfoRow label="처리일">
                            {detail.approvedAt ? formatDate(detail.approvedAt) : '-'}
                        </InfoRow>
                        {detail.approvalStatus === 'REJECTED' && (
                            <InfoRow label="반려 사유">
                                <span className="whitespace-pre-line">{detail.rejectReason || '-'}</span>
                            </InfoRow>
                        )}
                    </dl>
                </section>
            )}

            {/* 승인 · 반려 전 한 번 더 확인 */}
            {confirmAction && (
                <ConfirmModal
                    message={
                        confirmAction === 'approve'
                            ? `${detail.name}님의 강사 신청을 승인할까요?\n승인하면 강사 권한이 부여됩니다.`
                            : `${detail.name}님의 강사 신청을 반려할까요?`
                    }
                    confirmLabel={confirmAction === 'approve' ? '승인' : '반려'}
                    onCancel={() => setConfirmAction(null)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
}

export default TutorApplicationDetail;
