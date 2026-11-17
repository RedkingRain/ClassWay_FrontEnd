import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, ChevronDown, AlertCircle, ShoppingBag } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { TOSS_CLIENT_KEY } from '../../config/tossPayments.js';

export default function CartPaymentPage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // 1. 상태 관리
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);

    // 오프라인 옵션 변경 상태: { [cartItemId]: { isOpen: boolean, quantity: number, scheduleId: number } }
    const [optionEditState, setOptionEditState] = useState({});

    // 할인 (쿠폰, 포인트)
    const [selectedCouponId, setSelectedCouponId] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [enteredPoint, setEnteredPoint] = useState(0);
    const userTotalPoint = 4500; // 포인트 조회 API 미구현 (UI 예시값)

    // 약관 동의 및 제출 상태
    const [isAgreed, setIsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 2. 초기 데이터 로드 (장바구니 목록 & 사용자 정보)
    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            alert('로그인이 필요한 서비스입니다.');
            navigate('/login?returnUrl=/carts');
            return;
        }

        async function fetchData() {
            setIsLoading(true);
            try {
                // (1) 장바구니 조회: GET /cart
                const cartRes = await authFetch('/cart');
                const cartJson = await cartRes.json();
                if (cartRes.ok && cartJson.success) {
                    const initialItems = (cartJson.data || []).map((item) => ({
                        ...item,
                        isChecked: item.isAvailable, // 구매 가능한 항목만 기본 체크
                    }));
                    setCartItems(initialItems);

                    const editMap = {};
                    initialItems.forEach((item) => {
                        editMap[item.cartItemId] = {
                            isOpen: false,
                            quantity: item.quantity,
                            scheduleId: item.scheduleId,
                        };
                    });
                    setOptionEditState(editMap);
                } else if (cartRes.status === 401) {
                    navigate('/login?returnUrl=/carts');
                    return;
                }

                // (2) 사용자 정보 조회: GET /user/info
                const userRes = await authFetch('/user/info');
                const userJson = await userRes.json();
                if (userRes.ok && userJson.success) {
                    setUserInfo(userJson.data);
                }
            } catch (err) {
                console.error('장바구니 데이터 로드 실패:', err);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [isAuthenticated, authLoading, navigate]);

    // 3. 체크박스 선택/해제 핸들러
    const availableItems = cartItems.filter((item) => item.isAvailable);
    const checkedItems = cartItems.filter((item) => item.isChecked && item.isAvailable);
    const isAllChecked =
        availableItems.length > 0 && availableItems.every((item) => item.isChecked);

    const handleToggleAll = () => {
        const nextChecked = !isAllChecked;
        setCartItems((prev) =>
            prev.map((item) =>
                item.isAvailable ? { ...item, isChecked: nextChecked } : item
            )
        );
    };

    const handleToggleItem = (cartItemId) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartItemId === cartItemId ? { ...item, isChecked: !item.isChecked } : item
            )
        );
    };

    // 장바구니 항목 삭제 API 호출 공통 함수 (단건 / 다건 공용)
    const requestDeleteCartItems = async (cartItemIds) => {
        try {
            const response = await authFetch('/cart', {
                method: 'DELETE',
                body: JSON.stringify({ cartItemIds }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                alert(result.message || '장바구니 항목 삭제에 실패했습니다.');
                return false;
            }

            // 삭제 성공 시 프론트엔드 목록 및 옵션 편집 상태에서도 제거
            setCartItems((prev) =>
                prev.filter((item) => !cartItemIds.includes(item.cartItemId))
            );
            setOptionEditState((prev) => {
                const next = { ...prev };
                cartItemIds.forEach((id) => delete next[id]);
                return next;
            });

            return true;
        } catch (error) {
            console.error('장바구니 삭제 요청 실패:', error);
            alert('장바구니 항목 삭제 중 서버 통신 오류가 발생했습니다.');
            return false;
        }
    };

    // 아이템 단건 삭제 (카드 우측 상단 X 버튼)
    const handleDeleteItem = async (cartItemId) => {
        if (!window.confirm('장바구니에서 삭제하시겠습니까?')) return;
        await requestDeleteCartItems([cartItemId]);
    };

    // 체크된 아이템 다건 삭제 (선택 삭제 버튼)
    const handleDeleteSelected = async () => {
        if (checkedItems.length === 0) {
            alert('삭제할 상품을 선택해 주세요.');
            return;
        }
        if (!window.confirm(`선택한 ${checkedItems.length}개 상품을 삭제하시겠습니까?`)) return;

        const targetIds = checkedItems.map((item) => item.cartItemId);
        await requestDeleteCartItems(targetIds);
    };

    // 4. 오프라인 옵션 변경 열기/닫기 및 수량 제어
    const toggleOptionEdit = (cartItemId) => {
        setOptionEditState((prev) => ({
            ...prev,
            [cartItemId]: {
                ...prev[cartItemId],
                isOpen: !prev[cartItemId]?.isOpen,
            },
        }));
    };

    const handleQuantityChange = (cartItemId, delta) => {
        setOptionEditState((prev) => {
            const currentQty = prev[cartItemId]?.quantity || 1;
            const newQty = Math.max(1, currentQty + delta);
            return {
                ...prev,
                [cartItemId]: {
                    ...prev[cartItemId],
                    quantity: newQty,
                },
            };
        });
    };

    const handleApplyOption = (cartItemId) => {
        alert('현재 옵션 변경 API 준비 중입니다. 인원 및 회차는 백엔드 API 연동 후 적용됩니다.');
        toggleOptionEdit(cartItemId);
    };

    // 5. 포인트 입력 핸들러
    const handlePointChange = (e) => {
        const val = Number(e.target.value.replace(/[^0-9]/g, ''));
        if (val > userTotalPoint) {
            setEnteredPoint(userTotalPoint);
        } else {
            setEnteredPoint(val);
        }
    };

    const handleUseAllPoints = () => {
        if (userTotalPoint < 1000) {
            alert('포인트는 1,000P 이상부터 사용할 수 있습니다.');
            return;
        }
        setEnteredPoint(userTotalPoint);
    };

    // 6. 금액 계산
    const totalProductPrice = useMemo(() => {
        return checkedItems.reduce((acc, cur) => acc + (cur.itemTotalPrice || 0), 0);
    }, [checkedItems]);

    const effectivePoint = Math.min(enteredPoint, Math.max(0, totalProductPrice - couponDiscount));
    const finalPaymentPrice = Math.max(0, totalProductPrice - couponDiscount - effectivePoint);
    const rewardPoint = Math.floor(finalPaymentPrice * 0.01);

    // 7. 결제하기 핸들러 (POST /payment/ready_order -> 토스페이먼츠 호출)
    const handlePayment = async () => {
        if (checkedItems.length === 0) {
            alert('결제 가능한 강의를 최소 1개 이상 선택해 주세요.');
            return;
        }

        if (!isAgreed) {
            alert('주문 내용 확인 및 결제 진행 동의에 체크해 주세요.');
            return;
        }

        if (!window.TossPayments) {
            alert('토스페이먼츠 SDK가 로드되지 않았습니다. 페이지를 새로고침한 후 다시 시도해 주세요.');
            return;
        }

        if (!TOSS_CLIENT_KEY || TOSS_CLIENT_KEY === 'your_toss_client_key_here') {
            alert('.env.local 파일에 유효한 VITE_TOSS_CLIENT_KEY를 먼저 설정해 주세요.');
            return;
        }

        setIsSubmitting(true);
        let currentOrderNo = null;
        try {
            // (1) 결제 대상 목록 생성
            const selectedItems = checkedItems.map((item) => ({
                classId: item.classId,
                scheduleId: item.scheduleId,
                quantity: item.quantity,
            }));

            // (2) 백엔드에 결제 준비 요청: POST /payment/ready_order
            const response = await authFetch('/payment/ready_order', {
                method: 'POST',
                body: JSON.stringify({
                    items: selectedItems,
                    userCouponId: selectedCouponId ? Number(selectedCouponId) : null,
                    usePoint: effectivePoint || 0,
                }),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                alert(result.message || '결제 준비 중 오류가 발생했습니다.');
                window.location.reload();
                return;
            }

            const { orderNo, orderName, amount, customerName, customerEmail } = result.data;
            currentOrderNo = orderNo;

            // (3) 토스페이먼츠 v2 결제창형(Payment Window) 모달 팝업 호출
            const tossPayments = window.TossPayments(TOSS_CLIENT_KEY);
            const customerKey = userInfo?.email || user?.userId?.toString() || window.TossPayments.ANONYMOUS;
            const widgets = tossPayments.widgets({ customerKey });

            // 금액 설정
            await widgets.setAmount({
                currency: 'KRW',
                value: amount,
            });

            // 결제창형(팝업 모달) UI 렌더링
            const paymentWindow = await widgets.renderPaymentWindow({
                orderName: orderName,
            });

            // 구매자가 결제창에서 결제수단을 고르고 결제하기를 누르면 호출
            paymentWindow.on("paymentRequest", async () => {
                try {
                    // 결제 요청 (결제수단 선택 팝업창 호출)
                    await widgets.requestPayment({
                        orderId: orderNo,
                        orderName: orderName,
                        successUrl: `${window.location.origin}/payment/success`,
                        failUrl: `${window.location.origin}/payment/fail`,
                        customerEmail: customerEmail || userInfo?.email || '',
                        customerName: customerName || userInfo?.name || '',
                    });
                } catch (error) {
                    console.error('결제 실패 : ', error);
                }
            });

            // 구매자가 결제창을 닫거나 결제를 포기할 때 호출
            paymentWindow.on("cancel", async () => {
                try {
                    // 사용자가 결제창을 닫거나 취소한 경우 백엔드 대기 주문 데이터 정리 API 호출
                    if (currentOrderNo) {
                        await ready_data_clean(currentOrderNo);
                    }
                } catch (error) {
                    console.error('결제 진행 실패 또는 취소 : ', error);
                }
            });
        } catch (error) {
            console.error('결제 요청 실패 또는 취소:', error);

            // 결제 진행 중 에러가 발생한 경우 백엔드 대기 주문 데이터 정리 API 호출
            if (currentOrderNo) {
                await ready_data_clean(currentOrderNo);
            }

            if (error?.code !== 'USER_CANCEL') {
                alert(error?.message || '결제 진행 중 오류가 발생했습니다.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
                <p className="text-sm text-gray-500">장바구니 정보를 불러오는 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            {/* 상단 타이틀 */}
            <h1 className="mb-6 text-2xl font-bold text-gray-900">장바구니 · 주문 확인</h1>

            {cartItems.length === 0 ? (
                /* 장바구니 비어있음 안내 UI */
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center">
                    <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
                    <p className="mb-6 text-lg font-medium text-gray-700">장바구니에 담긴 클래스가 없습니다</p>
                    <Link
                        to="/classes"
                        className="rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900 transition"
                    >
                        클래스 둘러보기
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* 좌측 영역: 목록 + 주문자 정보 + 할인 적용 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 전체 선택 바 */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-800">
                                <input
                                    type="checkbox"
                                    checked={isAllChecked}
                                    onChange={handleToggleAll}
                                    className="h-4 w-4 rounded border-gray-300 accent-emerald-800 cursor-pointer"
                                />
                                전체 선택 ({checkedItems.length}/{cartItems.length})
                            </label>
                            <button
                                type="button"
                                onClick={handleDeleteSelected}
                                className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition"
                            >
                                선택 삭제
                            </button>
                        </div>

                        {/* 강의 카드 목록 */}
                        <div className="space-y-4">
                            {cartItems.map((item) => {
                                const isOffline =
                                    item.rawClassType === 'OFFLINE' || item.classType === '오프라인';
                                const editState = optionEditState[item.cartItemId] || {
                                    isOpen: false,
                                    quantity: item.quantity,
                                };

                                return (
                                    <div
                                        key={item.cartItemId}
                                        className={`rounded-xl border bg-white p-5 transition-all ${
                                            !item.isAvailable
                                                ? 'border-gray-200 opacity-60'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* 선택 체크박스 */}
                                            <input
                                                type="checkbox"
                                                disabled={!item.isAvailable}
                                                checked={Boolean(item.isChecked)}
                                                onChange={() => handleToggleItem(item.cartItemId)}
                                                className="mt-1 h-4 w-4 rounded border-gray-300 accent-emerald-800 disabled:cursor-not-allowed cursor-pointer"
                                            />

                                            {/* 썸네일 */}
                                            <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200">
                                                {item.thumbnailUrl ? (
                                                    <img
                                                        src={item.thumbnailUrl}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                                                        이미지
                                                    </div>
                                                )}
                                            </div>

                                            {/* 상품 상세 설명 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        {item.classType}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {/* 오프라인이고 수강 가능할 때 [옵션 변경] 버튼 */}
                                                        {isOffline && item.isAvailable && (
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleOptionEdit(item.cartItemId)}
                                                                className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                                            >
                                                                옵션 변경
                                                            </button>
                                                        )}
                                                        {/* 오프라인이고 마감/불가할 때 [다시 선택] 버튼 */}
                                                        {isOffline && !item.isAvailable && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    alert('해당 클래스 상세 페이지에서 다른 일정을 선택해 주세요.')
                                                                }
                                                                className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                                            >
                                                                다시 선택
                                                            </button>
                                                        )}
                                                        {/* 삭제(X) 버튼 */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteItem(item.cartItemId)}
                                                            className="text-gray-400 hover:text-gray-600 transition"
                                                            title="삭제"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h3 className="mt-1 text-base font-bold text-gray-900 truncate">
                                                    {item.title}
                                                </h3>

                                                {/* 강의 상세 정보 */}
                                                <div className="mt-1 text-xs text-gray-500">
                                                    {isOffline ? (
                                                        <>
                                                            <span>{item.startAt} · {item.region}</span>
                                                            <span className="block mt-0.5">인원 {item.quantity}명</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{item.vodCnt || 'VOD'} · {item.region} (기한 없이 계속 수강)</span>
                                                            <span className="block mt-0.5">옵션 없음</span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* 수강 불가 경고 문구 */}
                                                {!item.isAvailable && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                                                        <AlertCircle size={14} />
                                                        <span>{item.disabledReason || '정원이 마감되어 결제할 수 없습니다. 회차를 다시 선택해 주세요.'}</span>
                                                    </div>
                                                )}

                                                {/* 가격 표시 영역 */}
                                                <div className="mt-3 flex items-baseline justify-end gap-2">
                                                    {(item.saleRate > 0 || (item.price && item.price > item.salePrice)) && (
                                                        <>
                                                            <span className="text-sm font-bold text-red-500">
                                                                {item.saleRate || Math.round(((item.price - item.salePrice) / item.price) * 100)}%
                                                            </span>
                                                            <span className="text-sm text-gray-400 line-through">
                                                                {((item.price || item.salePrice) * item.quantity).toLocaleString()}원
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-lg font-bold text-gray-900">
                                                        {(item.itemTotalPrice || item.salePrice * item.quantity || 0).toLocaleString()}원
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 오프라인 옵션 변경 펼침 박스 */}
                                        {isOffline && item.isAvailable && editState.isOpen && (
                                            <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-gray-200 space-y-4">
                                                <h4 className="text-xs font-bold text-gray-700">옵션 변경</h4>

                                                {/* 회차 선택 드롭다운 (API 미제공 상태) */}
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="w-12 font-medium text-gray-600">회차</span>
                                                    <div className="relative flex-1">
                                                        <select
                                                            disabled
                                                            className="w-full appearance-none rounded border border-gray-300 bg-white py-2 pl-3 pr-8 text-xs text-gray-700 disabled:bg-gray-100"
                                                        >
                                                            <option>
                                                                {item.startAt} (남은 자리 {item.remainingCapacity ?? '-'}명)
                                                            </option>
                                                        </select>
                                                        <ChevronDown
                                                            size={16}
                                                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 인원 조절 버튼 */}
                                                <div className="flex items-center gap-4 text-xs">
                                                    <span className="w-12 font-medium text-gray-600">인원</span>
                                                    <div className="flex items-center rounded border border-gray-300 bg-white">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.cartItemId, -1)}
                                                            className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center font-bold text-gray-800">
                                                            {editState.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.cartItemId, 1)}
                                                            className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 하단 안내 및 취소/적용 버튼 */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                    <span className="text-[11px] text-gray-400">
                                                        변경 적용 시 서버에서 정원 · 가격을 다시 확인합니다.
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleOptionEdit(item.cartItemId)}
                                                            className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 transition"
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApplyOption(item.cartItemId)}
                                                            className="rounded bg-emerald-800 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-900 transition"
                                                        >
                                                            변경 적용
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* 주문자 정보 섹션 */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                주문자 정보
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex">
                                    <span className="w-24 text-gray-500">이름</span>
                                    <span className="font-medium text-gray-800">{userInfo?.name || user?.name || '-'}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 text-gray-500">연락처</span>
                                    <span className="font-medium text-gray-800">{userInfo?.phone || '010-0000-0000'}</span>
                                </div>
                                <div className="flex">
                                    <span className="w-24 text-gray-500">이메일</span>
                                    <span className="font-medium text-gray-800">{userInfo?.email || user?.email || '-'}</span>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-gray-400">
                                주문자 정보는 회원정보 관리에서 바꿀 수 있습니다.
                            </p>
                        </div>

                        {/* 할인 적용 섹션 */}
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                            <h2 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                할인 적용
                            </h2>
                            <div className="space-y-4">
                                {/* 쿠폰 */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        쿠폰
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={selectedCouponId}
                                            onChange={(e) => {
                                                setSelectedCouponId(e.target.value);
                                                // 쿠폰 API 미구현 (UI 예시 할인액)
                                                setCouponDiscount(e.target.value ? 10000 : 0);
                                            }}
                                            className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-8 text-sm focus:border-gray-900 focus:outline-none"
                                        >
                                            <option value="">적용 가능한 쿠폰을 선택하세요</option>
                                            <option value="1">첫 수강 할인 10% (최대 10,000원)</option>
                                        </select>
                                        <ChevronDown
                                            size={18}
                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                    </div>
                                </div>

                                {/* 포인트 */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        포인트
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={enteredPoint ? enteredPoint.toLocaleString() : ''}
                                                onChange={handlePointChange}
                                                placeholder="0"
                                                className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-right text-sm font-semibold focus:border-gray-900 focus:outline-none"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                                                P
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleUseAllPoints}
                                            className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                                        >
                                            전액 사용
                                        </button>
                                    </div>
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        보유 {userTotalPoint.toLocaleString()}P · 1,000P 이상부터 사용할 수 있습니다.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 우측 결제 요약 영역 (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                            <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200">
                                결제 금액
                            </h2>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>상품 금액</span>
                                    <span className="font-medium text-gray-900">
                                        {totalProductPrice.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>쿠폰 할인</span>
                                    <span className="font-medium text-emerald-600">
                                        {couponDiscount > 0 ? `-${couponDiscount.toLocaleString()}원` : '0원'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>포인트 사용</span>
                                    <span className="font-medium text-emerald-600">
                                        {effectivePoint > 0 ? `-${effectivePoint.toLocaleString()}P` : '0P'}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-base font-bold text-gray-900">최종 결제 금액</span>
                                    <span className="text-2xl font-black text-gray-900">
                                        {finalPaymentPrice.toLocaleString()}원
                                    </span>
                                </div>
                                <p className="mt-1 text-right text-xs text-gray-400">
                                    결제 시 {rewardPoint.toLocaleString()}P 적립 예정
                                </p>
                            </div>

                            {/* 필수 약관 동의 */}
                            <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer pt-2">
                                <input
                                    type="checkbox"
                                    checked={isAgreed}
                                    onChange={(e) => setIsAgreed(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-emerald-800 cursor-pointer"
                                />
                                <span>
                                    <strong>[필수]</strong> 주문 내용을 확인하였으며 결제 진행 및 취소·환불 규정에 동의합니다.
                                </span>
                            </label>

                            {/* 결제하기 버튼 */}
                            <button
                                type="button"
                                disabled={checkedItems.length === 0 || !isAgreed || isSubmitting}
                                onClick={handlePayment}
                                className="w-full rounded-xl bg-emerald-800 py-3.5 text-base font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                {isSubmitting
                                    ? '결제 준비 중...'
                                    : `${finalPaymentPrice.toLocaleString()}원 결제하기`}
                            </button>

                            <p className="text-center text-xs text-gray-400">
                                결제는 토스페이먼츠 결제창에서 진행됩니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



async function ready_data_clean(orderId) {
    // 대기 주문 데이터 정리
    try {
        await authFetch('/payment/cancel_order', {
            method: 'POST',
            body: JSON.stringify({ order_no: orderId }),
        });
    } catch (cancelErr) {
        console.error('대기 주문 정리 실패:', cancelErr);
    }
}