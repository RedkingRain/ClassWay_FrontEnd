import logo from '../../assets/classway-logo.svg';
import { Search } from 'lucide-react'
import CategoryMenu from "./CategoryMenu.jsx";
import { Link,useNavigate } from 'react-router-dom';
import UserMenu from './UserMenu.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {useState} from "react";

function Header() {
    const { user, isLoading, logout } = useAuth();

    const [keyword, setKeyword] = useState('');
    const navigate = useNavigate();

    // 엔터나 검색 버튼으로 검색 결과 주소로 이동 (MAIN-002)
    function handleSearch(event) {
        // form 기본 동작인 페이지 새로고침을 막음
        event.preventDefault();
        // 공백만 입력하면 빈 검색어로 처리함
        const trimmed = keyword.trim();

        if (trimmed) {
            // 검색어에 &, ?, # 같은 기호가 있어도 주소가 깨지지 않게 변환함
            navigate(`/classes?keyword=${encodeURIComponent(trimmed)}`);
        } else {
            navigate('/classes');
        }
    }

    return (
        <header className="relative border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
                <Link to="/" className="shrink-0">
                    <img src={logo} alt="ClassWay 홈으로" className="h-6 w-auto" />
                </Link>

                {/* 페이지 이동이 아니라 목록을 펼치는 버튼이라 Link가 아닌 button을 씀 */}
                <CategoryMenu />

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