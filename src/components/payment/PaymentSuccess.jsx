import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/auth.js';
import PaymentResultCard from './PaymentResultCard.jsx';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasRequested = useRef(false);

    // 'LOADING' | 'COMPLETED' | 'PROCESSING' | 'PAYMENT_FAILED' | 'EXPIRED' | 'RESERVATION_FAILED'
    const [viewStatus, setViewStatus] = useState('LOADING');
    const [orderData, setOrderData] = useState(null);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    const applyConfirmResponse = (data, fallbackOrderNo) => {
        const status = data?.status || 'PROCESSING';
        setOrderData({
            orderNo: data?.orderNo || fallbackOrderNo,
            orderName: data?.orderName || '-',
            amount: data?.amount ?? amount,
            paymentMethod: data?.paymentMethod || '-',
            reservationStatus: data?.reservationStatus || '예약 확정',
            cancelStatus: data?.cancelStatus || '취소 완료',
            errorCode: data?.errorCode || '-',
            errorMessage: data?.errorMessage || '결제 승인에 실패했습니다.',
            paymentStatus: data?.paymentStatus || '처리 중',
        });
        setViewStatus(status);
    };

    useEffect(() => {
        if (!paymentKey || !orderId || !amount) {
            alert('유효하지 않은 결제 접근입니다.');
            navigate('/carts', { replace: true });
            return;
        }

        // StrictMode 이중 실행 방지
        if (hasRequested.current) return;
        hasRequested.current = true;

        async function confirmOrder() {
            try {
                // 토스 결제 최종 승인 API: POST /payment/orders_confirm
                const response = await authFetch('/payment/orders_confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        paymentKey,
                        order_no: orderId,
                        amount,
                    }),
                });

                const result = await response.json().catch(() => ({}));

                if (response.ok && result.success && result.data) {
                    applyConfirmResponse(result.data, orderId);
                } else {
                    setOrderData({
                        orderNo: orderId,
                        errorCode: 'CONFIRM_VALIDATION_ERROR',
                        errorMessage: result.message || '결제 검증 중 오류가 발생했습니다.',
                    });
                    setViewStatus('PAYMENT_FAILED');
                }
            } catch (err) {
                console.error('결제 승인 통신 에러:', err);
                // 이미 토스 승인이 진행 중일 수 있으므로 cancel_order를 호출하지 않고
                // PAY-002 · 결제 처리 중(PROCESSING) 화면으로 전환하여 [상태 다시 확인]을 유도
                setOrderData({
                    orderNo: orderId,
                    paymentStatus: '처리 중',
                });
                setViewStatus('PROCESSING');
            }
        }

        confirmOrder();
    }, [paymentKey, orderId, amount, navigate]);

    // [상태 다시 확인] 버튼 핸들러: GET /payment/orders/{order_no}/status
    const handleRecheckStatus = async () => {
        const targetOrderNo = orderData?.orderNo || orderId;
        if (!targetOrderNo || isCheckingStatus) return;

        setIsCheckingStatus(true);
        try {
            const response = await authFetch(
                `/payment/orders/${encodeURIComponent(targetOrderNo)}/status`
            );
            const result = await response.json().catch(() => ({}));

            if (response.ok && result.success && result.data) {
                applyConfirmResponse(result.data, targetOrderNo);
            } else {
                alert(result.message || '결제 상태를 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.');
            }
        } catch (err) {
            console.error('결제 상태 재확인 실패:', err);
            alert('서버 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsCheckingStatus(false);
        }
    };

    if (viewStatus === 'LOADING') {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent" />
                <h2 className="mt-6 text-xl font-bold text-gray-800">결제 승인 진행 중</h2>
                <p className="mt-2 text-sm text-gray-500">
                    결제 최종 승인을 처리하는 중입니다. 잠시만 기다려 주세요...
                </p>
            </div>
        );
    }

    return (
        <PaymentResultCard
            status={viewStatus}
            orderNo={orderData?.orderNo || orderId}
            orderName={orderData?.orderName}
            amount={orderData?.amount}
            paymentMethod={orderData?.paymentMethod}
            reservationStatus={orderData?.reservationStatus}
            paymentStatus={orderData?.paymentStatus}
            cancelStatus={orderData?.cancelStatus}
            errorCode={orderData?.errorCode}
            errorMessage={orderData?.errorMessage}
            isCheckingStatus={isCheckingStatus}
            onRecheckStatus={handleRecheckStatus}
        />
    );
}
