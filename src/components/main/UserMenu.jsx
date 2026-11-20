import { Link } from 'react-router-dom';
import AlarmMenu from './AlarmMenu.jsx';

// 강사는 승인 상태와 상관없이 가입 때부터 TUTOR이고 수강생 기능도 씀 (TUTOR-006), 승인 상태는 user.tutorStatus로 구분함

// 같은 모양을 여러 곳에 쓰다 생기는 오타와 불일치를 막으려고 변수로 둠
const pillClass =
    'rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200';
const textLinkClass = 'text-sm text-gray-800 hover:text-black';
const rolePageClass =
    'flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand/90';

// user는 Header에서 받고, 비로그인이면 null
function UserMenu({ user, isLoading, onLogout }) {
    // 새로고침 직후 /auth/me 확인 중에는 버튼 깜빡임 방지
    if (isLoading) {
        return <div className="ml-auto shrink-0" />;
    }

    if (!user) {
        return (
            <nav className="ml-auto flex shrink-0 items-center gap-2">
                <Link to="/login" className={pillClass}>로그인</Link>
                <Link to="/signup" className={pillClass}>회원가입</Link>
            </nav>
        );
    }

    // 모든 역할에 공통인 알림 버튼은 한 번만 만들어 재사용함
    const notificationButton = <AlarmMenu />;

    const logoutButton = (
        <button type="button" onClick={onLogout} className={textLinkClass}>로그아웃</button>
    );

    if (user.role === 'ADMIN') {
        return (
            <nav className="ml-auto flex shrink-0 items-center gap-5">
                <Link to="/admin" className={rolePageClass}>관리자 페이지</Link>
                {notificationButton}
                {logoutButton}
            </nav>
        );
    }

    // 강사는 승인 상태와 상관없이 강사 페이지 버튼을 보여줌 (TUTOR-006 비고)
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

    // 잘못된 역할 값이 와도 아무 버튼도 보여주지 않음
    return null;
}

export default UserMenu;