import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import DatePicker from '../common/DatePicker.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';
import { toDateKey, formatTime, isDiscounted } from '../../utils/format.js';

// 상세 예약 상자 (CLASS-002), detail은 상세 API 응답 data
function ClassBookingBox({ detail }) {
    const { classId, classType, price, salePrice, discountRate, isEnrolled } = detail;

    const isOnline = classType === 'ONLINE';
    // 오프라인은 다른 날짜로 다시 예약할 수 있어서 온라인만 이미 수강 중이면 막음
    const isAlreadyEnrolled = isOnline && isEnrolled;
    const hasDiscount = isDiscounted(detail);
    const unitPrice = salePrice ?? price;
    const discountAmount = price - unitPrice;

    const [selectedDateKey, setSelectedDateKey] = useState(null);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [quantity, setQuantity] = useState(1);


    const [schedules, setSchedules] = useState([]);
    // 온라인은 일정이 없어서 처음부터 done
    const [scheduleLoadState, setScheduleLoadState] = useState(isOnline ? 'done' : 'loading');

    useEffect(() => {
        if (isOnline) return;

        // 다른 클래스로 빨리 이동하면 늦게 도착한 예전 응답은 무시함
        let ignore = false;

        async function fetchSchedules() {
            try {
                const response = await authFetch(`/classes/${encodeURIComponent(classId)}/schedules`, {
                    // 비로그인도 보는 화면이라 토큰 문제가 있어도 로그인 페이지로 보내지 않음
                    silentAuthError: true,
                });
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                if (!response.ok || !result.success) {
                    setScheduleLoadState('error');
                    return;
                }
                setSchedules(result.data);
                setScheduleLoadState('done');
            } catch {
                if (!ignore) setScheduleLoadState('error');
            }
        }

        fetchSchedules();

        return () => {
            ignore = true;
        };
    }, [classId, isOnline]);

    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    // 'login'이면 로그인 필요 팝업, 없으면 null
    const [modal, setModal] = useState(null);
    const [bookingError, setBookingError] = useState('');
    // 버튼을 연달아 눌러 두 번 담기지 않게 막음
    const [isSubmitting, setIsSubmitting] = useState(false);

    function checkLogin() {
        // 새로고침 직후 로그인 확인 중에는 팝업을 띄우지 않음
        if (isLoading) return false;
        if (!user) {
            setModal('login');
            return false;
        }
        return true;
    }

    // 온라인은 고를 게 없어서 바로 통과함
    function checkSelection() {
        // 버튼이 막혀 있어도 한 번 더 막음
        if (isAlreadyEnrolled) return false;
        if (isOnline) return true;
        if (!selectedScheduleId) {
            setBookingError('날짜와 시간을 선택해 주세요.');
            return false;
        }
        // 인원 초과 문구는 인원 칸 아래에 이미 보이고 있어서 여기선 막기만 함
        if (isOverCapacity) return false;
        setBookingError('');
        return true;
    }

    // 성공하면 { cartItemId, alreadyInCart }, 실패하면 안내 문구를 띄우고 null
    async function putInCart() {
        setIsSubmitting(true);
        setBookingError('');
        try {
            // 회원 번호와 가격은 서버가 토큰과 DB로 판단해서 보내지 않음
            const response = await authFetch('/cart', {
                method: 'POST',
                body: JSON.stringify({
                    classId,
                    scheduleId: isOnline ? null : selectedScheduleId,
                    quantity: isOnline ? 1 : quantity,
                }),
            });
            const result = await response.json().catch(() => ({}));

            if (!response.ok || !result.success) {
                // 서버가 거절한 이유(마감, 자리 부족, 이미 수강 중 등)를 그대로 보여줌
                setBookingError(result.message || '장바구니에 담지 못했습니다. 잠시 후 다시 시도해 주세요.');
                return null;
            }
            return result.data;
        } catch {
            // 서버가 꺼져 있는 등 서버에 닿지 못한 실패
            setBookingError('장바구니에 담지 못했습니다. 잠시 후 다시 시도해 주세요.');
            return null;
        } finally {
            // 성공, 실패와 상관없이 다시 누를 수 있게 함
            setIsSubmitting(false);
        }
    }

    // 예약하기, 수강 신청하기는 장바구니에 담고 바로 장바구니로 이동함 (이미 있어도 이동)
    async function handleReserve() {
        if (!checkSelection()) return;
        if (!checkLogin()) return;
        const data = await putInCart();
        if (!data) return;
        navigate('/carts');
    }

    // 장바구니 담기는 완료 팝업을 띄우고, 이미 있으면 바로 장바구니로 감
    async function handleAddToCart() {
        if (!checkSelection()) return;
        if (!checkLogin()) return;
        const data = await putInCart();
        if (!data) return;
        if (data.alreadyInCart) {
            navigate('/carts');
            return;
        }
        setModal('cartAdded');
    }

    // 자리가 남은 OPEN 일정이 하나라도 있는 날만 예약할 수 있음
    const availableDateKeys = [
        ...new Set(
            schedules
                .filter((s) => s.status === 'OPEN' && s.remainingSeats > 0)
                .map((s) => toDateKey(s.startAt)),
        ),
    ];

    const timesOfDate = schedules
        .filter((s) => toDateKey(s.startAt) === selectedDateKey)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

    const selectedSchedule = schedules.find((s) => s.scheduleId === selectedScheduleId) ?? null;
    const remainingSeats = selectedSchedule?.remainingSeats ?? null;
    // 인원을 고른 뒤 시간을 바꾸면 남은 자리보다 많아질 수 있음
    const isOverCapacity = remainingSeats !== null && quantity > remainingSeats;
    // 시간을 골랐으면 남은 자리, 아니면 최대 정원까지 늘릴 수 있음
    const maxQuantity = remainingSeats ?? detail.maxCapacity ?? 1;

    // 온라인은 1명으로 고정
    const totalPrice = unitPrice * (isOnline ? 1 : quantity);

    // 결제 금액의 1%(소수점 버림), 쿠폰과 포인트 적용 전이라 최대로 표시하고 실제 적립은 결제 때 서버가 계산함
    const maxEarnPoint = Math.floor(totalPrice * 0.01);

    // 날짜가 바뀌면 시간 목록도 바뀌어서 시간을 다시 고르게 함
    function handleSelectDate(dateKey) {
        setSelectedDateKey(dateKey);
        setSelectedScheduleId(null);
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-end justify-between">
                {hasDiscount ? (
                    <span className="text-3xl font-semibold text-point">{discountRate}%</span>
                ) : (
                    <span />
                )}
                <p className="flex items-baseline gap-1.5">
                    {!isOnline && <span className="text-sm text-gray-500">1인</span>}
                    <span className="text-2xl font-semibold text-gray-900">{unitPrice.toLocaleString()}원</span>
                </p>
            </div>

            {hasDiscount && (
                <dl className="mt-5 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <dt className="text-gray-500">정가</dt>
                        <dd className="text-gray-400 line-through">{price.toLocaleString()}원</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">할인 금액</dt>
                        <dd className="text-gray-700">-{discountAmount.toLocaleString()}원</dd>
                    </div>
                    <div className="flex justify-between">
                        <dt className="text-gray-500">할인 판매가{!isOnline && ' (1인)'}</dt>
                        <dd className="font-semibold text-gray-900">{unitPrice.toLocaleString()}원</dd>
                    </div>
                </dl>
            )}

            <hr className="my-5 border-gray-200" />

            {!isOnline && (
                <>
                    <p className="mb-2 text-sm font-semibold text-gray-900">날짜</p>
                    {scheduleLoadState === 'loading' ? (
                        <p className="rounded-lg bg-gray-50 py-3 text-center text-sm text-gray-500">일정을 불러오는 중...</p>
                    ) : scheduleLoadState === 'error' ? (
                        <p className="rounded-lg bg-gray-50 py-3 text-center text-sm text-gray-500">일정을 불러오지 못했습니다. 새로고침해 주세요.</p>
                    ) : availableDateKeys.length > 0 ? (
                        <DatePicker
                            value={selectedDateKey}
                            onChange={handleSelectDate}
                            isDateDisabled={(dateKey) => !availableDateKeys.includes(dateKey)}
                            emphasizeEnabled
                            showLegend
                        />
                    ) : (
                        <p className="rounded-lg bg-gray-50 py-3 text-center text-sm text-gray-500">예약 가능한 일정이 없습니다.</p>
                    )}

                    {selectedDateKey && (
                        <>
                            <p className="mb-2 mt-5 text-sm font-semibold text-gray-900">시간</p>
                            <div className="grid grid-cols-3 gap-2">
                                {timesOfDate.map((s) => {
                                    const isFull = s.status !== 'OPEN' || s.remainingSeats <= 0;
                                    const isSelected = s.scheduleId === selectedScheduleId;
                                    return (
                                        <button
                                            key={s.scheduleId}
                                            type="button"
                                            disabled={isFull}
                                            onClick={() => {setSelectedScheduleId(s.scheduleId);
                                                                    setBookingError('');
                                            }}
                                            className={`h-11 rounded-lg border text-sm transition ${
                                                isFull
                                                    ? 'border-gray-100 bg-gray-100 text-gray-400 line-through'
                                                    : isSelected
                                                        ? 'border-brand bg-brand font-semibold text-white'
                                                        : 'border-gray-300 text-gray-800 hover:border-brand'
                                            }`}
                                        >
                                            {formatTime(s.startAt)}{isFull && ' 마감'}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                            인원
                            {remainingSeats !== null && (
                                <span className="ml-1 font-normal text-gray-500">(남은 자리 {remainingSeats}명)</span>
                            )}
                        </p>
                        <div className="flex h-10 items-center rounded-lg border border-gray-300">
                            <button
                                type="button"
                                onClick={() => setQuantity(quantity - 1)}
                                disabled={quantity <= 1}
                                aria-label="인원 줄이기"
                                className="flex h-full w-10 items-center justify-center text-gray-700 disabled:text-gray-300"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
                            <button
                                type="button"
                                onClick={() => setQuantity(quantity + 1)}
                                disabled={quantity >= maxQuantity}
                                aria-label="인원 늘리기"
                                className="flex h-full w-10 items-center justify-center text-gray-700 disabled:text-gray-300"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                    {isOverCapacity && (
                        <p className="mt-2 text-sm text-red-600">남은 자리보다 많이 선택했습니다. 인원을 다시 선택해 주세요.</p>
                    )}

                    {/* 옵션은 3차 MVP */}
                    <p className="mb-2 mt-5 text-sm font-semibold text-gray-900">옵션</p>
                    <div className="relative">
                        <select
                            disabled
                            aria-label="옵션 선택"
                            className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm text-gray-400"
                        >
                            <option>옵션 (3차 MVP 예정)</option>
                        </select>
                        <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    </div>

                    <hr className="my-5 border-gray-200" />

                    <div className="mb-5 flex items-center justify-between">
                        <span className="text-sm text-gray-700">총 결제 금액</span>
                        <span className="text-2xl font-semibold text-gray-900">{totalPrice.toLocaleString()}원</span>
                    </div>
                </>
            )}

            <p className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">P</span>
                최대 {maxEarnPoint.toLocaleString()}P 적립
            </p>

            {isAlreadyEnrolled && (
                <p className="mt-4 rounded-lg bg-brand-light py-3 text-center text-sm font-medium text-brand">
                    이미 수강 중인 클래스입니다
                </p>
            )}

            {bookingError && (
                <p role="alert" className="mt-4 text-center text-sm text-red-600">{bookingError}</p>
            )}

            <div className="mt-5 space-y-2">
                <button
                    type="button"
                    onClick={handleReserve}
                    disabled={isSubmitting || isAlreadyEnrolled}
                    className="h-12 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90
                     disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                    {isOnline ? '수강 신청하기' : '예약하기'}
                </button>
                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isSubmitting || isAlreadyEnrolled}
                    className="h-12 w-full rounded-lg border border-brand bg-white text-sm font-semibold text-brand transition hover:bg-gray-50
                     disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400"
                >
                    장바구니 담기
                </button>
            </div>

            {/* MY-002 수강 내역 바로가기 */}
            {isAlreadyEnrolled && (
                <Link
                    to="/my/classes"
                    className="mt-4 flex items-center justify-center gap-0.5 text-sm text-gray-600 hover:text-brand"
                >
                    수강 내역에서 보기
                    <ChevronRight size={16} />
                </Link>
            )}

            {modal === 'login' && (
                <ConfirmModal
                    message="로그인 후 이용 가능한 기능입니다."
                    confirmLabel="로그인하기"
                    onCancel={() => setModal(null)}
                    onConfirm={() => navigate('/login')}
                />
            )}

            {modal === 'cartAdded' && (
                <ConfirmModal
                    message={'장바구니에 담겼습니다.\n확인하시겠습니까?'}
                    confirmLabel="장바구니로 이동"
                    onCancel={() => setModal(null)}
                    onConfirm={() => navigate('/carts')}
                />
            )}
        </div>
    );
}

export default ClassBookingBox;