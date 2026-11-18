import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';
import { formatRelativeTime } from '../../utils/format.js';

// 알림 종류 → 화면 이름 (ERD alarms.type)
const TYPE_LABELS = {
    CLASS: '수업',
    PAYMENT: '결제',
    QNA: '문의',
    NOTICE: '안내',
};

// 사이트 안 주소만 이동 허용 (/로 시작, //로 시작하는 외부 주소는 막기)
// 알림 주소가 잘못 저장돼도 다른 사이트나 javascript: 주소로 이동하지 않게
function isSafeInternalLink(url) {
    return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

// 알림 목록 요청 (GET /alarms) → { alarms, unreadCount }
async function fetchAlarms() {
    const response = await authFetch('/alarms', { silentAuthError: true });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '알림을 불러오지 못했습니다.');
    }
    return result.data;
}

// 헤더 알림 버튼 + 펼침 창 (MAIN-001) — 로그인 회원 공통
function AlarmMenu() {
    const navigate = useNavigate();
    // 펼침 창이 열렸는지
    const [isOpen, setIsOpen] = useState(false);
    // 알림 목록, 안 읽은 개수
    const [alarms, setAlarms] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    // 불러오기 상태: loading / done / error
    const [loadState, setLoadState] = useState('loading');
    // 버튼 + 펼침 창 전체 → 「바깥 클릭」 판단용
    const menuRef = useRef(null);

    // 헤더가 처음 뜰 때 → 배지 숫자를 위해 한 번 불러오기
    useEffect(() => {
        let ignore = false;

        fetchAlarms()
            .then((data) => {
                if (ignore) return;
                setAlarms(data.alarms);
                setUnreadCount(data.unreadCount);
                setLoadState('done');
            })
            .catch(() => {
                if (!ignore) setLoadState('error');
            });

        return () => {
            ignore = true;
        };
    }, []);

    // 열려 있을 때만: 바깥 클릭 · ESC로 닫기 (카테고리 메뉴와 같은 방식)
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(event) {
            if (event.key === 'Escape') setIsOpen(false);
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // 종 버튼 → 열 때마다 최신 알림으로 다시 불러오기
    async function handleToggle() {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        if (!nextOpen) return;

        try {
            const data = await fetchAlarms();
            setAlarms(data.alarms);
            setUnreadCount(data.unreadCount);
            setLoadState('done');
        } catch {
            setLoadState('error');
        }
    }

    // 알림 하나 누르기 → 읽음 처리 + 그 페이지로 이동
    function handleClickAlarm(alarm) {
        if (!alarm.isRead) {
            // 화면을 먼저 바꾸고(바로 반응하게) 서버에 저장
            setAlarms((prev) =>
                prev.map((item) => (item.alarmId === alarm.alarmId ? { ...item, isRead: true } : item)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            authFetch(`/alarms/${alarm.alarmId}/read`, { method: 'PATCH', silentAuthError: true })
                .catch(() => {}); // 실패해도 다음에 열 때 서버 값으로 다시 맞춰짐
        }

        setIsOpen(false);
        if (isSafeInternalLink(alarm.linkUrl)) {
            navigate(alarm.linkUrl);
        }
    }

    // 모두 읽음
    async function handleReadAll() {
        try {
            const response = await authFetch('/alarms/read-all', { method: 'PATCH', silentAuthError: true });
            if (!response.ok) return;
            setAlarms((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch {
            // 실패하면 그대로 둠
        }
    }

    return (
        <div ref={menuRef} className="relative">
            {/* 종 버튼 + 안 읽은 개수 배지 */}
            <button
                type="button"
                onClick={handleToggle}
                aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
                aria-expanded={isOpen}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-point px-1 text-[11px] font-semibold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 펼침 창 */}
            {isOpen && (
                <div className="absolute right-0 top-full z-40 mt-3 w-[400px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    {/* 제목 + 모두 읽음 */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                        <p className="font-semibold text-gray-900">
                            알림{unreadCount > 0 && <span className="ml-1 text-point">{unreadCount}</span>}
                        </p>
                        {unreadCount > 0 && (
                            <button type="button" onClick={handleReadAll} className="text-[13px] text-gray-600 hover:text-brand">
                                모두 읽음
                            </button>
                        )}
                    </div>

                    {/* 목록 */}
                    {loadState === 'loading' ? (
                        <p className="py-12 text-center text-sm text-gray-400">불러오는 중...</p>
                    ) : loadState === 'error' ? (
                        <p className="py-12 text-center text-sm text-gray-400">알림을 불러오지 못했습니다.</p>
                    ) : alarms.length === 0 ? (
                        <p className="py-12 text-center text-sm text-gray-400">새 알림이 없습니다.</p>
                    ) : (
                        <ul className="max-h-[360px] overflow-y-auto">
                            {alarms.map((alarm) => (
                                <li key={alarm.alarmId}>
                                    <button
                                        type="button"
                                        onClick={() => handleClickAlarm(alarm)}
                                        className={`flex w-full gap-3 border-b border-gray-100 px-6 py-5 text-left transition hover:bg-gray-50 ${
                                            alarm.isRead ? 'bg-white' : 'bg-brand-soft'
                                        }`}
                                    >
                                        {/* 안 읽음 초록 점 (읽으면 자리만 남김) */}
                                        <span
                                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                                alarm.isRead ? 'bg-transparent' : 'bg-point'
                                            }`}
                                        />
                                        <span>
                                            <span className="block text-xs text-gray-400">
                                                {TYPE_LABELS[alarm.type] ?? '알림'} · {formatRelativeTime(alarm.createdAt)}
                                            </span>
                                            <span className={`mt-1.5 block text-sm ${alarm.isRead ? 'text-gray-400' : 'text-gray-900'}`}>
                                                {alarm.title}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* 알림 설정 (MY-004) */}
                    <Link
                        to="/my/alarm"
                        onClick={() => setIsOpen(false)}
                        className="block py-4 text-center text-[13px] text-gray-600 hover:text-brand"
                    >
                        알림 설정
                    </Link>
                </div>
            )}
        </div>
    );
}

export default AlarmMenu;