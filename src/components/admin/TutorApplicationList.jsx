import TutorStatusBadge from './TutorStatusBadge.jsx';
import { formatDate } from '../../utils/format.js';

// 왼쪽 신청 목록 (요청은 페이지가 하고, 여기서는 받은 목록을 그리기만 함)
// listState: loading / done / error
// items: [{ tutorId, name, email, appliedAt, approvalStatus }]
// selectedId: 오른쪽 상세에 보이는 신청 번호 (해당 행을 연한 초록 배경으로 표시)
// onSelect(tutorId): 신청을 클릭하면 오른쪽 상세가 바뀜
function TutorApplicationList({ listState, items, selectedId, errorMessage, onSelect, onRetry }) {
    // 불러오는 중
    if (listState === 'loading') {
        return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
    }

    // 실패: 서버 message + 다시 시도
    if (listState === 'error') {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-gray-500">{errorMessage}</p>
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                    다시 시도
                </button>
            </div>
        );
    }

    // 0건
    if (items.length === 0) {
        return <p className="py-16 text-center text-sm text-gray-400">신청이 없습니다.</p>;
    }

    return (
        // 행 사이 구분선 (서버가 준 순서 = 신청일 오래된 순 그대로)
        <ul className="divide-y divide-gray-100 border-b border-gray-100">
            {items.map((item) => {
                const isSelected = item.tutorId === selectedId;
                return (
                    <li key={item.tutorId}>
                        <button
                            type="button"
                            onClick={() => onSelect(item.tutorId)}
                            aria-current={isSelected ? 'true' : undefined}
                            className={`w-full rounded-lg px-4 py-4 text-left transition ${
                                isSelected ? 'bg-brand-soft' : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* 이름 + 상태 라벨 */}
                            <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-gray-900">{item.name}</span>
                                <TutorStatusBadge status={item.approvalStatus} />
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{formatDate(item.appliedAt)} 신청</p>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

export default TutorApplicationList;
