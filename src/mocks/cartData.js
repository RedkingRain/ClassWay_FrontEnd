// 장바구니 API 완성 전까지 쓰는 가짜 장바구니
// - 실제: POST /api/cart-items → cart_items 테이블에 저장
// - 메모리에만 있어서 새로고침하면 비워짐 (테스트용)
// - 같은 클래스는 장바구니에 1줄만 → 이미 있으면 담지 않고 alreadyInCart: true

const mockCartItems = [];

// 장바구니 담기
// 보내는 값: 클래스 번호, 일정 번호(오프라인만), 인원
// 안 보내는 값: 회원 번호(서버가 로그인 토큰으로 앎), 가격(서버가 DB 가격으로 계산)
export async function addMockCartItem({ classId, scheduleId, quantity }) {
    const alreadyInCart = mockCartItems.some((item) => item.classId === classId);
    if (alreadyInCart) {
        return { alreadyInCart: true };
    }

    mockCartItems.push({ cartItemId: mockCartItems.length + 1, classId, scheduleId, quantity });
    return { alreadyInCart: false };
}