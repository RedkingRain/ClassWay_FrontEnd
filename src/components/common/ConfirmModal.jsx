import {useEffect} from "react";

/**
 * 공통 확인 팝업 — 화면 가운데 작은 창 + 버튼 2개 (피그마 CLASS-002 · CLASS-003 팝업 모양)
 *
 * message       안내 문구 (\n 넣으면 줄바꿈)
 * cancelLabel   왼쪽 흰 버튼 글자 (기본 '닫기')
 * confirmLabel  오른쪽 초록 버튼 글자
 * onCancel      닫기 · 바깥 클릭 · ESC 때 실행
 * onConfirm     초록 버튼 눌렀을 때 실행
 *
 * 사용 예)
 *  {isOpen && (
 *    <ConfirmModal message="로그인 후 이용 가능한 기능입니다." confirmLabel="로그인하기"
 *                  onCancel={() => setIsOpen(false)} onConfirm={() => navigate('/login')} />
 *  )}
 */

function ConfirmModal({message, cancelLabel= '닫기', confirmLabel,
                      onCancel, onConfirm}) {
    // ESC 키로 닫기 (팝업이 떠 있는 동안 감시)
    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        // 화면 전체를 덮는 어두운 배경 - 누르면 닫힘
        <div
            onClick={onCancel}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
            {/*팝업 창 - 안쪽을 눌렀을 때는 닫히지 않게*/}
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-message"
            onClick={(event) => event.stopPropagation()}
            className={"w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl"}
        >
            <p
                id="confirm-modal-message"
                className="whitespace-pre-line text-lg font-semibold leading-relaxed text-gray-900"
            >
                {message}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-12 rounded-lg border border-gray-300 bg-white text-sm text-gray-800 transition hover:bg-gray-50"
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    autoFocus
                    className="h-12 rounded-lg bg-brand text-sm font-medium text-white transition hover:bg-brand/90"
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
        </div>
    );
}

export default ConfirmModal;