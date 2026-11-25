import { useNavigate } from 'react-router-dom';
import { Construction } from 'lucide-react';

/**
 * 미개발/준비 중인 페이지를 위한 공통 안내 컴포넌트
 *
 * @param {string} title 상단 제목 (기본값: '페이지 준비 중')
 * @param {string} description 안내 본문 문구 (줄바꿈 가능)
 * @param {boolean} showBackButton 이전 버튼 노출 여부 (기본값: true)
 * @param {string} backLabel 버튼 텍스트 (기본값: '이전 화면으로 돌아가기')
 * @param {function} onBack 직접 정의할 뒤로가기 핸들러 (미전달 시 navigate(-1) 실행)
 */
function ReadyNotice({
    title = '페이지 준비 중',
    description = '현재 기능을 준비하고 있습니다. 잠시만 기다려 주세요.',
    showBackButton = true,
    backLabel = '이전 화면으로 돌아가기',
    onBack,
}) {
    const navigate = useNavigate();

    function handleBack() {
        if (onBack) {
            onBack();
        } else {
            navigate(-1); // 브라우저 이전 화면으로 이동
        }
    }

    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 px-4 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <Construction size={28} />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500 whitespace-pre-line leading-relaxed">
                {description}
            </p>
            {showBackButton && (
                <button
                    type="button"
                    onClick={handleBack}
                    className="mt-6 rounded-lg bg-brand px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand/90 transition cursor-pointer"
                >
                    {backLabel}
                </button>
            )}
        </div>
    );
}

export default ReadyNotice;
