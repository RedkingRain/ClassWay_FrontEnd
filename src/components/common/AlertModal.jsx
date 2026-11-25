import { useEffect } from 'react';

/**
 * 단일 확인/닫기 버튼 알림 팝업 (에러 안내용)
 * @param {boolean} isOpen
 * @param {string} title 굵은 제목 (기본값: '에러가 발생하였습니다.')
 * @param {string} message 에러 상세 메시지
 * @param {function} onClose 닫기 버튼, ESC, 바깥 클릭 시 실행
 */
function AlertModal({ isOpen, title = '에러가 발생하였습니다.', message, onClose }) {
    useEffect(() => {
        if (!isOpen) return;
        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
            <div
                role="alertdialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            >
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                    {message}
                </p>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        autoFocus
                        className="h-12 w-full rounded-lg bg-brand text-sm font-medium text-white transition hover:bg-brand/90"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AlertModal;
