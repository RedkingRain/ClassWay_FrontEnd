import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../../utils/auth.js';

// 이메일 인증번호 유효 시간 (3분 = 179초 -> 02:59부터 카운트다운)
const AUTH_CODE_SECONDS = 179;

function formatTimer(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
}

/**
 * 비밀번호 규칙 검증 함수
 * - 영문 8~12자
 * - 숫자 2~4자
 * - 특수기호 1자 이상 포함
 * - 공백 없이 총 12자 이상
 */
function validatePasswordRule(pw) {
    if (!pw || /\s/.test(pw) || pw.length < 12) {
        return false;
    }
    const letterCount = (pw.match(/[a-zA-Z]/g) || []).length;
    const digitCount = (pw.match(/[0-9]/g) || []).length;
    const specialCount = (pw.match(/[^a-zA-Z0-9\s]/g) || []).length;

    return (
        letterCount >= 8 &&
        letterCount <= 12 &&
        digitCount >= 2 &&
        digitCount <= 4 &&
        specialCount >= 1
    );
}

/**
 * 비밀번호 초기화 / 변경 공통 폼 컴포넌트
 * - 계정 찾기 페이지(/login/find_account?tab=pass)뿐만 아니라
 *   추후 마이페이지 회원정보 수정에서도 탭 없이 단독으로 재사용 가능
 *
 * @param {object} props
 * @param {string} [props.defaultEmail] - 마이페이지 등에서 기본 이메일을 주입할 때 사용
 * @param {function} [props.onSuccess] - 비밀번호 변경 완료 후 커스텀 후처리가 필요할 때 호출 (미지정 시 /login으로 이동)
 */
