import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';
import { formatRelativeTime } from '../../utils/format.js';
import { isSafeInternalLink } from '../../utils/link.js';

// 키는 ERD alarms.type 값
const TYPE_LABELS = {
    CLASS: '수업',
    PAYMENT: '결제',
    QNA: '문의',
    NOTICE: '안내',
};

async function fetchAlarms() {
    const response = await authFetch('/alarms', { silentAuthError: true });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '알림을 불러오지 못했습니다.');
    }
    return result.data;
}

// 헤더 알림 버튼과 펼침 창 (MAIN-001), 로그인 회원 공통
function AlarmMenu() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [alarms, setAlarms] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadState, setLoadState] = useState('loading');
    // 바깥 클릭인지 판단하려고 버튼과 펼침 창 전체를 잡음
    const menuRef = useRef(null);

    // 펼치기 전에도 배지 숫자가 보이게 처음에 한 번 불러옴
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

    // 창이 열려 있을 때만, 창 바깥을 누르거나 ESC 키를 누르면 닫히게 함 (카테고리 메뉴와 같은 방식)
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

    // 열 때마다 최신 알림으로 다시 불러옴
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

    function handleClickAlarm(alarm) {
        if (!alarm.isRead) {
            // 바로 반응하게 화면을 먼저 바꾸고 서버에 저장함
            setAlarms((prev) =>
                prev.map((item) => (item.alarmId === alarm.alarmId ? { ...item, isRead: true } : item)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            // 서버 저장이 실패해도 다음에 알림 창을 열 때 서버 값으로 다시 고쳐지니까, 응답을 기다리지 않음
            authFetch(`/alarms/${alarm.alarmId}/read`, { method: 'PATCH', silentAuthError: true })
                .catch(() => {});
        }

        setIsOpen(false);
        if (isSafeInternalLink(alarm.linkUrl)) {
            navigate(alarm.linkUrl);
        }
    }

    async function handleReadAll() {
        try {
            const response = await authFetch('/alarms/read-all', { method: 'PATCH', silentAuthError: true });
            if (!response.ok) return;
            setAlarms((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch {
            // 서버에 닿지 못해도 에러로 멈추지 않게 잡기만 하고, 저장이 안 됐으니 화면은 그대로 둠
        }
    }

    return (
        <div ref={menuRef} className="relative">
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

            {isOpen && (
                <div className="absolute right-0 top-full z-40 mt-3 w-[400px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
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
                                        {/* 읽은 알림은 점을 지우지 않고 투명하게 해서, 모든 줄의 글자 시작 위치를 맞춤 */}
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