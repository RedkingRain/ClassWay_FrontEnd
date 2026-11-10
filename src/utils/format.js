// 여러 화면에서 같이 쓰는 표시용 함수 모음

// 분 → "약 N시간" (1시간 미만은 "N분")
export function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}분`;
    return `약 ${Math.round(minutes / 60)}시간`;
}