import logo from '../../assets/classway-logo.svg';
import { Menu, Search } from 'lucide-react'

function Header() {
    return (
        <header>
            {/* 1. 로고 */}
            <a href="/"><img src={logo} alt="ClassWay 홈으로" width="160" /></a>

            {/* 2. 카테고리 버튼 */}
            <button type="button"><Menu size={20} />카테고리</button>

            {/* 3. 검색창 */}
            <form>
                <Search size ={18}/>
                <input type="search"
                       placeholder="배우고 싶은 클래스를 검색해 보세요"
                       aria-label="클래스 검색"
                />
            </form>

            {/* 4. 사용자 메뉴 (로그인 전) */}
            <nav>
                <a href="/login">로그인</a>
                <a href="/signup">회원가입</a>
            </nav>
        </header>
    )
}

export default Header;