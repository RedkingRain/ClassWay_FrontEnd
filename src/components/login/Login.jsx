import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { API_BASE_URL } from "../../utils/auth.js";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);

    const navigate = useNavigate();
    const { isAuthenticated, loginSuccess } = useAuth();

    // 팝업이 열려있을 때 ESC 키로 닫기
    useEffect(() => {
        if (!isNotFoundModalOpen) return;

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsNotFoundModalOpen(false);
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isNotFoundModalOpen]);

    // 로그인 성공 및 접속자 회원 정보 조회 성공 시, 메인페이지 이동
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // 1차 입력값 형식 검증
    function validateForm() {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setMessage("이메일을 입력해 주세요.");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setMessage("올바른 이메일 형식을 입력해 주세요.");
            return false;
        }

        if (!password) {
            setMessage("비밀번호를 입력해 주세요.");
            return false;
        }

        return true;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        // 1차 형식 검증
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // 로그인 API 호출
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            // 404 상태: 해당 계정이 존재하지 않는 경우 미가입 안내 팝업 표시
            if (response.status === 404) {
                setIsNotFoundModalOpen(true);
                return;
            }

            // API Response Data
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                setMessage(result.message || "이메일 또는 비밀번호가 일치하지 않습니다.");
                return;
            }

            // 토큰 저장 및 /auth/me 사용자 정보 조회
            await loginSuccess(result.data);

            // 정상 처리 후 페이지 이동 (메인 페이지)
            navigate("/");
        } catch (error) {
            setMessage(error.message || "로그인 중 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
            <main className="w-full max-w-[400px]">
                {/* 타이틀 */}
                <h1 className="mb-7 text-2xl font-bold tracking-tight text-gray-900">
                    로그인
                </h1>

                {/* 로그인 폼 */}
                <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-3">
                    <div>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="이메일"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (message) setMessage("");
                            }}
                            className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (message) setMessage("");
                            }}
                            className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        />
                    </div>

                    {/* 에러 / 검증 메시지 영역 */}
                    {message && (
                        <div id="login-massage" className="flex items-center gap-1.5 pt-1 text-xs text-red-500">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 flex h-12 w-full items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "로그인 중..." : "로그인"}
                    </button>
                </form>

                {/* 링크 영역 (아이디 찾기 | 비밀번호 찾기 | 회원가입) */}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
                    <Link to="/login/find_account?tab=id" className="hover:text-gray-900 hover:underline">
                        아이디 찾기
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link to="/login/find_account?tab=pass" className="hover:text-gray-900 hover:underline">
                        비밀번호 찾기
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link to="/signup" className="hover:text-gray-900 hover:underline">
                        회원가입
                    </Link>
                </div>

                {/* 소셜 로그인 구분선 */}
                <div className="relative my-7">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-gray-400">소셜 로그인</span>
                    </div>
                </div>

                {/* 소셜 로그인 버튼 영역 */}
                <div className="space-y-2.5">
                    {/* 카카오 */}
                    <button
                        type="button"
                        aria-label="카카오로 로그인"
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:bg-gray-100"
                    >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="11" fill="#FEE500" />
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M12 6.5C8.96 6.5 6.5 8.44 6.5 10.83c0 1.55 1.03 2.91 2.61 3.67l-.66 2.43c-.06.22.19.41.38.28l2.89-1.93c.43.05.88.08 1.28.08 3.04 0 5.5-1.94 5.5-4.33C17.5 8.44 15.04 6.5 12 6.5z"
                                fill="#000000"
                            />
                        </svg>
                        <span>카카오로 로그인</span>
                    </button>

                    {/* 네이버 */}
                    <button
                        type="button"
                        aria-label="네이버로 로그인"
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:bg-gray-100"
                    >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="11" fill="#03C75A" />
                            <path
                                d="M13.68 12.37L10.05 7.42H7.36v9.16h2.86v-4.95l3.63 4.95h2.69V7.42h-2.86v4.95z"
                                fill="white"
                            />
                        </svg>
                        <span>네이버로 로그인</span>
                    </button>

                    {/* 구글 */}
                    <button
                        type="button"
                        aria-label="구글로 로그인"
                        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:bg-gray-100"
                    >
                        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
                        <span>구글로 로그인</span>
                    </button>
                </div>
            </main>

            {/* 미가입 계정 안내 팝업 (404 상태) */}
            {isNotFoundModalOpen && (
                <div
                    onClick={() => setIsNotFoundModalOpen(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="not-found-modal-title"
                        aria-describedby="not-found-modal-desc"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-xl"
                    >
                        <h2
                            id="not-found-modal-title"
                            className="text-lg font-bold leading-snug text-gray-900"
                        >
                            소셜 계정으로 가입된 정보가 없습니다
                        </h2>
                        <p
                            id="not-found-modal-desc"
                            className="mt-2 text-sm text-gray-500"
                        >
                            무료 가입 후 원활한 서비스 이용 어떠신가요?
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsNotFoundModalOpen(false)}
                                className="h-11 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 active:bg-gray-100"
                            >
                                아니요
                            </button>
                            <button
                                type="button"
                                autoFocus
                                onClick={() => {
                                    setIsNotFoundModalOpen(false);
                                    navigate("/signup");
                                }}
                                className="h-11 rounded-lg bg-brand text-sm font-medium text-white transition hover:bg-brand/90 active:bg-brand/95"
                            >
                                가입하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
