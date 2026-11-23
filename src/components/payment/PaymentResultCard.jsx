import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import TermsModal from '../common/TermsModal.jsx';

/**
 * PAY-002 ~ 003 결제 결과·상태별 공통 카드 컴포넌트
 *
 * @param {object} props
 * @param {'COMPLETED' | 'PROCESSING' | 'PAYMENT_FAILED' | 'CANCELED' | 'EXPIRED' | 'RESERVATION_FAILED'} props.status
 * @param {string} [props.orderNo] - 주문번호
 * @param {string} [props.orderName] - 클래스명 (예: 주말 원데이 마카롱 만들기 외 1건)
 * @param {number} [props.amount] - 결제 금액
 * @param {string} [props.paymentMethod] - 결제 수단
 * @param {string} [props.reservationStatus] - 예약 상태 (예: 예약 확정)
 * @param {string} [props.paymentStatus] - 결제 처리 상태 (예: 처리 중)
 * @param {string} [props.cancelStatus] - 예약 확정 실패 시 취소 처리 상태 (data.cancelStatus)
 * @param {string} [props.errorCode] - 실패 오류 코드 (data.errorCode)
 * @param {string} [props.errorMessage] - 실패 사유 (data.errorMessage)
 * @param {boolean} [props.isCheckingStatus] - [상태 다시 확인] 로딩 여부
 * @param {() => void} [props.onRecheckStatus] - [상태 다시 확인] 클릭 핸들러
 */
