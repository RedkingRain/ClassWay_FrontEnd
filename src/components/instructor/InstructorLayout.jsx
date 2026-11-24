import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import InstructorSidebar from './InstructorSidebar.jsx';

function InstructorLayout() {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const hasWarnedRef = useRef(false);

    // Spring Security 'ROLE_TUTOR' 및 일반 'TUTOR' 모두 호환
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR';

    useEffect(() => {
        // 1. 새로고침 직후 세션 복원이 끝날 때까지는 가드를 실행하지 않고 대기
        if (isLoading) return;

        // 2. 비로그인 상태일 때
        if (!user) {
            if (!hasWarnedRef.current) {
                hasWarnedRef.current = true;
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login?returnUrl=/instructor/classes', { replace: true });
            }
            return;
        }

        // 3. 로그인은 되어 있으나 강사 권한이 아닐 때 (예: STUDENT)
        if (!isTutor) {
            if (!hasWarnedRef.current) {
                hasWarnedRef.current = true;
                alert('강사만 접근할 수 있는 페이지입니다.');
                navigate('/', { replace: true });
            }
        }
    }, [user, isTutor, isLoading, navigate]);

    // 세션 복원 중일 때 빈 화면 대신 로딩 상태를 보여주어 화면 멈춤 방지
    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
                <p className="text-sm text-gray-500">강사 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    // 권한 검증에 실패하여 리다이렉트 대기 중일 때
    if (!user || !isTutor) {
        return null;
    }

    // 정상 강사 승인 시 레이아웃 렌더링
    return (
        <div className="mx-auto flex max-w-6xl gap-10 px-4 py-8">
            <InstructorSidebar
                instructorName={user.name}
                tutorStatus={user.tutorStatus}
            />
            <main className="min-w-0 flex-1">
                <Outlet context={{ tutorStatus: user.tutorStatus }} />
            </main>
        </div>
    );
}

export default InstructorLayout;