function PasswordResetForm({ defaultEmail = '', onSuccess }) {
    const navigate = useNavigate();

    // 이메일 및 인증번호 상태
    const [email, setEmail] = useState(defaultEmail);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifiedCode, setVerifiedCode] = useState('');

    // 새 비밀번호 입력 상태
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);

    // 인증 진행 상태 및 타이머
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // 로딩 상태
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 에러 및 안내 모달 상태
    const [emailError, setEmailError] = useState('');
    const [isCodeFailed, setIsCodeFailed] = useState(false);
    const [codeErrorMessage, setCodeErrorMessage] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [isEmailSentModalOpen, setIsEmailSentModalOpen] = useState(false);
    const [socialAccountModalMessage, setSocialAccountModalMessage] = useState('');
    const [isUserNotFound, setIsUserNotFound] = useState(false);
    const [resetSuccessMessage, setResetSuccessMessage] = useState('');

    // 3분 타이머 카운트다운
    useEffect(() => {
        if (!showVerificationInput || isEmailVerified || timerSeconds <= 0) return;

        const timerId = setInterval(() => {
            setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(timerId);
    }, [showVerificationInput, isEmailVerified, timerSeconds]);

    // 비밀번호 규칙 및 일치 여부 실시간 계산
    const isPasswordRuleValid = validatePasswordRule(newPassword);
    const isPasswordMatched =
        newPassword.length > 0 && newPassword === newPasswordConfirm;
    const canSubmitPassword =
        isEmailVerified && isPasswordRuleValid && isPasswordMatched && !isSubmitting;

    // '다시 찾기' 클릭 시 전체 입력 폼 및 상태 모두 초기화
    function handleResetAllFields() {
        setEmail(defaultEmail);
        setVerificationCode('');
        setVerifiedCode('');
        setNewPassword('');
        setNewPasswordConfirm('');
        setShowNewPassword(false);
        setShowNewPasswordConfirm(false);
        setShowVerificationInput(false);
        setTimerSeconds(0);
        setIsEmailVerified(false);
        setEmailError('');
        setIsCodeFailed(false);
        setCodeErrorMessage('');
        setSubmitError('');
        setIsUserNotFound(false);
    }

    // 백엔드 응답이 소셜 로그인 계정 에러인지 판별
    function isSocialAccountError(result, status) {
        const msg = result?.message || '';
        const code = result?.code || result?.errorCode || '';
        return (
            msg.includes('소셜') ||
            String(code).toUpperCase().includes('SOCIAL') ||
            status === 403
        );
    }

    /**
     * 1. 이메일 확인 및 인증번호 발송 (POST /auth/password_reset/check_email)
     * - 소셜 로그인 사용자인 경우 팝업 표시 후 확인 클릭 시 이전 화면으로 이동
     * - 미가입 사용자인 경우 '존재하지 않는 사용자입니다.' 팝업 표시
     */
    async function handleSendVerificationEmail() {
        const trimmedEmail = email.trim();
        setEmailError('');
        setIsCodeFailed(false);
        setCodeErrorMessage('');
        setSubmitError('');

        if (!trimmedEmail) {
            setEmailError('아이디(이메일)를 입력해 주세요.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setEmailError('올바른 이메일 형식을 입력해 주세요.');
            return;
        }

        setIsSendingEmail(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/password_reset/check_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                if (isSocialAccountError(result, response.status)) {
                    setSocialAccountModalMessage(
                        result.message || '소셜 로그인으로 가입된 계정입니다.'
                    );
                    return;
                }
                if (response.status === 404) {
                    setIsUserNotFound(true);
                    return;
                }
                setEmailError(result.message || '인증번호 발송에 실패했습니다.');
                return;
            }

            setIsEmailVerified(false);
            setVerificationCode('');
            setVerifiedCode('');
            setNewPassword('');
            setNewPasswordConfirm('');
            setShowVerificationInput(true);
            setTimerSeconds(AUTH_CODE_SECONDS);
            setIsEmailSentModalOpen(true);
        } catch {
            setEmailError('인증번호 발송 중 오류가 발생했습니다.');
        } finally {
            setIsSendingEmail(false);
        }
    }

    /**
     * 인증번호 재발송 (POST /auth/email_confirm_code_send)
     */
    async function handleResendVerificationEmail() {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setEmailError('아이디(이메일)를 입력해 주세요.');
            return;
        }

        setIsResendingEmail(true);
        setCodeErrorMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/email_confirm_code_send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                setCodeErrorMessage(result.message || '인증번호 재발송에 실패했습니다.');
                return;
            }

            setIsCodeFailed(false);
            setVerificationCode('');
            setTimerSeconds(AUTH_CODE_SECONDS);
            setIsEmailSentModalOpen(true);
        } catch {
            setCodeErrorMessage('인증번호 재발송 중 오류가 발생했습니다.');
        } finally {
            setIsResendingEmail(false);
        }
    }

    /**
     * 2. 인증번호 확인 (POST /auth/email_code_check)
     * - 인증 성공 시 새 비밀번호 입력칸 및 재입력칸 생성
     */
    async function handleVerifyCode() {
        const trimmedCode = verificationCode.trim();
        const trimmedEmail = email.trim();

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

        try {
            const response = await fetch(`${API_BASE_URL}/auth/email_code_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: trimmedEmail,
                    code: trimmedCode,
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                if (isSocialAccountError(result, response.status)) {
                    setSocialAccountModalMessage(
                        result.message || '소셜 로그인으로 가입된 계정입니다.'
                    );
                    return;
                }
                setIsCodeFailed(true);
                setCodeErrorMessage(
                    result.message || '인증번호가 일치하지 않거나 만료되었습니다.'
                );
                return;
            }

            setVerifiedCode(trimmedCode);
            setIsEmailVerified(true);
        } catch {
            setCodeErrorMessage('인증번호 확인 중 오류가 발생했습니다.');
        } finally {
            setIsCheckingCode(false);
        }
    }

    /**
     * 3. 비밀번호 변경 요청 (PATCH /auth/password_reset)
     * - Request: { email, newPassword, code }
     * - 비로그인 사용자도 초기화 가능하도록 Authorization 토큰을 넘기지 않음
     */
    async function handlePasswordResetSubmit(e) {
        e.preventDefault();
        if (!canSubmitPassword) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/password_reset`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    newPassword,
                    code: verifiedCode,
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                if (isSocialAccountError(result, response.status)) {
                    setSocialAccountModalMessage(
                        result.message || '소셜 로그인으로 가입된 계정입니다.'
                    );
                    return;
                }
                setSubmitError(result.message || '비밀번호 변경에 실패했습니다.');
                return;
            }

            setResetSuccessMessage(result.message || '비밀번호가 성공적으로 변경되었습니다.');
        } catch {
            setSubmitError('비밀번호 변경 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    }

    const inputClass =
        'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:bg-gray-100 disabled:text-gray-400';

    return (
        <form onSubmit={handlePasswordResetSubmit} className="space-y-4" noValidate>
            {/* 아이디(이메일) 입력 및 인증 요청 */}
            <div>
                <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-gray-800">
                    아이디(이메일)
                </label>
                <div className="flex gap-2">
                    <input
                        id="reset-email"
                        type="email"
                        value={email}
                        disabled={isEmailVerified}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError('');
                            setIsEmailVerified(false);
                            setShowVerificationInput(false);
                            setVerificationCode('');
                            setVerifiedCode('');
                            setIsCodeFailed(false);
                            setCodeErrorMessage('');
                        }}
                        placeholder="classway@example.com"
                        className={inputClass}
                    />
                    <button
                        type="button"
                        onClick={handleSendVerificationEmail}
                        disabled={isSendingEmail || isResendingEmail || isEmailVerified}
                        className="h-11 shrink-0 rounded-lg border border-brand bg-white px-4 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSendingEmail || isResendingEmail ? '발송 중...' : '인증 요청'}
                    </button>
                </div>
                {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* 인증번호 입력 영역 */}
            <div>
                <label htmlFor="reset-code" className="mb-1.5 block text-sm font-medium text-gray-800">
                    인증번호
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            id="reset-code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            disabled={!showVerificationInput || isSendingEmail || isResendingEmail || isEmailVerified}
                            value={verificationCode}
                            onChange={(e) => {
                                setVerificationCode(e.target.value.replace(/\D/g, ''));
                                setIsCodeFailed(false);
                                setCodeErrorMessage('');
                            }}
                            placeholder="6자리 숫자"
                            className={`${inputClass} pr-16`}
                        />
                        {showVerificationInput && !isEmailVerified && (
                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
                                {formatTimer(timerSeconds)}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={!showVerificationInput || isSendingEmail || isResendingEmail || isCheckingCode || isEmailVerified}
                        className="h-11 shrink-0 rounded-lg bg-brand px-5 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isCheckingCode ? '확인 중...' : '인증'}
                    </button>
                </div>

                {/* 인증 완료 표시 */}
                {isEmailVerified && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-point">
                        <Check size={13} />
                        <span>이메일 인증이 완료되었습니다.</span>
                    </p>
                )}

                {/* 미인증 상태에서 재발송 안내 (정상 대기 중) */}
                {showVerificationInput && !isEmailVerified && !isCodeFailed && (
                    <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            인증번호가 오지 않았다면{' '}
                            <button
                                type="button"
                                onClick={handleResendVerificationEmail}
                                disabled={isResendingEmail || isSendingEmail}
                                className="font-semibold text-gray-800 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isResendingEmail ? '재발송 중...' : '재발송'}
                            </button>
                        </span>
                    </div>
                )}

                {!isCodeFailed && codeErrorMessage && (
                    <p className="mt-1.5 text-xs text-red-600">{codeErrorMessage}</p>
                )}
            </div>

            {/* 인증 성공 시: 새 비밀번호 및 새 비밀번호 확인 입력 영역 */}
            {isEmailVerified && (
                <div className="space-y-4 pt-2">
                    <div>
                        <label
                            htmlFor="reset-new-password"
                            className="mb-1.5 block text-sm font-medium text-gray-800"
                        >
                            새 비밀번호
                        </label>
                        <div className="relative">
                            <input
                                id="reset-new-password"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setSubmitError('');
                                }}
                                placeholder="새 비밀번호를 입력하세요"
                                className={`${inputClass} pr-10`}
                            />
                            <button
                                type="button"
                                aria-label={showNewPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                            >
                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {newPassword.length > 0 && !isPasswordRuleValid && (
                            <p className="mt-1.5 text-xs text-red-600">
                                비밀번호 규칙에 부합하지 않습니다. (영문 8~12자, 숫자 2~4자, 특수기호 포함, 총 12자 이상)
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="reset-new-password-confirm"
                            className="mb-1.5 block text-sm font-medium text-gray-800"
                        >
                            새 비밀번호 확인
                        </label>
                        <div className="relative">
                            <input
                                id="reset-new-password-confirm"
                                type={showNewPasswordConfirm ? 'text' : 'password'}
                                value={newPasswordConfirm}
                                onChange={(e) => {
                                    setNewPasswordConfirm(e.target.value);
                                    setSubmitError('');
                                }}
                                placeholder="새 비밀번호를 한 번 더 입력하세요"
                                className={`${inputClass} pr-10`}
                            />
                            <button
                                type="button"
                                aria-label={showNewPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                                onClick={() => setShowNewPasswordConfirm((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                            >
                                {showNewPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {newPasswordConfirm.length > 0 && !isPasswordMatched && (
                            <p className="mt-1.5 text-xs text-red-600">
                                비밀번호가 일치하지 않습니다.
                            </p>
                        )}
                    </div>

                    {submitError && <p className="text-xs text-red-600">{submitError}</p>}

                    <button
                        type="submit"
                        disabled={!canSubmitPassword}
                        className="flex h-11 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? '변경 중...' : '비밀번호 변경'}
                    </button>
                </div>
            )}

            {/* 인증번호 발송 완료 모달 */}
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
                                disabled={isResendingEmail || isSendingEmail}
                                className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                메인으로 이동
                            </button>
                            <button
                                type="button"
                                onClick={handleResendVerificationEmail}
                                disabled={isResendingEmail || isSendingEmail}
                                className="h-10 flex-1 rounded-lg bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isResendingEmail ? '재발송 중...' : '인증번호 재발송'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 소셜 로그인 계정 안내 모달 (확인 클릭 시 이전 화면으로 이동) */}
            {socialAccountModalMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
                        <p className="mb-5 whitespace-pre-line text-sm font-medium text-gray-900">
                            {socialAccountModalMessage}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSocialAccountModalMessage('');
                                navigate(-1);
                            }}
                            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}

            {/* 비밀번호 변경 완료 모달 */}
            {resetSuccessMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl">
                        <p className="mb-5 whitespace-pre-line text-sm font-medium text-gray-900">
                            {resetSuccessMessage}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setResetSuccessMessage('');
                                if (typeof onSuccess === 'function') {
                                    onSuccess();
                                } else {
                                    navigate('/login');
                                }
                            }}
                            className="h-11 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90"
                        >
                            확인
                        </button>
                    </div>
                </div>
            )}
        </form>
    );
}

export default PasswordResetForm;
