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

// Date 또는 날짜 글자 → "2026-11-14" (날짜 비교용 열쇠)
export function toDateKey(value) {
    const date = new Date(value);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-11-14" → "2026.11.14 (토)"
export function formatDateWithDay(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${dateKey.replaceAll('-', '.')} (${dayNames[date.getDay()]})`;
}

// "2026-11-14T11:00:00" → "11:00"
export function formatTime(value) {
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}