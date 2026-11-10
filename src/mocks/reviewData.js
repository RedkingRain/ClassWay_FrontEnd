// 수강평 API 완성 전까지 쓰는 가짜 데이터
// 모양 = GET /api/classes/{classId}/reviews 응답의 data
// 이름은 백엔드가 가려서 보낸다고 가정 (최**)

export const mockReviews = {
    // 1번: 오프라인 (attendedAt = 수업일)
    1: [
        { reviewId: 1, writerName: '최**', rating: 5, content: '머랭이 계속 꺼졌는데 선생님이 손 각도까지 잡아 주셔서 성공했어요. 선물 상자에 담아 가니 친구가 정말 좋아했어요.', attendedAt: '2026-10-18T14:00:00', createdAt: '2026-10-19T10:21:00' },
        { reviewId: 2, writerName: '정**', rating: 4, content: '공방이 넓고 깨끗해요. 3시간이 금방 지나가요.', attendedAt: '2026-10-11T14:00:00', createdAt: '2026-10-12T09:03:00' },
        { reviewId: 3, writerName: '김**', rating: 5, content: '꼬끄가 이렇게 예쁘게 나올 줄 몰랐어요!', attendedAt: '2026-10-04T11:00:00', createdAt: '2026-10-05T20:15:00' },
        { reviewId: 4, writerName: '이**', rating: 3, content: '재밌었지만 인원이 많아서 질문하기가 조금 어려웠어요.', attendedAt: '2026-09-27T14:00:00', createdAt: '2026-09-28T13:40:00' },
        { reviewId: 5, writerName: '박**', rating: 5, content: '친구랑 같이 갔는데 둘 다 만족했어요. 재료가 넉넉해요.', attendedAt: '2026-09-20T14:00:00', createdAt: '2026-09-21T18:02:00' },
        { reviewId: 6, writerName: '윤**', rating: 4, content: '필링 종류가 다양해서 좋았어요.', attendedAt: '2026-09-13T11:00:00', createdAt: '2026-09-14T08:55:00' },
        { reviewId: 7, writerName: '한**', rating: 5, content: '베이킹 처음인데도 따라 할 수 있었어요. 다른 클래스도 들어보고 싶어요.', attendedAt: '2026-09-06T14:00:00', createdAt: '2026-09-07T22:10:00' },
    ],

    // 2번: 온라인 (attendedAt 없음)
    2: [
        { reviewId: 11, writerName: '이**', rating: 5, content: '강의가 짧게 나뉘어 있어서 출근 전에 한 강씩 보기 좋았어요.', attendedAt: null, createdAt: '2026-10-19T07:30:00' },
        { reviewId: 12, writerName: '정**', rating: 4, content: '호흡 설명이 자세해서 좋았어요. 마무리 명상 파트가 조금 더 길었으면 좋겠어요.', attendedAt: null, createdAt: '2026-10-12T21:44:00' },
    ],
};