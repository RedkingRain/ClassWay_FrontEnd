import logo from '../../assets/classway-logo.svg';
import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

function Header() {
    const { user, isLoading, logout } = useAuth();

    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                {/* 1. 로고 - 누르면 메인으로 */}
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="ClassWay 홈으로" className="h-6 w-auto" />
                </Link>

                {/* 2. 카테고리 버튼 - 페이지 이동이 아니라 목록 펼치기라 button 유지 */}
                <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-800"
                >
                    <Menu size={20} />
                    카테고리
                </button>

                {/* 3. 검색창 */}
                <form className="relative max-w-xl flex-1">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="search"
                        placeholder="배우고 싶은 클래스를 검색해 보세요"
                        aria-label="클래스 검색"
                        className="h-11 w-full rounded-lg border border-gray-300 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none"
                    />
                </form>

                {/* 4. 사용자 메뉴 */}
                <UserMenu user={user} isLoading={isLoading} onLogout={logout} />
            </div>
        </header>
    );
}

export default Header;