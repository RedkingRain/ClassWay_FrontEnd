// 일정 API 완성 전까지 쓰는 가짜 데이터
// 모양 = GET /api/classes/{classId}/schedules 응답의 data
// 1번(오프라인)만 일정이 있음 — 주말 11:00 / 14:00 / 17:00, 정원 6명

export const mockSchedules = {
    1: [
        { scheduleId: 1, startAt: '2026-11-14T11:00:00', remainingSeats: 4, status: 'OPEN' },
        { scheduleId: 2, startAt: '2026-11-14T14:00:00', remainingSeats: 6, status: 'OPEN' },
        { scheduleId: 3, startAt: '2026-11-14T17:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 4, startAt: '2026-11-15T11:00:00', remainingSeats: 3, status: 'OPEN' },
        { scheduleId: 5, startAt: '2026-11-15T14:00:00', remainingSeats: 1, status: 'OPEN' },
        { scheduleId: 6, startAt: '2026-11-21T14:00:00', remainingSeats: 6, status: 'OPEN' },
        { scheduleId: 7, startAt: '2026-11-22T11:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 8, startAt: '2026-11-22T14:00:00', remainingSeats: 0, status: 'FULL' },
        { scheduleId: 9, startAt: '2026-11-28T11:00:00', remainingSeats: 5, status: 'OPEN' },
        { scheduleId: 10, startAt: '2026-11-28T14:00:00', remainingSeats: 2, status: 'OPEN' },
        { scheduleId: 11, startAt: '2026-12-05T14:00:00', remainingSeats: 6, status: 'OPEN' },
    ],
};