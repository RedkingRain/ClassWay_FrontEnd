import { Routes, Route, Navigate } from 'react-router-dom';
import ClassDetailPage from "./components/classDetail/ClassDetailPage.jsx";
import SupportLayout from './components/main/SupportLayout.jsx';
import TermsPage from './components/main/TermsPage.jsx';
import InquiryPage from './components/main/InquiryPage.jsx';

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
import InstructorLayout from './components/instructor/InstructorLayout.jsx';
import InstructorClassListPage from './components/instructor/InstructorClassListPage.jsx';
import ReadyNotice from './components/common/ReadyNotice.jsx';
import StudyDashboardPage from './components/study/StudyDashboardPage.jsx';
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
                <Route path="/study/:classId" element={<StudyDashboardPage />} />
                    <Route path="/study/:classId/:lectureId" element={<ReadyNotice title="강의 컨텐츠" />} />
                    <Route path="/study/:classId/notice/:postId" element={<ReadyNotice title="공지 / 학습 자료" />} />
                <Route path="/carts" element={<CartPaymentPage />} />
                <Route path="/carts" element={<CartPaymentPage />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />
                <Route path="/order/complete" element={<OrderComplete />} />
                {/* 고객센터 화면은 왼쪽 메뉴 틀(SupportLayout)을 한 번 더 씌움 */}
                <Route element={<SupportLayout />}>
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/support/inquiry" element={<InquiryPage />} />
                </Route>
                <Route path="/admin/tutors" element={<AdminTutorApprovalPage />} />
                <Route path="/instructor" element={<InstructorLayout />}>
                    <Route index element={<Navigate to="classes" replace />} />
                    <Route path="classes" element={<InstructorClassListPage />} />
                    <Route path="classes/new" element={<ReadyNotice title="새 클래스 등록" />} />
                    <Route path="classes/:classId/edit" element={<ReadyNotice title="클래스 정보 수정" />} />
                    <Route path="classes/:classId/schedules" element={<ReadyNotice title="회차 · 예약자 관리" />} />
                    <Route path="classes/:classId/lectures" element={<ReadyNotice title="온라인 강의실 관리" />} />
                    <Route path="dashboard" element={<ReadyNotice title="운영 현황" />} />
                    <Route path="profile" element={<ReadyNotice title="프로필 · 문의 관리" />} />
                </Route>
                {/* 다른 팀원은 아래에 자기 페이지 한 줄씩 추가 */}
                {/* 예) <Route path="/auth/login" element={<LoginPage />} /> */}
            </Route>

            {/* 헤더·푸터가 없어야 하는 페이지는 Layout 바깥(여기)에 추가 */}
        </Routes>
    );
}

export default App;