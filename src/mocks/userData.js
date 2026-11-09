// 로그인 기능 완성 전까지 쓰는 가짜 사용자 데이터
// role 값 : STUDENT / TUTOR / ADMIN

export const mockUsers = {
    // 로그인 전 = 사용자 없음
    guest: null,

    // 일반 회원
    student: { name: '김성목', role: 'STUDENT', unreadCount: 3 },

    // 강사 (헤더는 승인 여부와 상관없이 강사 메뉴 보여줌)
    tutor: { name: '김예빈', role: 'TUTOR', tutorStatus: 'APPROVED', unreadCount: 3 },

    // 관리자
    admin: { name: '이관리', role: 'ADMIN', unreadCount: 3 },
};

// 화면 확인할 때 여기만 guest / student / tutor / admin 으로 바꾸기
export const currentUser = mockUsers.guest