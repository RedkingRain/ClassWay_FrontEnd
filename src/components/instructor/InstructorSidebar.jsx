import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const INSTRUCTOR_MENUS = [
    { label: '운영 현황', path: '/instructor/dashboard' },
    { label: '클래스 관리', path: '/instructor/classes' },
    { label: '프로필 · 문의 관리', path: '/instructor/profile' },
];

function InstructorSidebar({ instructorName, tutorStatus }) {
    const { pathname } = useLocation();
    const isApproved = tutorStatus === 'APPROVED';

    const STATUS_MAP = {
        APPROVED: { label: '승인된 강사', className: 'text-point font-medium' },
        PENDING: { label: '승인 대기 강사', className: 'text-orange-500 font-medium' },
        REJECTED: { label: '승인 반려', className: 'text-red-500 font-medium' },
    };
    const statusInfo = STATUS_MAP[tutorStatus] || { label: '강사', className: 'text-gray-500' };

    return (
        <aside className="hidden w-48 shrink-0 lg:block">
            {/* 프로필 정보 */}
            <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" aria-hidden="true" />
                <div className="min-w-0">
                    <p className="truncate font-bold text-gray-900">{instructorName || '강사'} 님</p>
                    <p className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</p>
                </div>
            </div>

            {/* 메뉴 네비게이션 */}
            <nav aria-label="강사 메뉴" className="mt-4">
                <ul className="space-y-1">
                    {INSTRUCTOR_MENUS.map((menu) => {
                        const isActive = pathname.startsWith(menu.path);

                        if (!isApproved) {
                            return (
                                <li key={menu.label}>
                                    <span
                                        aria-disabled="true"
                                        title="강사 승인 완료 후 이용하실 수 있습니다"
                                        className="block cursor-not-allowed rounded-lg px-3 py-2.5 text-sm text-gray-400 select-none"
                                    >
                                        {menu.label}
                                    </span>
                                </li>
                            );
                        }

                        return (
                            <li key={menu.label}>
                                <Link
                                    to={menu.path}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                                        isActive
                                            ? 'font-bold text-gray-900 bg-brand-soft'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{menu.label}</span>
                                    {isActive && <ChevronRight size={16} className="text-gray-900" />}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}

export default InstructorSidebar;
