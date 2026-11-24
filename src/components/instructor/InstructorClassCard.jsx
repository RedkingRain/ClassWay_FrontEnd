import { useNavigate } from 'react-router-dom';

function InstructorClassCard({ item, onToggleClick }) {
    const navigate = useNavigate();
    const currentMonth = new Date().getMonth() + 1;

    function handleCardClick() {
        // 임시 저장 상태인 경우 바로 작성/수정 페이지로 이동
        if (item.status === 'DRAFT') {
            navigate(`/instructor/classes/${item.classId}/edit`, {
                state: { classTitle: item.title, classType: item.classType }
            });
            return;
        }

        const route = item.classType === 'OFFLINE'
            ? `/instructor/classes/${item.classId}/schedules`
            : `/instructor/classes/${item.classId}/lectures`;

        navigate(route, {
            state: { classTitle: item.title, classType: item.classType }
        });
    }

    function handleEditClick(e) {
        e.stopPropagation();
        navigate(`/instructor/classes/${item.classId}/edit`, {
            state: { classTitle: item.title, classType: item.classType }
        });
    }

    const BADGE_MAP = {
        DRAFT: { text: '임시 저장', color: 'bg-gray-100 text-gray-700' },
        PUBLISHED: { text: '오픈', color: 'bg-green-100 text-green-700' },
        HIDDEN: { text: '비활성', color: 'bg-gray-100 text-gray-600' },
        PENDING: { text: '검토 대기', color: 'bg-amber-100 text-amber-700' },
        STOPPED: { text: '판매 중지', color: 'bg-red-100 text-red-700' },
    };
    const badge = BADGE_MAP[item.status] || { text: item.status, color: 'bg-gray-100 text-gray-600' };

    function getToggleLabel() {
        if (item.status === 'PUBLISHED') return '오픈 중';
        if (item.status === 'HIDDEN') return '비활성';
        if (item.status === 'DRAFT') return '오픈 불가';
        if (item.status === 'PENDING') return '오픈 불가';
        if (item.status === 'STOPPED') return '판매 중지';
        return '비활성';
    }

    const isChecked = item.status === 'PUBLISHED';
    const isToggleDisabled = !item.canToggle || item.status === 'DRAFT' || item.status === 'PENDING' || item.status === 'STOPPED';

    return (
        <div
            onClick={handleCardClick}
            className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        이미지 준비 중
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-500">
                        {item.classType === 'OFFLINE' ? '오프라인' : '온라인'}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className={`rounded px-1.5 py-0.5 font-medium ${badge.color}`}>
                        {badge.text}
                    </span>
                </div>

                <h3 className="mt-1.5 truncate text-base font-bold text-gray-900" title={item.title}>
                    {item.title}
                </h3>

                <div className="mt-1.5 min-h-[1.25rem] text-xs text-gray-500">
                    {item.status === 'DRAFT' && <span>작성 중인 클래스입니다. 작성을 완료하고 검토를 신청해 주세요</span>}
                    {item.status === 'PENDING' && <span>검토가 끝나면 오픈할 수 있습니다</span>}
                    {item.status === 'STOPPED' && <span>관리자가 판매를 중지한 클래스입니다. 해제 관련 1:1 문의</span>}
                    {item.status !== 'DRAFT' && item.status !== 'PENDING' && item.status !== 'STOPPED' && (
                        <>
                            {item.classType === 'OFFLINE' && item.offlineInfo && (
                                <span>
                                    {currentMonth}월 회차 {item.offlineInfo.scheduleCount}개 · 예약{' '}
                                    {item.offlineInfo.reservedCount}명 / 정원 {item.offlineInfo.capacity}명
                                </span>
                            )}
                            {item.classType === 'ONLINE' && item.onlineInfo && (
                                <span>
                                    VOD {item.onlineInfo.lectureCount}강 · 수강생{' '}
                                    {item.onlineInfo.studentCount}명
                                </span>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isToggleDisabled) onToggleClick(item);
                        }}
                        className={`flex items-center gap-2 ${
                            isToggleDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                    >
                        <span className="text-xs font-medium text-gray-600">{getToggleLabel()}</span>
                        <div
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                                isChecked ? 'bg-point' : 'bg-gray-300'
                            }`}
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    isChecked ? 'translate-x-4.5' : 'translate-x-1'
                                }`}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        수정
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InstructorClassCard;
