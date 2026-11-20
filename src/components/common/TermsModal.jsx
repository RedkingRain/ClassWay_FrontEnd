import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { API_BASE_URL } from '../../utils/auth.js';

/**
 * 공통 약관 상세 보기 모달 (GET /terms/{terms_type})
 *
 * @param {object} props
 * @param {string | null} props.termsType - 조회할 약관 유형 코드 ('SERVICE' | 'PRIVACY' | 'MARKETING' | 'PAYMENT' 등, null이면 닫힘)
 * @param {() => void} props.onClose - 모달 닫기 콜백
 */
function TermsModal({ termsType, onClose }) {
    const [loaded, setLoaded] = useState({
        key: null,
        data: null,
        errorMessage: '',
    });

    // ESC 키로 닫기
    useEffect(() => {
        if (!termsType) return;

        function handleKeyDown(event) {
            if (event.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [termsType, onClose]);

    // termsType이 변경될 때마다 최신 약관 단건 조회
    useEffect(() => {
        if (!termsType) return;

        let ignore = false;

        async function fetchTerms() {
            try {
                // 비로그인/로그인 모두 호출 가능하므로 Authorization 헤더 없이 호출
                const response = await fetch(`${API_BASE_URL}/terms/${termsType}`);
                const result = await response.json().catch(() => ({}));

                if (ignore) return;

                if (!response.ok || !result.success || !result.data) {
                    setLoaded({
                        key: termsType,
                        data: null,
                        errorMessage: result.message || '해당하는 약관이 존재하지 않습니다.',
                    });
                    return;
                }

                setLoaded({
                    key: termsType,
                    data: result.data,
                    errorMessage: '',
                });
            } catch {
                if (!ignore) {
                    setLoaded({
                        key: termsType,
                        data: null,
                        errorMessage: '서버에서 오류가 발생했습니다.',
                    });
                }
            }
        }

        fetchTerms();

        return () => {
            ignore = true;
        };
    }, [termsType]);

    if (!termsType) return null;

    const isLoading = loaded.key !== termsType;
    const termsData = isLoading ? null : loaded.data;
    const errorMessage = isLoading ? '' : loaded.errorMessage;

    const modalTitle = isLoading
        ? '약관 불러오는 중...'
        : termsData?.title || '약관 안내';

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="terms-modal-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            >
                {/* 모달 헤더 (약관 제목 + 버전 + 닫기 아이콘) */}
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                        <h2
                            id="terms-modal-title"
                            className="text-base font-semibold text-gray-900"
                        >
                            {modalTitle}
                        </h2>
                        {termsData?.version && (
                            <p className="mt-0.5 text-[11px] text-gray-400">
                                버전 {termsData.version}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="닫기"
                        className="text-gray-400 hover:text-gray-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* 모달 본문 (로딩 / 에러 / 약관 내용) */}
                <div className="mb-5 max-h-72 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3.5 text-xs leading-relaxed text-gray-700">
                    {isLoading ? (
                        <p className="py-8 text-center text-gray-400">
                            약관 내용을 불러오는 중입니다...
                        </p>
                    ) : errorMessage ? (
                        <p className="py-8 text-center text-red-500">
                            {errorMessage}
                        </p>
                    ) : (
                        <div
                            className="whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(termsData?.content ?? ''),
                            }}
                        />
                    )}
                </div>

                {/* 하단 닫기 버튼 */}
                <button
                    type="button"
                    onClick={onClose}
                    className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-white hover:bg-brand/90"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}

export default TermsModal;
