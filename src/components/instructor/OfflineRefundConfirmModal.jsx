import { useEffect, useState } from 'react';

/**
 * 진행 예정 예약이 있는 오프라인 강의 비활성화 시 노출되는 선택지 모달
 */
function OfflineRefundConfirmModal({ isOpen, reservedCount, isSubmitting, onCancel, onConfirm }) {
    const [selectedOption, setSelectedOption] = useState('KEEP');

    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event) {
            if (event.key === 'Escape' && !isSubmitting) onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onCancel]);

    if (!isOpen) return null;

    return (
        <div
            onClick={!isSubmitting ? onCancel : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            >
                <h3 className="text-lg font-bold text-gray-900">
                    해당 강의를 비활성화 하시겠습니까?
                </h3>

                <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                    <p className="text-gray-700">
                        현재 진행 예정인 예약이 총 <strong className="text-point">{reservedCount}명</strong> 있습니다.
                        비활성화 시 처리 방식을 선택해 주세요.
                    </p>

                    <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3.5 border border-gray-200">
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-normal text-gray-800">
                            <input
                                type="radio"
                                name="offlineRefundOption"
                                value="KEEP"
                                checked={selectedOption === 'KEEP'}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                className="mt-0.5 accent-brand"
                            />
                            <span>
                                <strong>진행 예정인 회차 유지</strong>
                                <br />
                                <span className="text-gray-500">신규 예약만 중단되며 이미 잡힌 회차는 정상 진행됩니다.</span>
                            </span>
                        </label>
                        <label className="flex items-start gap-2.5 cursor-pointer text-xs leading-normal text-gray-800 pt-2 border-t border-gray-200">
                            <input
                                type="radio"
                                name="offlineRefundOption"
                                value="REFUND"
                                checked={selectedOption === 'REFUND'}
                                onChange={(e) => setSelectedOption(e.target.value)}
                                className="mt-0.5 accent-brand"
                            />
                            <span>
                                <strong className="text-red-600">진행 예정 회차 일괄 취소 및 전액 환불</strong>
                                <br />
                                <span className="text-gray-500">강사 귀책으로 진행 예정인 모든 예약이 즉시 100% 환불됩니다.</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="h-12 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selectedOption === 'REFUND')}
                        disabled={isSubmitting}
                        className="h-12 rounded-lg bg-brand text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
                    >
                        {isSubmitting ? '처리 중...' : '확인'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default OfflineRefundConfirmModal;
