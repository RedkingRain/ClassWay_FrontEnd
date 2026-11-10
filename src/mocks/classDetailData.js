// 클래스 상세 API 완성 전까지 쓰는 가짜 데이터
// 모양 = GET /api/classes/{classId} 응답의 data 부분과 동일
// 키(1, 2) = 클래스 번호 → 주소 /classes/1, /classes/2

export const mockClassDetails = {
    // 오프라인 예시 (DB 샘플 1번)
    1: {
        classId: 1,
        title: '주말 원데이 마카롱 만들기',
        summary: '머랭 치는 법부터 꼬끄 굽기, 필링 채우기까지 3시간 동안 마카롱 20개를 직접 완성합니다.',
        description: '<p>재료와 앞치마는 공방에서 모두 준비해 드리고, 만든 마카롱은 선물 상자에 담아 가져갈 수 있습니다.</p>',
        classType: 'OFFLINE',
        category: { categoryId: 3, name: '베이킹 · 요리' },
        thumbnailUrl: null,
        price: 55000,
        salePrice: 44000,
        discountRate: 20,
        avgRating: 4.9,
        reviewCount: 128,
        wishCount: 420,
        studentCount: 0,
        totalDurationMinutes: 180,
        lectureCount: 4,
        accessDays: null,
        region: '서울 성동구',
        address: '서울 성동구 [상세 주소] · 성수역 3번 출구 도보 5분',
        maxCapacity: 6,
        tutor: { tutorId: 1, nickname: '김하늘', profileImage: null, intro: '성수동 디저트 공방 운영',
            career: '- 제과기능사\n- 성수동 디저트 공방 5년 운영\n- 원데이 클래스 누적 수강생 1,200명', classCount: 3 },
    },

    // 온라인 예시 (DB 샘플 2번)
    2: {
        classId: 2,
        title: '아침 15분 요가 루틴',
        summary: '하루 15분, 아침에 따라 하기 좋은 요가 루틴을 배웁니다.',
        description: '<p>매트 하나만 있으면 집에서 바로 시작할 수 있어요.</p>',
        classType: 'ONLINE',
        category: { categoryId: 4, name: '운동 · 라이프' },
        thumbnailUrl: null,
        price: 29000,
        salePrice: null,
        discountRate: 0,
        avgRating: 4.8,
        reviewCount: 96,
        wishCount: 1050,
        studentCount: 1830,
        totalDurationMinutes: 55,
        lectureCount: 4,
        accessDays: 180,
        region: null,
        address: null,
        maxCapacity: null,
        tutor: { tutorId: 2, nickname: '윤소희', profileImage: null, intro: '요가 강사 · 온라인 클래스 운영',
            career: null, classCount: 2 },
    },
};