export default function PaymentResultCard({
    status,
    orderNo = '-',
    orderName = '-',
    amount = 0,
    paymentMethod = '-',
    reservationStatus = '예약 확정',
    paymentStatus = '처리 중',
    cancelStatus = '취소 완료',
    errorCode = '-',
    errorMessage = '결제 처리 중 오류가 발생했습니다.',
    isCheckingStatus = false,
    onRecheckStatus,
}) {
    const [termsModal, setTermsModal] = useState(null);

    // 하단 약관 링크 (취소·환불 규정 / 서비스 이용약관)
    const renderTermsLinks = () => (
        <div className="mt-5 flex items-center justify-center gap-4 text-xs text-gray-400">
            <button
                type="button"
                onClick={() => setTermsModal('ORDER_PAY')}
                className="inline-flex items-center gap-1 hover:text-gray-600 transition"
            >
                취소 · 환불 규정 <ExternalLink size={12} />
            </button>
            <button
                type="button"
                onClick={() => setTermsModal('SERVICE')}
                className="inline-flex items-center gap-1 hover:text-gray-600 transition"
            >
                서비스 이용약관 <ExternalLink size={12} />
            </button>
        </div>
    );

    return (
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12">
            <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
                {/* 1. PAY-002 · 결제 성공 (COMPLETED) */}
                {status === 'COMPLETED' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white">
                            <Check size={28} strokeWidth={2.5} />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            결제가 완료되었습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500">
                            예약이 확정되었습니다.
                        </p>

                        <div className="mt-6 divide-y divide-gray-100 border-t border-b border-gray-200 text-xs">
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">주문번호</span>
                                <span className="font-medium text-gray-800">{orderNo}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">클래스</span>
                                <span className="font-bold text-gray-900">{orderName}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">결제 금액</span>
                                <span className="font-bold text-gray-900">
                                    {Number(amount || 0).toLocaleString()}원
                                </span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">결제 수단</span>
                                <span className="text-gray-700">{paymentMethod}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">예약 상태</span>
                                <span className="font-bold text-emerald-800">
                                    {reservationStatus}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link
                                to="/"
                                className="rounded-lg border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                메인으로
                            </Link>
                            <Link
                                to={`/my/orders/${orderNo}`}
                                className="rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                            >
                                결제 내역 보기
                            </Link>
                        </div>
                        {renderTermsLinks()}
                    </>
                )}

                {/* 2. PAY-002 · 결제 처리 중 (PROCESSING) */}
                {status === 'PROCESSING' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                            <div className="h-7 w-7 animate-spin rounded-full border-3 border-emerald-800 border-t-transparent" />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            결제 상태를 확인하고 있습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            결제가 아직 확정되지 않았습니다. 잠시 후 다시 확인해 주세요.
                            <br />
                            확인 전까지는 결제 완료로 표시하지 않습니다.
                        </p>

                        <div className="mt-6 divide-y divide-gray-100 border-t border-b border-gray-200 text-xs">
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">주문번호</span>
                                <span className="font-medium text-gray-800">{orderNo}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">결제 상태</span>
                                <span className="font-bold text-gray-800">{paymentStatus}</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link
                                to="/"
                                className="rounded-lg border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                메인으로
                            </Link>
                            <button
                                type="button"
                                disabled={isCheckingStatus}
                                onClick={onRecheckStatus}
                                className="rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 disabled:bg-gray-300 transition"
                            >
                                {isCheckingStatus ? '확인 중...' : '상태 다시 확인'}
                            </button>
                        </div>
                        {renderTermsLinks()}
                    </>
                )}

                {/* 3. PAY-003 · 결제 실패 (PAYMENT_FAILED) */}
                {status === 'PAYMENT_FAILED' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white">
                            <X size={28} strokeWidth={2.5} />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            결제에 실패했습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500">{errorMessage}</p>

                        <div className="mt-6 divide-y divide-gray-100 border-t border-b border-gray-200 text-xs">
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">실패 사유</span>
                                <span className="font-medium text-gray-800">{errorMessage}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">오류 코드</span>
                                <span className="font-mono text-gray-500">{errorCode}</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link
                                to="/"
                                className="rounded-lg border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                메인으로
                            </Link>
                            <Link
                                to="/carts"
                                className="rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                            >
                                장바구니로 돌아가기
                            </Link>
                        </div>
                        {renderTermsLinks()}
                    </>
                )}

                {/* 4. PAY-002 · 결제창 취소 (CANCELED) */}
                {status === 'CANCELED' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                            <AlertCircle size={26} />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            결제가 취소되었습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            결제창을 닫아 결제가 완료되지 않았습니다.
                            <br />
                            장바구니 내용은 그대로 남아 있습니다.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/carts"
                                className="block w-full rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                            >
                                장바구니 목록으로 돌아가기
                            </Link>
                        </div>
                    </>
                )}

                {/* 5. PAY-003 · 인증 시간 만료 (EXPIRED) */}
                {status === 'EXPIRED' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                            <Clock size={26} />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            결제 인증 시간이 만료되었습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500">
                            보안을 위해 결제 인증 유효시간이 지나면 다시 결제해야 합니다.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/carts"
                                className="block w-full rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                            >
                                다시 결제하기
                            </Link>
                        </div>
                    </>
                )}

                {/* 6. PAY-002 · 예약 확정 실패 (RESERVATION_FAILED) */}
                {status === 'RESERVATION_FAILED' && (
                    <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <AlertCircle size={28} />
                        </div>
                        <h2 className="mt-5 text-xl font-bold text-gray-900">
                            예약 처리 중 문제가 발생했습니다
                        </h2>
                        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                            결제는 승인되었지만 예약을 확정하지 못했습니다.
                            <br />
                            결제 금액은 자동으로 취소되며, 영업일 기준 3~5일 안에 환불됩니다.
                        </p>

                        <div className="mt-6 divide-y divide-gray-100 border-t border-b border-gray-200 text-xs">
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">주문번호</span>
                                <span className="font-medium text-gray-800">{orderNo}</span>
                            </div>
                            <div className="flex justify-between py-3">
                                <span className="text-gray-500">처리 상태</span>
                                <span className="font-bold text-gray-800">{cancelStatus}</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <Link
                                to="/"
                                className="rounded-lg border border-gray-300 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                메인으로
                            </Link>
                            <Link
                                to={`/my/orders/${orderNo}`}
                                className="rounded-lg bg-emerald-900 py-3 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                            >
                                결제 내역 보기
                            </Link>
                        </div>
                    </>
                )}
            </div>

            {/* 약관 상세 모달 */}
            <TermsModal termsType={termsModal} onClose={() => setTermsModal(null)} />
        </div>
    );
}
