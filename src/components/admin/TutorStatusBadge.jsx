// 강사 신청 상태 라벨 (목록 · 상세에서 같이 사용)
// 시안처럼 배경 없이 글자색으로만 구분
const STATUS_STYLES = {
    PENDING: { label: '승인 대기', className: 'text-orange-600' },
    APPROVED: { label: '승인', className: 'text-point' },
    REJECTED: { label: '반려', className: 'text-red-600' },
};

// status: PENDING / APPROVED / REJECTED
function TutorStatusBadge({ status }) {
    const style = STATUS_STYLES[status];
    if (!style) return null; // 모르는 상태값이면 표시하지 않음

    return (
        <span className={`shrink-0 text-sm font-medium ${style.className}`}>
            {style.label}
        </span>
    );
}

export default TutorStatusBadge;
