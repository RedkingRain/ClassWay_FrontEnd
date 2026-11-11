import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

function Login () {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, loginSuccess } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");
        setIsSubmitting(true);

        try {
            // API 호출
            const response = await fetch(`http://127.0.0.1:8080/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            // API Response Data
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message);
            }

            // 토큰 저장 및 /auth/me 사용자 정보 조회
            await loginSuccess(result.data);

            // 정상 처리 후 페이지 이동(메인 페이지)
            navigate("/");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
        <main>
            <h1>로그인</h1>
            <form id="login-form" onSubmit={handleSubmit}>
                <input type="text" id="email" value={email} onChange={(event) => setEmail(event.target.value)}/>
                <input type="password" id="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
                {message && <p id="login-massage">{message}</p>}
                <p>5회 실패 시 로그인 제한</p>
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "로그인 중..." : "로그인"}
                </button>
            </form>

            <span>
                <Link>아이디 찾기</Link> | 
                <Link>비밀번호 찾기</Link> | 
                <Link>회원가입</Link>
            </span>
            <span>
                <p>소셜 로그인</p>
                <Link className="login-social">카카오로 로그인</Link>
                <Link className="login-social">네이버로 로그인</Link>
                <Link className="login-social">구글로 로그인</Link>
            </span>
        </main>
        </>
    );
}

export default Login;