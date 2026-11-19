import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { API_BASE_URL } from '../../utils/auth.js';
import classwayLogo from '../../assets/classway-192-logo.svg';

// 이메일 인증번호 유효 시간 (3분 = 179초 -> 02:59부터 카운트다운)
const AUTH_CODE_SECONDS = 179;

function formatTimer(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
}

/**
 * 대한민국 휴대전화 번호 자동 하이픈 포맷터
 * - 입력값에서 숫자만 추출(최대 11자리)
 * - 화면 표시용 하이픈 포함 문자열 반환 (예: 010-1234-5678, 010-123-4567)
 */
function formatKoreanMobileDisplay(digits) {
    const cleaned = digits.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 3) {
        return cleaned;
    }
    if (cleaned.length <= 7) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, cleaned.length - 4)}-${cleaned.slice(cleaned.length - 4)}`;
}

/**
 * 대한민국 휴대전화 번호 유효성 검사 (숫자만 기준: 010XXXXXXXX 등 10~11자리)
 */
function isValidKoreanMobile(digits) {
    return /^01[016789]\d{7,8}$/.test(digits);
}

/**
 * 계정 가입 유형(provider)별 원형 로고 배지
 * - LOCAL: classway-192-logo.svg
 * - KAKAO / NAVER / GOOGLE: 각 플랫폼 공식 규격 SVG
 */
function ProviderBadge({ provider }) {
    const normalized = String(provider || 'LOCAL').toUpperCase();

    if (normalized === 'KAKAO') {
        return (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-label="카카오 계정">
                <circle cx="12" cy="12" r="11" fill="#FEE500" />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 6.5C8.96 6.5 6.5 8.44 6.5 10.83c0 1.55 1.03 2.91 2.61 3.67l-.66 2.43c-.06.22.19.41.38.28l2.89-1.93c.43.05.88.08 1.28.08 3.04 0 5.5-1.94 5.5-4.33C17.5 8.44 15.04 6.5 12 6.5z"
                    fill="#000000"
                />
            </svg>
        );
    }

    if (normalized === 'NAVER') {
        return (
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-label="네이버 계정">
                <circle cx="12" cy="12" r="11" fill="#03C75A" />
                <path
                    d="M13.68 12.37L10.05 7.42H7.36v9.16h2.86v-4.95l3.63 4.95h2.69V7.42h-2.86v4.95z"
                    fill="#FFFFFF"
                />
            </svg>
        );
    }

    if (normalized === 'GOOGLE') {
        return (
            <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white p-0.5"
                aria-label="구글 계정"
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                </svg>
            </span>
        );
    }

    // LOCAL (기본값): classway-192-logo.svg 원형 표시
    return (
        <img
            src={classwayLogo}
            alt="ClassWay 계정"
            className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
    );
}

function FindIdForm() {
    const navigate = useNavigate();

    // 입력 상태 (phoneDigits는 순수 숫자만 보관, 화면에는 formatKoreanMobileDisplay로 표시)
    const [name, setName] = useState('');
    const [phoneDigits, setPhoneDigits] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    // 단계 및 에러/모달 상태
    const [formError, setFormError] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isEmailSentModalOpen, setIsEmailSentModalOpen] = useState(false);
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);

    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [isCodeFailed, setIsCodeFailed] = useState(false);
    const [codeErrorMessage, setCodeErrorMessage] = useState('');

    // 이메일 조회 결과 목록([{ email, provider }, ...]) 및 미존재 모달 상태
    const [foundAccounts, setFoundAccounts] = useState([]);
    const [isUserNotFound, setIsUserNotFound] = useState(false);

    // 3분 타이머 카운트다운
    useEffect(() => {
        if (!showVerificationInput || foundAccounts.length > 0 || timerSeconds <= 0) return;

        const timerId = setInterval(() => {
            setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(timerId);
    }, [showVerificationInput, foundAccounts.length, timerSeconds]);

    // 전화번호 입력 핸들러 (숫자만 추출하여 저장)
    function handlePhoneChange(e) {
        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
        setPhoneDigits(onlyDigits);
        setFormError('');
        resetVerificationState();
    }

    // 입력값 변경 시 기존 인증 진행 상태 초기화
    function resetVerificationState() {
        setShowVerificationInput(false);
        setVerificationCode('');
        setTimerSeconds(0);
        setIsCodeFailed(false);
        setCodeErrorMessage('');
        setFoundAccounts([]);
        setIsUserNotFound(false);
    }

    // '다시 찾기' 클릭 시 전체 입력 폼 및 상태 모두 초기화
    function handleResetAllFields() {
        setName('');
        setPhoneDigits('');
        setEmail('');
        setFormError('');
        resetVerificationState();
    }

    // 입력값 검증
    function validateInputs() {
        if (!name.trim()) {
            setFormError('이름을 입력해 주세요.');
            return false;
        }
        if (!phoneDigits) {
            setFormError('전화번호를 입력해 주세요.');
            return false;
        }
        if (!isValidKoreanMobile(phoneDigits)) {
            setFormError('올바른 휴대전화 번호 형식을 입력해 주세요.');
            return false;
        }
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setFormError('본인 인증용 이메일을 입력해 주세요.');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setFormError('올바른 이메일 형식을 입력해 주세요.');
            return false;
        }
        return true;
    }

    /**
     * 인증번호 발송 및 재발송 (POST /auth/email_confirm_code_send)
     * - 회원 테이블 데이터와 무관하게 본인 확인용 이메일로 인증번호 발송
     */
    async function handleSendVerificationCode() {
        setFormError('');
        setCodeErrorMessage('');

        if (!validateInputs()) return;

        setIsSendingEmail(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/email_confirm_code_send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                setFormError(result.message || '인증번호 발송에 실패했습니다.');
                return;
            }

            setIsCodeFailed(false);
            setVerificationCode('');
            setFoundAccounts([]);
            setIsUserNotFound(false);
            setShowVerificationInput(true);
            setTimerSeconds(AUTH_CODE_SECONDS);
            setIsEmailSentModalOpen(true);
        } catch {
            setFormError('인증번호 발송 중 오류가 발생했습니다.');
        } finally {
            setIsSendingEmail(false);
        }
    }

    /**
     * 인증번호 확인 (POST /auth/email_code_check) 후
     * 성공 시 이어서 이메일 조회 API (POST /auth/find_email) 호출
     */
    async function handleVerifyAndFindEmail() {
        const trimmedCode = verificationCode.trim();
        if (!trimmedCode) {
            setCodeErrorMessage('인증번호를 입력해 주세요.');
            return;
        }

        if (timerSeconds <= 0) {
            setIsCodeFailed(true);
            setCodeErrorMessage('인증번호가 일치하지 않거나 만료되었습니다.');
            return;
        }

        setIsCheckingCode(true);
        setIsCodeFailed(false);
        setCodeErrorMessage('');
        setFormError('');

        try {
            // 1. 이메일 인증번호 확인
            const checkResponse = await fetch(`${API_BASE_URL}/auth/email_code_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    code: trimmedCode,
                }),
            });
            const checkResult = await checkResponse.json().catch(() => ({}));

            if (!checkResponse.ok || checkResult.success === false) {
                setIsCodeFailed(true);
                setCodeErrorMessage(
                    checkResult.message || '인증번호가 일치하지 않거나 만료되었습니다.'
                );
                return;
            }

            // 2. 인증 성공 시 가입된 이메일 조회 (전화번호는 하이픈 제외한 순수 숫자값 전달)
            const findResponse = await fetch(`${API_BASE_URL}/auth/find_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phoneDigits,
                }),
            });
            const findResult = await findResponse.json().catch(() => ({}));

            if (findResponse.status === 404 || !findResponse.ok || findResult.success === false) {
                setIsUserNotFound(true);
                return;
            }

            // 백엔드 응답 데이터({ data: { emails: [{ email, provider }] } }) 파싱
            const rawEmails = findResult.data?.emails;
            let parsedAccounts = [];

            if (Array.isArray(rawEmails)) {
                parsedAccounts = rawEmails
                    .filter((item) => item && item.email)
                    .map((item) => ({
                        email: item.email,
                        provider: String(item.provider || 'LOCAL').toUpperCase(),
                    }));
            } else if (typeof findResult.data === 'string' && findResult.data) {
                parsedAccounts = [{ email: findResult.data, provider: 'LOCAL' }];
            } else if (findResult.data?.email) {
                parsedAccounts = [
                    {
                        email: findResult.data.email,
                        provider: String(findResult.data.provider || 'LOCAL').toUpperCase(),
                    },
                ];
            }

            if (parsedAccounts.length === 0) {
                setIsUserNotFound(true);
                return;
            }

            setFoundAccounts(parsedAccounts);
        } catch {
            setFormError('이메일 조회 중 오류가 발생했습니다.');
        } finally {
            setIsCheckingCode(false);
        }
    }

    const inputClass =
        'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:bg-gray-100 disabled:text-gray-400';

    return (
        <div className="space-y-4">
            {/* 이름 입력칸 */}
            <div>
                <label htmlFor="find-id-name" className="mb-1.5 block text-sm font-medium text-gray-800">
                    이름
                </label>
                <input
                    id="find-id-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        setFormError('');
                        resetVerificationState();
                    }}
                    placeholder="이름을 입력하세요"
                    className={inputClass}
                />
            </div>

            {/* 전화번호 입력칸 (화면에는 자동 하이픈 표시, 내부/전송 값은 숫자만) */}
            <div>
                <label htmlFor="find-id-phone" className="mb-1.5 block text-sm font-medium text-gray-800">
                    전화번호
                </label>
                <input
                    id="find-id-phone"
                    type="tel"
                    inputMode="numeric"
                    value={formatKoreanMobileDisplay(phoneDigits)}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className={inputClass}
                />
            </div>

            {/* 본인 인증용 이메일 */}
            <div>
                <label htmlFor="find-id-email" className="mb-1.5 block text-sm font-medium text-gray-800">
                    본인 인증용 이메일
                </label>
                <div className="flex gap-2">
                    <input
                        id="find-id-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setFormError('');
                            resetVerificationState();
                        }}
                        placeholder="이메일을 입력하세요"
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={handleSendVerificationCode}
                        disabled={isSendingEmail}
                        className="h-11 shrink-0 rounded-lg border border-brand bg-white px-4 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSendingEmail ? '발송 중...' : '인증번호 발송'}
                    </button>
                </div>
            </div>

            {/* 인증번호 입력 영역 */}
            <div>
                <label htmlFor="find-id-code" className="mb-1.5 block text-sm font-medium text-gray-800">
                    인증번호
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            id="find-id-code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            disabled={!showVerificationInput || isSendingEmail || foundAccounts.length > 0}
                            value={verificationCode}
                            onChange={(e) => {
                                setVerificationCode(e.target.value.replace(/\D/g, ''));
                                setIsCodeFailed(false);
                                setCodeErrorMessage('');
                            }}
                            placeholder="인증번호 6자리"
                            className={`${inputClass} pr-16`}
                        />
                        {showVerificationInput && foundAccounts.length === 0 && (
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
                                {formatTimer(timerSeconds)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleVerifyAndFindEmail}
                        disabled={!showVerificationInput || isSendingEmail || isCheckingCode || foundAccounts.length > 0}
                        className="h-11 shrink-0 rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCheckingCode ? '확인 중...' : '인증'}
                    </button>
                </div>

                {!isCodeFailed && codeErrorMessage && (
                    <p className="mt-1.5 text-xs text-red-600">{codeErrorMessage}</p>
                )}
            </div>

            {/* 일반 폼 검증 에러 메시지 */}
            {formError && <p className="text-xs text-red-600">{formError}</p>}

            {/* 인증번호 발송 완료 팝업 */}
            {isEmailSentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
                        <p className="mb-5 text-sm font-medium text-gray-900">
                            인증번호 발송이 완료되었습니다.
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsEmailSentModalOpen(false)}
                            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* 1. 존재하지 않는 사용자 팝업 (메인으로 이동 + 다시 찾기) */}
            {isUserNotFound && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <p className="text-base font-bold text-gray-900">
                            존재하지 않는 사용자입니다.
                        </p>
                        <div className="mt-5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                            >
                                메인으로 이동
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAllFields}
                                className="h-10 flex-1 rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand/90"
                            >
                                다시 찾기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. 인증번호 불일치 및 만료 팝업 (메인으로 이동 + 인증번호 재발송) */}
            {isCodeFailed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <p className="text-base font-bold text-gray-900">
                            {codeErrorMessage || '인증번호가 일치하지 않거나 만료되었습니다.'}
                        </p>
                        <div className="mt-5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                disabled={isSendingEmail}
                                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                메인으로 이동
                            </button>
                            <button
                                type="button"
                                onClick={handleSendVerificationCode}
                                disabled={isSendingEmail}
                                className="h-10 flex-1 rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSendingEmail ? '재발송 중...' : '인증번호 재발송'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. 조회된 이메일(아이디) 목록 및 계정 provider 로고 표시 팝업 */}
            {foundAccounts.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <p className="mb-2 flex items-center gap-1 text-xs font-medium text-point">
                            <Check size={14} />
                            <span>인증이 완료되었습니다.</span>
                        </p>
                        <p className="mb-2.5 text-sm font-medium text-gray-700">가입된 아이디</p>
                        <ul className="space-y-2 rounded-xl bg-gray-50 p-3.5">
                            {foundAccounts.map((account, idx) => (
                                <li
                                    key={`${account.email}-${account.provider}-${idx}`}
                                    className="flex items-center gap-2 text-base font-bold text-gray-900"
                                >
                                    <ProviderBadge provider={account.provider} />
                                    <span className="break-all">{account.email}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90"
                        >
                            로그인하러 가기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FindIdForm;
