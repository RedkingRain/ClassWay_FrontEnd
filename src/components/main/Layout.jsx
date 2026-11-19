import Header from "./Header.jsx";
import {Outlet} from "react-router-dom";
import Footer from "./Footer.jsx";

// 모든 페이지에 공통으로 씌우는 틀
function Layout() {
    return (
        // 내용이 짧아도 푸터가 맨 아래에 붙게 최소 높이를 화면 전체로 두고 가운데가 남는 공간을 차지함
        <div className="flex min-h-screen flex-col">
            <Header />
            {/* 각 페이지가 이미 main 태그를 써서 겹치지 않게 div를 씀 */}
            <div className="flex-1">
                <Outlet />
            </div>

            <Footer />
            </div>
    );
}

export default Layout;