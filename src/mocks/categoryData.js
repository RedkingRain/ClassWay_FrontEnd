// 카테고리 API 완성 전까지 쓰는 가짜 데이터
// 모양 = GET /api/categories 응답의 data
// - 서버가 사용 중(is_active = TRUE)인 카테고리만 category_id 순서로 보내준다고 가정
// - classCount: 공개(PUBLISHED) 클래스 수 (DB에 저장 X, 서버가 세서 보내줌)
// - categoryId 3 · 4는 클래스 상세 목업(classDetailData.js)과 같은 번호

export const mockCategories = [
    { categoryId: 1, name: '드로잉', classCount: 86 },
    { categoryId: 2, name: '공예 · DIY', classCount: 124 },
    { categoryId: 3, name: '베이킹 · 요리', classCount: 128 },
    { categoryId: 4, name: '운동 · 라이프', classCount: 73 },
    { categoryId: 5, name: '음악', classCount: 52 },
    { categoryId: 6, name: '사진 · 영상', classCount: 64 },
    { categoryId: 7, name: '디자인', classCount: 91 },
    { categoryId: 8, name: 'IT', classCount: 58 },
    { categoryId: 9, name: 'AI', classCount: 37 },
    { categoryId: 10, name: '외국어', classCount: 45 },
];