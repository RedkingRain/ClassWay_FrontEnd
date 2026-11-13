import Header from "./Header.jsx";
import {Outlet} from "react-router-dom";
import Footer from "./Footer.jsx";

// 모든 페이지에 공통으로 씌우는 틀 (헤더 + 페이지 자리 + 푸터)
function Layout() {
    return (
        // flex flex-col : 헤더,내용,푸터를 세로로 쌓기
        // min-h-screen : 최소 높이를 화면 전체로 -> 내용이 짧아도 푸터가 맨 아래로 붙음
        <div className="flex min-h-screen flex-col">
            {/* 항상 위치 고정되는 헤더 */}
            <Header />
            {/* flex-1: 남는 세로 공간을 전부 차지 → 푸터를 아래로 밀어냄 */}
            {/* main 태그 대신 div: 각 페이지(MainPage 등)가 이미 <main>을 쓰고 있어서 중복 방지 */}
            <div className="flex-1">
                {/* 주소에 맞는 페이지가 여기에 들어옴 (ex_ / → MainPage, /auth/login → LoginPage ...) */}
                <Outlet />
            </div>

            {/* 항상 위치 고정되는 푸터 */}
            <Footer />
            </div>
    );
}

export default Layout;