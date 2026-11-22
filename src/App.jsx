import { Routes, Route } from 'react-router-dom';
import ClassDetailPage from "./components/classDetail/ClassDetailPage.jsx";

// 공통 틀
import Layout from './components/main/Layout.jsx';

// 각 페이지
import MainPage from './components/main/MainPage.jsx';
import Login from './components/login/Login.jsx'
import FindAccountPage from './components/login/FindAccountPage.jsx';
import Signup from './components/signup/Signup.jsx';
import CartPaymentPage from './components/cart/CartPaymentPage.jsx';
import PaymentSuccess from './components/payment/PaymentSuccess.jsx';
import PaymentFail from './components/payment/PaymentFail.jsx';
import OrderComplete from './components/payment/OrderComplete.jsx';
import ClassListPage from "./components/classList/ClassListPage.jsx";
import AdminTutorApprovalPage from './components/admin/AdminTutorApprovalPage.jsx';
// 다른 팀원 페이지는 여기에 import 추가
// 예) import LoginPage from './components/login/LoginPage.jsx';

function App() {
    return (
        <Routes>
            {/* path 없이 element만 있는 Route = "틀" 역할 */}
            {/* 이 안에 넣은 페이지들은 전부 Layout(헤더+푸터)이 자동으로 씌워짐 */}
            <Route element={<Layout />}>
                {/* "/" 주소로 오면 MainPage를 Layout의 <Outlet /> 자리에 보여줌 */}
                <Route path="/" element={<MainPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/login/find_account" element={<FindAccountPage />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/classes" element={<ClassListPage />} />
                <Route path="/classes/:classId" element={<ClassDetailPage />} />
                <Route path="/carts" element={<CartPaymentPage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />
                <Route path="/order/complete" element={<OrderComplete />} />
                <Route path="/admin/tutors" element={<AdminTutorApprovalPage />} />
                {/* 다른 팀원은 아래에 자기 페이지 한 줄씩 추가 */}
                {/* 예) <Route path="/auth/login" element={<LoginPage />} /> */}
            </Route>

            {/* 헤더·푸터가 없어야 하는 페이지는 Layout 바깥(여기)에 추가 */}
        </Routes>
    );
}

export default App;