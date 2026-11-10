import { ChevronDown, Download } from 'lucide-react';

// detail: 상세 API 응답 data
function ClassBookingBox({ detail }) {
    const { classType, price, salePrice, discountRate } = detail;

    const isOnline = classType === 'ONLINE';
    const hasDiscount = discountRate > 0 && salePrice !== null;
    // 실제로 내는 1인 가격 (할인 없으면 정가)
    const unitPrice = salePrice ?? price;
    const discountAmount = price - unitPrice;

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
                    {/* 오프라인은 인원수만큼 결제라 "1인" 표시 */}
                    {!isOnline && <span className="text-sm text-gray-500">1인</span>}
                    <span className="text-2xl font-semibold text-gray-900">{unitPrice.toLocaleString()}원</span>
                </p>
            </div>

            {/* 가격 상세 — 할인 있을 때만 */}
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

            {/* ───── 오프라인: 날짜·시간·인원·옵션 ───── */}
            {!isOnline && (
                <>
                    {/* 날짜·시간·인원 (36강에서 구현) */}
                    <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-400">
                        날짜 · 시간 · 인원 선택 영역
                    </div>

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
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                        />
                    </div>

                    <hr className="my-5 border-gray-200" />
                </>
            )}

            {/* ───── 포인트 적립 — 정책 확정 후 ───── */}
            <p className="flex items-center justify-center gap-2 text-sm text-[#3A3A3A]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
          P
        </span>
                포인트 적립 (정책 확정 후)
            </p>

            {/* ───── 쿠폰 받기 — 준비 중 ───── */}
            <button
                type="button"
                disabled
                className="mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-light text-sm text-brand"
            >
                <Download size={15} />
                쿠폰 받기 (준비 중)
            </button>

            {/* ───── 버튼 — 동작은 37강 ───── */}
            <div className="mt-3 space-y-2">
                <button
                    type="button"
                    className="h-12 w-full rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90"
                >
                    {isOnline ? '수강 신청하기' : '예약하기'}
                </button>
                <button
                    type="button"
                    className="h-12 w-full rounded-lg border border-brand bg-white text-sm font-semibold text-brand transition hover:bg-gray-50"
                >
                    장바구니 담기
                </button>
            </div>
        </div>
    );
}

export default ClassBookingBox;