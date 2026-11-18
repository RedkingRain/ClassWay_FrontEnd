import { Link } from 'react-router-dom';
import AlarmMenu from './AlarmMenu.jsx';

// user.role: STUDENT / TUTOR / ADMIN
//  - 강사는 가입 때부터 TUTOR (승인 대기 · 반려 · 승인 모두)
//  - 강사도 수강생 기능(찜 · 예약 · 결제) 사용 가능 (TUTOR-006)
//  - 승인 상태는 user.tutorStatus(PENDING / REJECTED / APPROVED)로 구분 → 강사 페이지 안에서 신청 현황 · 잠금 처리

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
    // 알림 버튼 + 펼침 창 (로그인 회원 공통)
    const notificationButton = <AlarmMenu />;

    const logoutButton = (
        <button type="button" onClick={onLogout} className={textLinkClass}>로그아웃</button>
    );

    // 2. 관리자: 관리자 페이지 바로가기 + 알림 + 로그아웃
    if (user.role === 'ADMIN') {
        return (
            <nav className="ml-auto flex shrink-0 items-center gap-5">
                <Link to="/admin" className={rolePageClass}>관리자 페이지</Link>
                {notificationButton}
                {logoutButton}
            </nav>
        );
    }

    // 3. 일반 회원 | 강사
    //    강사는 승인 상태와 상관없이 강사 페이지 버튼 추가 (TUTOR-006 비고)
    if (user.role === 'STUDENT' || user.role === 'TUTOR') {
        return (
            <nav className="ml-auto flex shrink-0 items-center gap-5">
                {user.role === 'TUTOR' && (
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