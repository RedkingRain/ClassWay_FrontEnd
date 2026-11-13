import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';

// user.role: STUDENT / TUTOR / ADMIN
//  - 강사는 관리자 승인 후에 TUTOR가 됨
//  - 강사로 가입했지만 승인 전(대기 · 반려)이면 role은 STUDENT, user.tutorStatus로 구분
// 주소는 기능명세서 화면 경로 기준 (로그인 · 회원가입은 팀 라우터 주소 /login, /signup 사용 중)

// 자주 쓰는 스타일을 변수로 → 같은 모양을 여러 곳에 쓸 때 오타·불일치 방지
const pillClass =
    'rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200';
const textLinkClass = 'text-sm text-gray-800 hover:text-black';
const rolePageClass =
    'flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90';

// user: 지금 로그인한 사람 (없으면 null) — Header에서 받아옴
function UserMenu({ user, isLoading, onLogout }) {
    // 새로고침 직후 /auth/me 확인 중에는 버튼 깜빡임 방지
    if (isLoading) {
        return <div className="ml-auto shrink-0" />;
    }

    // 1. 로그인 전: 사용자가 없으면 여기서 바로 끝
    if (!user) {
        return (
            <nav className="ml-auto flex shrink-0 items-center gap-2">
                <Link to="/login" className={pillClass}>로그인</Link>
                <Link to="/signup" className={pillClass}>회원가입</Link>
            </nav>
        );
    }

    // 로그인 후에는 모든 역할에 공통인 버튼 → 한 번만 만들어 두고 재사용
    const notificationButton = (
        <button type="button" aria-label="알림" className="text-gray-800">
            <Bell size={20} />
        </button>
    );
    const logoutButton = (
        <button type="button" onClick={onLogout} className={textLinkClass}>로그아웃</button>
    );

    // 2. 승인된 강사 · 관리자: 전용 페이지 바로가기 + 알림 + 로그아웃
    if (user.role === 'TUTOR' || user.role === 'ADMIN') {
        const isTutor = user.role === 'TUTOR';

        return (
            <nav className="ml-auto flex shrink-0 items-center gap-5">
                <Link to={isTutor ? '/instructor' : '/admin'} className={rolePageClass}>
                    {isTutor ? '강사 페이지' : '관리자 페이지'}
                </Link>
                {notificationButton}
                {logoutButton}
            </nav>
        );
    }

    // 3. 일반 회원 (강사 신청 후 승인 전인 회원 포함)
    if (user.role === 'STUDENT') {
        // 강사로 가입했지만 승인 전(대기 · 반려) → 신청 현황을 볼 수 있게 강사 페이지 버튼 추가 (TUTOR-006)
        // tutorStatus는 아직 /auth/me 응답에 없음 → 백엔드에 추가되기 전까지는 버튼이 안 보임
        const isTutorApplicant = user.tutorStatus === 'PENDING' || user.tutorStatus === 'REJECTED';

        return (
            <nav className="ml-auto flex shrink-0 items-center gap-5">
                {isTutorApplicant && (
                    <Link to="/instructor" className={rolePageClass}>강사 페이지</Link>
                )}
                {notificationButton}
                <Link to="/my/posts/likes" className={textLinkClass}>찜 목록</Link>
                <Link to="/carts" className={textLinkClass}>장바구니</Link>
                <Link to="/my/account" className={textLinkClass}>마이페이지</Link>
                {logoutButton}
            </nav>
        );
    }

    // 4. 정해진 역할이 아니면 아무것도 안 보여줌 (잘못된 값 대비)
    return null;
}

export default UserMenu;