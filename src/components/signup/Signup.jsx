import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Check, Eye, EyeOff, FileText, Paperclip, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { API_BASE_URL } from '../../utils/auth.js';

// 증빙 자료 업로드 제한 상수 (강사 가입 전용)
const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 파일당 최대 10MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// 이메일 인증번호 유효 시간 (3분 = 179초 -> 02:59부터 카운트다운)
const AUTH_CODE_SECONDS = 179;

// 남은 초(seconds)를 "MM:SS" 문자열로 변환
function formatTimer(seconds) {
    const min = String(Math.floor(seconds / 60)).padStart(2, '0');
    const sec = String(seconds % 60).padStart(2, '0');
    return `${min}:${sec}`;
}

// 바이트 단위 파일 크기를 KB 또는 MB 문자열로 변환
function formatFileSize(bytes) {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))}KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function Signup() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    // 숨겨진 <input type="file">을 '파일 첨부' 버튼 클릭으로 열기 위한 ref
    const fileInputRef = useRef(null);

    // 가입 유형 탭 상태 ('STUDENT' | 'TUTOR'), 기본값은 수강생('STUDENT')
    const [activeTab, setActiveTab] = useState('STUDENT');

    // 공통 기본 입력값
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [phone, setPhone] = useState('');

    // 강사 탭 전용 입력값 (경력, 첨부 파일 목록, 파일 검증 에러 메시지)
    const [career, setCareer] = useState('');
    const [documentFiles, setDocumentFiles] = useState([]);
    const [fileError, setFileError] = useState('');

    // 비밀번호 / 비밀번호 확인 입력란의 평문 표시 토글 상태
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // 닉네임 중복 확인 API 결과 상태 ({ type: 'success' | 'error' | '', message: string })
    const [nicknameStatus, setNicknameStatus] = useState({ type: '', message: '' });
    const [isCheckingNickname, setIsCheckingNickname] = useState(false);

    // 이메일 중복 확인 및 인증번호 발송/검증 상태
    const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isResendingEmail, setIsResendingEmail] = useState(false);
    const [isEmailSentModalOpen, setIsEmailSentModalOpen] = useState(false); // 발송 완료 안내 팝업
    const [showVerificationInput, setShowVerificationInput] = useState(false); // 인증번호 입력 영역 노출 여부
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationStatus, setVerificationStatus] = useState({ type: '', message: '' });
    const [isCheckingCode, setIsCheckingCode] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    // 약관 동의 상태 (marketingAgree는 가입 요청 바디의 marketing_agree로 전달)
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [marketingAgree, setMarketingAgree] = useState(false);
    // 약관 상세 보기 모달 상태 ('terms' | 'privacy' | null)
    const [termsModal, setTermsModal] = useState(null);

    // 폼 제출 에러 및 중복 제출 방지용 로딩 상태
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 인증번호 입력란이 열려 있고 미인증 상태이며 남은 시간이 있을 때만 1초마다 타이머 감소
    useEffect(() => {
        if (!showVerificationInput || isEmailVerified || timerSeconds <= 0) return;

        const timerId = setInterval(() => {
            setTimerSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);

        return () => clearInterval(timerId);
    }, [showVerificationInput, isEmailVerified, timerSeconds]);

    // 이미 로그인한 사용자가 /signup에 접근하면 메인 페이지로 이동
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // 세 약관 모두 체크되었을 때만 '전체 동의' 체크박스 활성화
    const isAllAgreed = agreeTerms && agreePrivacy && marketingAgree;
    // 비밀번호 확인 입력값이 있을 때만 불일치 안내 문구 표시
    const isPasswordMismatch =
        passwordConfirm.length > 0 && password !== passwordConfirm;

    // '전체 동의' 체크 시 하위 약관 3개를 일괄 동기화
    function handleToggleAllAgreements(checked) {
        setAgreeTerms(checked);
        setAgreePrivacy(checked);
        setMarketingAgree(checked);
    }

    /**
     * 닉네임 중복 확인 (POST /auth/nickname_check)
     * - 정상 응답 시: "사용 가능한 닉네임입니다." 표시
     * - 실패/중복 응답 시: 백엔드가 내려준 message 표시
     */
    async function handleCheckNickname() {
        const trimmed = nickname.trim();
        if (!trimmed) {
            setNicknameStatus({ type: 'error', message: '닉네임을 입력해 주세요.' });
            return;
        }

        setIsCheckingNickname(true);
        setNicknameStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/auth/nickname_duplicate_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: trimmed }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                setNicknameStatus({
                    type: 'error',
                    message: result.message || '닉네임 검증에 실패했습니다.',
                });
                return;
            }

            setNicknameStatus({
                type: 'success',
                message: '사용 가능한 닉네임입니다.',
            });
        } catch {
            setNicknameStatus({
                type: 'error',
                message: '닉네임 중복 확인 중 오류가 발생했습니다.',
            });
        } finally {
            setIsCheckingNickname(false);
        }
    }

    /**
     * 이메일 중복 확인 및 인증번호 발송 (POST /auth/email_check)
     * - 에러 응답 시(이미 존재하는 이메일 등): 백엔드 message 출력
     * - 정상 응답 시: 사용 가능 메시지 출력 + 발송 완료 팝업 표시 + 인증번호 입력란/타이머 활성화
     */
    async function handleSendVerificationEmail() {
        const trimmed = email.trim();
        if (!trimmed) {
            setEmailStatus({ type: 'error', message: '이메일을 입력해 주세요.' });
            return;
        }

        setIsSendingEmail(true);
        setEmailStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/auth/email_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                setEmailStatus({
                    type: 'error',
                    message: result.message || '이메일 검증에 실패했습니다.',
                });
                return;
            }

            setEmailStatus({
                type: 'success',
                message: '사용 가능한 이메일입니다.',
            });

            setIsEmailVerified(false);
            setVerificationCode('');
            setVerificationStatus({ type: '', message: '' });
            setShowVerificationInput(true);
            setTimerSeconds(AUTH_CODE_SECONDS);
            setIsEmailSentModalOpen(true);
        } catch {
            setEmailStatus({
                type: 'error',
                message: '인증번호 발송 중 오류가 발생했습니다.',
            });
        } finally {
            setIsSendingEmail(false);
        }
    }

    /**
     * 이메일 인증번호 재발송 (POST /auth/email_confirm_code_send)
     * - '재발송' 버튼 클릭 시 호출
     */
    async function handleResendVerificationEmail() {
        const trimmed = email.trim();
        if (!trimmed) {
            setEmailStatus({ type: 'error', message: '이메일을 입력해 주세요.' });
            return;
        }

        setIsResendingEmail(true);
        setVerificationStatus({ type: '', message: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/auth/email_confirm_code_send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                setVerificationStatus({
                    type: 'error',
                    message: result.message || '인증번호 재발송에 실패했습니다.',
                });
                return;
            }

            setVerificationCode('');
            setTimerSeconds(AUTH_CODE_SECONDS);
            setIsEmailSentModalOpen(true);
        } catch {
            setVerificationStatus({
                type: 'error',
                message: '인증번호 재발송 중 오류가 발생했습니다.',
            });
        } finally {
            setIsResendingEmail(false);
        }
    }

    /**
     * 인증번호 확인 (POST /auth/email_code_check)
     * Request: { "email": string, "code": string }
     */
    async function handleVerifyCode() {
        const trimmedCode = verificationCode.trim();
        const trimmedEmail = email.trim();

        if (!trimmedCode) {
            setVerificationStatus({ type: 'error', message: '인증번호를 입력해 주세요.' });
            return;
        }

        setIsCheckingCode(true);
        setVerificationStatus({ type: '', message: '' });

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

            if (!response.ok || !result.success) {
                setVerificationStatus({
                    type: 'error',
                    message: result.message || '인증번호가 일치하지 않습니다.',
                });
                return;
            }

            setIsEmailVerified(true);
            setVerificationStatus({
                type: 'success',
                message: result.message || '이메일 인증이 완료되었습니다.',
            });
        } catch {
            setVerificationStatus({
                type: 'error',
                message: '인증번호 확인 중 오류가 발생했습니다.',
            });
        } finally {
            setIsCheckingCode(false);
        }
    }

    /**
     * 강사 증빙 자료 파일 선택 핸들러
     * - 최대 5개, 파일당 최대 10MB, 확장자/MIME(PDF, JPG, PNG) 검증 후 목록에 추가
     */
    function handleFileChange(event) {
        const selectedFiles = Array.from(event.target.files || []);
        // 같은 파일을 다시 선택해도 onChange가 동작하도록 input 값 초기화
        event.target.value = '';
        if (selectedFiles.length === 0) return;

        setFileError('');

        if (documentFiles.length + selectedFiles.length > MAX_FILE_COUNT) {
            setFileError(`증빙 자료는 최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
            return;
        }

        const validFiles = [];
        for (const file of selectedFiles) {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const isAllowedType =
                ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIME_TYPES.includes(file.type);

            if (!isAllowedType) {
                setFileError('PDF, JPG, PNG 파일만 첨부 가능합니다.');
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setFileError('파일당 용량은 최대 10MB까지 첨부 가능합니다.');
                return;
            }
            validFiles.push(file);
        }

        setDocumentFiles((prev) => [...prev, ...validFiles]);
    }

    // 첨부된 증빙 자료 목록에서 특정 파일 제거
    function handleRemoveFile(targetIndex) {
        setDocumentFiles((prev) => prev.filter((_, idx) => idx !== targetIndex));
        setFileError('');
    }

    /**
     * 회원가입 제출 핸들러
     * - 필수값/비밀번호 일치/필수 약관 동의 여부 검증
     * - 수강생: POST /auth/signup/student (role: 'STUDENT')
     * - 강사: POST /auth/signup/tutor (role: 'TUTOR', intro, career, document_file 포함)
     */
    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitError('');

        if (!name.trim() || !nickname.trim() || !email.trim() || !password || !phone.trim()) {
            setSubmitError('필수 정보를 모두 입력해 주세요.');
            return;
        }
        if (password !== passwordConfirm) {
            setSubmitError('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!agreeTerms || !agreePrivacy) {
            setSubmitError('필수 약관에 모두 동의해 주세요.');
            return;
        }

        const isTutor = activeTab === 'TUTOR';
        const endpoint = isTutor ? '/auth/signup/tutor' : '/auth/signup/student';

        // 백엔드 @ModelAttribute 바인딩을 위해 수강생/강사 모두 FormData로 전송
        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('password', password);
        formData.append('name', name.trim());
        formData.append('phone', phone.trim());
        formData.append('nickname', nickname.trim());
        formData.append('role', isTutor ? 'TUTOR' : 'STUDENT');
        formData.append('class_content_alarm', String(true));
        formData.append('qna_alarm', String(true));
        formData.append('offline_class_alarm', String(true));
        formData.append('marketing_agree', String(marketingAgree));

        // 강사 탭일 때만 강사 경력/소개/증빙 자료 파일 추가
        if (isTutor) {
            formData.append('intro', '');
            formData.append('career', career.trim());
            documentFiles.forEach((file) => {
                formData.append('document_file', file);
            });
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                // FormData 전송 시 브라우저가 boundary를 포함해 Content-Type을 자동 설정
                body: formData,
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || result.success === false) {
                throw new Error(result.message || '회원가입에 실패했습니다.');
            }

            // 가입 성공 시 로그인 페이지로 이동
            navigate('/login');
        } catch (error) {
            setSubmitError(error.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    }

    // 공통 입력창 / 보조 버튼 스타일 클래스
    const inputClass =
        'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none';
    const subButtonClass =
        'h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50';

    return (
        <main className="mx-auto w-full max-w-[460px] px-4 py-12">
            <h1 className="mb-5 text-2xl font-bold text-gray-900">회원가입</h1>

            {/* 수강생 / 강사 전환 탭 (기본 선택: 수강생) */}
            <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-lg border border-gray-300 bg-white">
                <button
                    type="button"
                    onClick={() => setActiveTab('STUDENT')}
                    className={`h-11 text-sm font-medium transition-colors ${
                        activeTab === 'STUDENT'
                            ? 'bg-brand text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    수강생
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('TUTOR')}
                    className={`h-11 text-sm font-medium transition-colors ${
                        activeTab === 'TUTOR'
                            ? 'bg-brand text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    강사
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이름 입력 */}
                <div>
                    <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-gray-800">
                        이름
                    </label>
                    <input
                        id="signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        className={inputClass}
                    />
                </div>

                {/* 닉네임 입력 + 중복 확인 버튼 */}
                <div>
                    <label htmlFor="signup-nickname" className="mb-1.5 block text-sm font-medium text-gray-800">
                        닉네임
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="signup-nickname"
                            type="text"
                            value={nickname}
                            onChange={(e) => {
                                setNickname(e.target.value);
                                // 입력값이 바뀌면 이전 중복 확인 결과 초기화
                                setNicknameStatus({ type: '', message: '' });
                            }}
                            placeholder="베이킹초보"
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={handleCheckNickname}
                            disabled={isCheckingNickname}
                            className={subButtonClass}
                        >
                            {isCheckingNickname ? '확인 중...' : '중복 확인'}
                        </button>
                    </div>
                    {nicknameStatus.message && (
                        <p
                            className={`mt-1.5 flex items-center gap-1 text-xs ${
                                nicknameStatus.type === 'success' ? 'text-point' : 'text-red-600'
                            }`}
                        >
                            {nicknameStatus.type === 'success' && <Check size={13} />}
                            <span>{nicknameStatus.message}</span>
                        </p>
                    )}
                </div>

                {/* 이메일 입력 + 인증번호 발송 버튼 + 발송 후 인증번호 입력 영역 */}
                <div>
                    <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-gray-800">
                        이메일
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                // 이메일 변경 시 이전 확인/인증 상태 초기화
                                setEmailStatus({ type: '', message: '' });
                                setIsEmailVerified(false);
                                setShowVerificationInput(false);
                                setVerificationCode('');
                                setVerificationStatus({ type: '', message: '' });
                            }}
                            placeholder="classway@example.com"
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={handleSendVerificationEmail}
                            disabled={isSendingEmail}
                            className={subButtonClass}
                        >
                            {isSendingEmail ? '발송 중...' : '인증번호 발송'}
                        </button>
                    </div>
                    {emailStatus.message && (
                        <p
                            className={`mt-1.5 flex items-center gap-1 text-xs ${
                                emailStatus.type === 'success' ? 'text-point' : 'text-red-600'
                            }`}
                        >
                            {emailStatus.type === 'success' && <Check size={13} />}
                            <span>{emailStatus.message}</span>
                        </p>
                    )}

                    {/* 정상 발송 시 이메일 입력란 하단에 인증번호 입력란 노출 (인증 완료 시 입력칸/버튼은 숨기고 완료 메시지만 표시) */}
                    {showVerificationInput && (
                        <div className="mt-3">
                            {isEmailVerified ? (
                                <p className="flex items-center gap-1 text-xs text-point font-medium">
                                    <Check size={13} />
                                    <span>{verificationStatus.message || '이메일 인증이 완료되었습니다.'}</span>
                                </p>
                            ) : (
                                <>
                                    <label
                                        htmlFor="signup-verification-code"
                                        className="mb-1.5 block text-sm font-medium text-gray-800"
                                    >
                                        인증번호
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                id="signup-verification-code"
                                                type="text"
                                                maxLength={6}
                                                value={verificationCode}
                                                onChange={(e) => {
                                                    setVerificationCode(e.target.value);
                                                    setVerificationStatus({ type: '', message: '' });
                                                }}
                                                placeholder="6자리 숫자"
                                                className={`${inputClass} pr-16`}
                                            />
                                            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
                                                {formatTimer(timerSeconds)}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleVerifyCode}
                                            disabled={isCheckingCode}
                                            className="h-11 shrink-0 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
                                        >
                                            {isCheckingCode ? '확인 중...' : '확인'}
                                        </button>
                                    </div>
                                    {verificationStatus.message && (
                                        <p
                                            className={`mt-1.5 flex items-center gap-1 text-xs ${
                                                verificationStatus.type === 'success' ? 'text-point' : 'text-red-600'
                                            }`}
                                        >
                                            {verificationStatus.type === 'success' && <Check size={13} />}
                                            <span>{verificationStatus.message}</span>
                                        </p>
                                    )}
                                    <div className="mt-1.5 flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            인증번호가 오지 않았다면{' '}
                                            <button
                                                type="button"
                                                onClick={handleResendVerificationEmail}
                                                disabled={isResendingEmail}
                                                className="font-semibold text-gray-800 underline underline-offset-2 disabled:opacity-50"
                                            >
                                                {isResendingEmail ? '재발송 중...' : '재발송'}
                                            </button>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* 비밀번호 입력 (눈 아이콘으로 보기/숨기기 토글) */}
                <div>
                    <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-gray-800">
                        비밀번호
                    </label>
                    <div className="relative">
                        <input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className={`${inputClass} pr-10`}
                        />
                        <button
                            type="button"
                            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">
                        [비밀번호 규칙: 예) 영문 · 숫자 · 특수문자 포함 8자 이상]
                    </p>
                </div>

                {/* 비밀번호 확인 입력 (눈 아이콘으로 보기/숨기기 토글) */}
                <div>
                    <label
                        htmlFor="signup-password-confirm"
                        className="mb-1.5 block text-sm font-medium text-gray-800"
                    >
                        비밀번호 확인
                    </label>
                    <div className="relative">
                        <input
                            id="signup-password-confirm"
                            type={showPasswordConfirm ? 'text' : 'password'}
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            placeholder="비밀번호를 한 번 더 입력하세요"
                            className={`${inputClass} pr-10`}
                        />
                        <button
                            type="button"
                            aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                            onClick={() => setShowPasswordConfirm((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                        >
                            {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {isPasswordMismatch && (
                        <p className="mt-1.5 text-xs text-red-600">비밀번호가 일치하지 않습니다</p>
                    )}
                </div>

                {/* 전화번호 입력 */}
                <div>
                    <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-medium text-gray-800">
                        전화번호
                    </label>
                    <input
                        id="signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className={inputClass}
                    />
                </div>

                {/* 강사 탭 선택 시에만 노출: 강사 경력 및 증빙 자료 첨부 */}
                {activeTab === 'TUTOR' && (
                    <div className="space-y-4 rounded-xl border border-gray-200 p-4">
                        <div>
                            <label
                                htmlFor="signup-career"
                                className="mb-1.5 block text-sm font-medium text-gray-800"
                            >
                                강사 경력
                            </label>
                            <textarea
                                id="signup-career"
                                rows={4}
                                value={career}
                                onChange={(e) => setCareer(e.target.value)}
                                placeholder="수업 경력, 자격증, 운영 중인 공방 등을 적어 주세요"
                                className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                가입 후 관리자 승인이 끝나면 클래스를 등록할 수 있습니다.
                            </p>
                        </div>

                        <div>
                            <span className="mb-2 block text-sm font-medium text-gray-800">
                                증빙 자료 첨부
                            </span>

                            {/* 첨부된 파일 목록 */}
                            {documentFiles.length > 0 && (
                                <ul className="mb-2 space-y-2">
                                    {documentFiles.map((file, index) => (
                                        <li
                                            key={`${file.name}-${index}`}
                                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <FileText size={15} className="shrink-0 text-gray-500" />
                                                <span className="truncate font-medium text-gray-800">
                                                    {file.name}
                                                </span>
                                            </div>
                                            <div className="ml-3 flex shrink-0 items-center gap-2">
                                                <span className="text-gray-400">
                                                    {formatFileSize(file.size)}
                                                </span>
                                                <button
                                                    type="button"
                                                    aria-label={`${file.name} 삭제`}
                                                    onClick={() => handleRemoveFile(index)}
                                                    className="text-gray-400 hover:text-gray-700"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* 실제 파일 선택창을 여는 숨겨진 file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Paperclip size={15} />
                                <span>파일 첨부</span>
                            </button>
                            <p className="mt-1.5 text-xs text-gray-500">
                                자격증 · 경력증명서 · 포트폴리오 등 · PDF · JPG · PNG · 파일당 10MB, 최대 5개
                            </p>
                            {fileError && <p className="mt-1 text-xs text-red-600">{fileError}</p>}
                        </div>
                    </div>
                )}

                {/* 약관 동의 영역 */}
                <div className="rounded-xl border border-gray-200 p-4">
                    <p className="mb-3 text-sm font-semibold text-gray-900">약관 동의</p>

                    <label className="flex cursor-pointer items-center gap-2.5 border-b border-gray-200 pb-3 text-sm font-semibold text-gray-900">
                        <input
                            type="checkbox"
                            checked={isAllAgreed}
                            onChange={(e) => handleToggleAllAgreements(e.target.checked)}
                            className="h-4 w-4 accent-brand"
                        />
                        <span>전체 동의</span>
                    </label>

                    <div className="mt-3 space-y-2.5 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={agreeTerms}
                                    onChange={(e) => setAgreeTerms(e.target.checked)}
                                    className="h-4 w-4 accent-brand"
                                />
                                <span>[필수] 이용약관 동의</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setTermsModal('terms')}
                                className="text-xs text-gray-500 hover:text-gray-800"
                            >
                                보기
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2.5">
                                <input
                                    type="checkbox"
                                    checked={agreePrivacy}
                                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                                    className="h-4 w-4 accent-brand"
                                />
                                <span>[필수] 개인정보 수집 · 이용 동의</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setTermsModal('privacy')}
                                className="text-xs text-gray-500 hover:text-gray-800"
                            >
                                보기
                            </button>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2.5">
                            <input
                                type="checkbox"
                                checked={marketingAgree}
                                onChange={(e) => setMarketingAgree(e.target.checked)}
                                className="h-4 w-4 accent-brand"
                            />
                            <span>[선택] 마케팅 정보 수신 동의</span>
                        </label>
                    </div>
                </div>

                {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                {/* 회원가입 제출 버튼 */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
                >
                    {isSubmitting ? '가입 처리 중...' : '회원가입'}
                </button>
            </form>

            {/* 간편 가입 구분선 및 소셜 로그인 버튼 (연동 전 UI만 구성) */}
            <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
                <span className="h-px flex-1 bg-gray-200" />
                <span>간편 가입</span>
                <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2.5">
                <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FEE500] text-[10px] font-bold text-[#191919]">
                        K
                    </span>
                    <span>카카오로 시작하기</span>
                </button>
                <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#03C75A] text-[10px] font-bold text-white">
                        N
                    </span>
                    <span>네이버로 시작하기</span>
                </button>
                <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-[11px] font-bold text-gray-700">
                        G
                    </span>
                    <span>구글로 시작하기</span>
                </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
                이미 계정이 있다면{' '}
                <Link to="/login" className="font-semibold text-gray-900 hover:underline">
                    로그인
                </Link>
            </p>

            {/* 인증번호 발송 완료 안내 팝업 ('확인' 클릭 시 닫힘) */}
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

            {/* 약관 상세 보기 모달 */}
            {termsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="mb-3 text-base font-semibold text-gray-900">
                            {termsModal === 'terms' ? '이용약관' : '개인정보 수집 · 이용 동의'}
                        </h2>
                        <p className="mb-5 max-h-60 overflow-y-auto text-xs leading-relaxed text-gray-600">
                            {termsModal === 'terms'
                                ? 'ClassWay 서비스 이용약관 안내 내용입니다.'
                                : 'ClassWay 개인정보 수집 및 이용 동의 안내 내용입니다.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setTermsModal(null)}
                            className="h-10 w-full rounded-lg bg-brand text-sm font-medium text-white hover:bg-brand/90"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Signup;
