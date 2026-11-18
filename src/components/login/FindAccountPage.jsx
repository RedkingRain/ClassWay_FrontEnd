import { useSearchParams } from 'react-router-dom';
import FindIdForm from './FindIdForm.jsx';
import PasswordResetForm from './PasswordResetForm.jsx';

function FindAccountPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // URL 쿼리 파라미터(?tab=id | ?tab=pass)에 따라 활성 탭 결정 (기본값: 'id')
    const tabParam = searchParams.get('tab');
    const activeTab = tabParam === 'pass' ? 'pass' : 'id';

    function handleTabChange(nextTab) {
        setSearchParams({ tab: nextTab }, { replace: true });
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <main className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                {/* 상단 탭 (아이디 찾기 / 비밀번호 찾기) */}
                <div className="mb-6 grid grid-cols-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => handleTabChange('id')}
                        className={`pb-3 text-center text-sm font-semibold transition-colors ${
                            activeTab === 'id'
                                ? 'border-b-2 border-brand text-gray-900'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        아이디 찾기
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('pass')}
                        className={`pb-3 text-center text-sm font-semibold transition-colors ${
                            activeTab === 'pass'
                                ? 'border-b-2 border-brand text-gray-900'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                {/* 탭별 컨텐츠 영역 */}
                {activeTab === 'id' ? <FindIdForm /> : <PasswordResetForm />}
            </main>
        </div>
    );
}

export default FindAccountPage;
