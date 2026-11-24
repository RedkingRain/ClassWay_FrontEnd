import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// 관리자 메뉴 목록 — path가 있는 메뉴만 이동 가능
// 나머지는 아직 화면이 없어서 「준비 중」(클릭 안 됨), 화면이 생기면 path만 추가
const ADMIN_MENUS = [
    { label: '운영 통계' },
    { label: '클래스 관리' },
    { label: '강사 승인', path: '/admin/tutors' },
    { label: '회원 관리' },
    { label: '결제 · 환불' },
    { label: '고객 문의' },
    { label: '카테고리 관리' },
    { label: '배너 관리' },
    { label: '쿠폰 관리' },
];

// adminName: 로그인한 관리자 이름 (없으면 '운영 관리자')
function AdminSidebar({ adminName }) {
    // 지금 주소와 같은 메뉴를 「현재 페이지」로 굵게 표시
    const { pathname } = useLocation();

    return (
        // 좁은 화면에서는 본문이 먼저 보이게 사이드바 숨김
        <aside className="hidden w-48 shrink-0 lg:block">
            {/* 1. 관리자 프로필 (사진 API가 없어 회색 원만) */}
            <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{adminName || '운영 관리자'} 님</p>
                    <p className="text-xs text-gray-500">관리자</p>
                </div>
            </div>

            {/* 2. 메뉴 */}
            <nav aria-label="관리자 메뉴" className="mt-4">
                <ul className="space-y-1">
                    {ADMIN_MENUS.map((menu) => {
                        // 화면이 없는 메뉴: 글자만 흐리게, 클릭 안 됨
                        if (!menu.path) {
                            return (
                                <li key={menu.label}>
                                    <span
                                        aria-disabled="true"
                                        title="준비 중인 메뉴입니다"
                                        className="block cursor-not-allowed px-3 py-2.5 text-sm text-gray-400"
                                    >
                                        {menu.label}
                                    </span>
                                </li>
                            );
                        }

                        const isActive = pathname === menu.path;
                        return (
                            <li key={menu.label}>
                                <Link
                                    to={menu.path}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                                        isActive ? 'font-bold text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {menu.label}
                                    {/* 현재 페이지 표시 화살표 */}
                                    {isActive && <ChevronRight size={16} />}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}

export default AdminSidebar;
