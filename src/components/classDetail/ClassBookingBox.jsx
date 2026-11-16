import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react';
import DatePicker from '../common/DatePicker.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';
import { addMockCartItem } from "../../mocks/cartData.js";
import { toDateKey, formatTime } from '../../utils/format.js';

// detail: 상세 API 응답 data
function ClassBookingBox({ detail }) {
    const { classId, classType, price, salePrice, discountRate, isEnrolled } = detail;

    const isOnline = classType === 'ONLINE';
    // 이미 수강 중인 온라인 클래스 → 수강 신청 · 장바구니 막기 (오프라인은 다른 날짜 재예약 가능)
    const isAlreadyEnrolled = isOnline && isEnrolled;
    const hasDiscount = discountRate > 0 && salePrice !== null;
    const unitPrice = salePrice ?? price; // 1인 가격 (할인 없으면 정가)
    const discountAmount = price - unitPrice;

    // ───── 오프라인 선택값 기억 ─────
    const [selectedDateKey, setSelectedDateKey] = useState(null); // 고른 날짜
    const [selectedScheduleId, setSelectedScheduleId] = useState(null); // 고른 시간(일정)
    const [quantity, setQuantity] = useState(1); // 인원


    // ───── 오프라인 일정 (GET /classes/{classId}/schedules) ─────
    const [schedules, setSchedules] = useState([]);
    // 일정 불러오기 상태: loading / done / error (온라인은 일정이 없어서 처음부터 done)
    const [scheduleLoadState, setScheduleLoadState] = useState(isOnline ? 'done' : 'loading');

    useEffect(() => {
        if (isOnline) return; // 온라인은 일정이 없음

        let ignore = false; // 늦게 온 예전 응답 무시

        async function fetchSchedules() {
            try {
                const response = await authFetch(`/classes/${encodeURIComponent(classId)}/schedules`, {
                    silentAuthError: true, // 비로그인도 보는 화면
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

    // ───── 로그인 확인 · 팝업 ─────
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    // 지금 떠 있는 팝업 (없으면 null / 'login': 로그인 필요)
    const [modal, setModal] = useState(null);
    // 버튼 위에 보여줄 안내 문구 (없으면 빈 글자)
    const [bookingError, setBookingError] = useState('');
    // 담는 중인지 (버튼 연속 클릭으로 두 번 담기는 것 방지)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 로그인 안 했으면 로그인 팝업 띄우고 false
    function checkLogin() {
        if (isLoading) return false; // 새로고침 직후 로그인 확인 중이면 잠깐 무시
        if (!user) {
            setModal('login');
            return false;
        }
        return true;
    }

    // 오프라인: 날짜 · 시간 · 인원을 제대로 골랐는지 확인 (온라인은 고를 게 없어서 통과)
    function checkSelection() {
        if (isAlreadyEnrolled) return false; // 버튼이 막혀 있지만 한번 더 안전장치
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

    // 장바구니에 담기 (오프라인은 고른 일정 · 인원, 온라인은 1명)
    // 결과: { alreadyInCart: true/false }
    async function putInCart() {
        setIsSubmitting(true);
        try {
            return await addMockCartItem({
                classId,
                scheduleId: isOnline ? null : selectedScheduleId,
                quantity: isOnline ? 1 : quantity,
            });
        } finally {
            setIsSubmitting(false); // 성공 · 실패 상관없이 다시 누를 수 있게
        }
    }

    // 예약하기 / 수강 신청하기 → 장바구니에 담고 바로 장바구니로 (이미 있으면 그냥 이동)
    async function handleReserve() {
        if (!checkSelection()) return;
        if (!checkLogin()) return;
        await putInCart();
        navigate('/carts');
    }

    // 장바구니 담기 → 담기 완료 팝업 (이미 있으면 바로 장바구니로)
    async function handleAddToCart() {
        if (!checkSelection()) return;
        if (!checkLogin()) return;
        const { alreadyInCart } = await putInCart();
        if (alreadyInCart) {
            navigate('/carts');
            return;
        }
        setModal('cartAdded');
    }

    // 예약 가능한 날짜 = 자리 남은 OPEN 일정이 하나라도 있는 날 (중복 제거)
    const availableDateKeys = [
        ...new Set(
            schedules
                .filter((s) => s.status === 'OPEN' && s.remainingSeats > 0)
                .map((s) => toDateKey(s.startAt)),
        ),
    ];

    // 고른 날짜의 시간 목록 (빠른 시간 순)
    const timesOfDate = schedules
        .filter((s) => toDateKey(s.startAt) === selectedDateKey)
        .sort((a, b) => new Date(a.startAt) - new Date(b.startAt));

    // 고른 일정 + 남은 자리
    const selectedSchedule = schedules.find((s) => s.scheduleId === selectedScheduleId) ?? null;
    const remainingSeats = selectedSchedule?.remainingSeats ?? null;
    // 고른 인원이 남은 자리보다 많은지 (시간을 바꿨을 때 생길 수 있음)
    const isOverCapacity = remainingSeats !== null && quantity > remainingSeats;
    // + 버튼 최대치: 시간 골랐으면 남은 자리, 아니면 최대 정원
    const maxQuantity = remainingSeats ?? detail.maxCapacity ?? 1;

    // 총 결제 금액 (온라인은 1명 고정)
    const totalPrice = unitPrice * (isOnline ? 1 : quantity);

    // 적립 예정 포인트: 실제 결제 금액의 1%, 소수점 버림
    // 상세에서는 쿠폰 · 포인트 적용 전 금액이라 「최대」로 표시 (실제 적립은 결제 시 서버가 계산)
    const maxEarnPoint = Math.floor(totalPrice * 0.01);

    // 날짜 바꾸면 시간은 다시 고르기
    function handleSelectDate(dateKey) {
        setSelectedDateKey(dateKey);
        setSelectedScheduleId(null);
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
            {/* ───── 가격 ───── */}
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

            {/* ───── 오프라인: 날짜 · 시간 · 인원 · 옵션 · 총액 ───── */}
            {!isOnline && (
                <>
                    {/* 날짜 */}
                    <p className="mb-2 text-sm font-semibold text-gray-900">날짜</p>
                    {/* 날짜 — 불러오는 중 / 실패 / 일정 있음 / 일정 없음 */}
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

                    {/* 시간 — 날짜 고른 뒤에만 */}
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

                    {/* 인원 */}
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
                    {/* 남은 자리 초과 안내 */}
                    {isOverCapacity && (
                        <p className="mt-2 text-sm text-red-600">남은 자리보다 많이 선택했습니다. 인원을 다시 선택해 주세요.</p>
                    )}

                    {/* 옵션 — 3차 MVP */}
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

                    {/* 총 결제 금액 */}
                    <div className="mb-5 flex items-center justify-between">
                        <span className="text-sm text-gray-700">총 결제 금액</span>
                        <span className="text-2xl font-semibold text-gray-900">{totalPrice.toLocaleString()}원</span>
                    </div>
                </>
            )}

            {/* ───── 적립 예정 포인트 ───── */}
            <p className="flex items-center justify-center gap-2 text-sm text-gray-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">P</span>
                최대 {maxEarnPoint.toLocaleString()}P 적립
            </p>

            {/* ───── 이미 수강 중 (온라인) ───── */}
            {isAlreadyEnrolled && (
                <p className="mt-4 rounded-lg bg-brand-light py-3 text-center text-sm font-medium text-brand">
                    이미 수강 중인 클래스입니다
                </p>
            )}

            {/* ───── 버튼 누를 때 빠진 선택 안내 ───── */}
            {bookingError && (
                <p role="alert" className="mt-4 text-center text-sm text-red-600">{bookingError}</p>
            )}

            {/* ───── 버튼 ───── */}
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

            {/* 이미 수강 중이면 수강 내역 바로가기 (MY-002) */}
            {isAlreadyEnrolled && (
                <Link
                    to="/my/classes"
                    className="mt-4 flex items-center justify-center gap-0.5 text-sm text-gray-600 hover:text-brand"
                >
                    수강 내역에서 보기
                    <ChevronRight size={16} />
                </Link>
            )}

            {/* ───── 팝업 ───── */}
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