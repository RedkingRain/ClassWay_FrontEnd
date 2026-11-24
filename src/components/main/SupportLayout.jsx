import { NavLink, Outlet } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { NOTICE_URL, FAQ_URL } from '../../config/supportLinks.js';

// 공지사항, FAQ는 노션 공개 페이지라 새 창으로 엶
const notionMenus = [
    { label: '공지사항', url: NOTICE_URL },
    { label: '자주 묻는 질문', url: FAQ_URL },
];

const pageMenus = [
    { label: '1:1 문의', to: '/support/inquiry' },
    { label: '약관 · 정책', to: '/terms' },
];

// 고객센터 화면 공통 틀 (왼쪽 메뉴 + 오른쪽 내용)
function SupportLayout() {
    return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:gap-12">
            <aside className="md:w-48 md:shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">고객센터</h2>
                <p className="mt-1 text-xs text-gray-500">평일 10:00 – 18:00</p>

                <nav aria-label="고객센터 메뉴" className="mt-4 border-t border-gray-200 pt-4">
                    <ul className="space-y-1 text-sm">
                        {notionMenus.map((menu) => (
                            <li key={menu.label}>
                                <a
                                    href={menu.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-brand"
                                >
                                    {menu.label}
                                    <ExternalLink size={12} className="text-gray-400" aria-hidden="true" />
                                    <span className="sr-only">(새 창)</span>
                                </a>
                            </li>
                        ))}
                        {pageMenus.map((menu) => (
                            <li key={menu.to}>
                                <NavLink
                                    to={menu.to}
                                    className={({ isActive }) =>
                                        `flex items-center justify-between px-3 py-2 ${
                                            isActive ? 'font-semibold text-brand' : 'text-gray-600 hover:text-brand'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {menu.label}
                                            {isActive && <ChevronRight size={16} aria-hidden="true" />}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* 자식 화면(약관, 1:1 문의)이 들어오는 자리 */}
            <main className="min-w-0 flex-1">
                <Outlet />
            </main>
        </div>
    );
}

export default SupportLayout;