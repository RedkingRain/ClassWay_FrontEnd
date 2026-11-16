// 일정 API 완성 전까지 쓰는 가짜 데이터
// 모양 = GET /classes/{classId}/schedules 응답의 data
// 1번(오프라인)만 일정이 있음 — 주말 11:00 / 14:00 / 17:00, 정원 6명
// 1차는 원데이만: 일정 1줄 = 수업 1회 (class_schedules)
// - startAt: 시작 일시 (start_at)
// - runningTime: 진행 시간 (running_time, "03:00:00" = 3시간) → 끝나는 시각 = startAt + runningTime
// - remainingSeats: 남은 자리 = 정원(capacity) - 예약 인원(reserved_count), 서버가 계산해서 보냄
// - status: OPEN(예약 가능) / FULL(마감) / CANCELED(취소) / DONE(종료)

export const mockSchedules = {
    1: [
        { scheduleId: 1, startAt: '2026-11-14T11:00:00', runningTime: '03:00:00', remainingSeats: 4, status: 'OPEN' },
        { scheduleId: 2, startAt: '2026-11-14T14:00:00', runningTime: '03:00:00', remainingSeats: 6, status: 'OPEN' },
        { scheduleId: 3, startAt: '2026-11-14T17:00:00', runningTime: '03:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 4, startAt: '2026-11-15T11:00:00', runningTime: '03:00:00', remainingSeats: 3, status: 'OPEN' },
        { scheduleId: 5, startAt: '2026-11-15T14:00:00', runningTime: '03:00:00', remainingSeats: 1, status: 'OPEN' },
        { scheduleId: 6, startAt: '2026-11-21T14:00:00', runningTime: '03:00:00', remainingSeats: 6, status: 'OPEN' },
        { scheduleId: 7, startAt: '2026-11-22T11:00:00', runningTime: '03:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 8, startAt: '2026-11-22T14:00:00', runningTime: '03:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 9, startAt: '2026-11-28T11:00:00', runningTime: '03:00:00', remainingSeats: 5, status: 'OPEN' },
        { scheduleId: 10, startAt: '2026-11-28T14:00:00', runningTime: '03:00:00', remainingSeats: 2, status: 'OPEN' },
        { scheduleId: 11, startAt: '2026-12-05T14:00:00', runningTime: '03:00:00', remainingSeats: 6, status: 'OPEN' },
    ],
};