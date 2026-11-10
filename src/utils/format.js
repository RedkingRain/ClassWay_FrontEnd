// 여러 화면에서 같이 쓰는 표시용 함수 모음

// 분 → "약 N시간" (1시간 미만은 "N분")
export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}분`;
    return `약 ${Math.round(minutes / 60)}시간`;
}

// 시간 표시 "2026-10-19T10:21:00" → "2026.10.19"
export function formatDate(dateText) {
    const date = new Date(dateText);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}.${month}.${day}`;
}