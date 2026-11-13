import logo from '../../assets/classway-logo.svg';
import { Menu, Search } from 'lucide-react'
import { Link,useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {useState} from "react";

function Header() {
    const { user, isLoading, logout } = useAuth();

    // 검색창에 입력한 글자 기억
    const [keyword, setKeyword] = useState('');
    const navigate = useNavigate();

    // 엔터 또는 검색 → 검색 결과 주소로 이동 (MAIN-002)
    function handleSearch(event) {
        event.preventDefault(); // form 기본 동작(페이지 새로고침) 막기
        const trimmed = keyword.trim(); // 앞뒤 공백 제거 → "  " 같은 공백만 입력은 빈 검색어로 처리

        if (trimmed) {
            // encodeURIComponent: 검색어에 &, ?, # 같은 기호가 있어도 주소가 깨지지 않게 변환
            navigate(`/search?keyword=${encodeURIComponent(trimmed)}`);
        } else {
            // 검색어 없으면 전체 클래스 목록
            navigate('/classes');
        }
    }

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
                <form onSubmit={handleSearch} role="search" className="relative max-w-xl flex-1">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="search"
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
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