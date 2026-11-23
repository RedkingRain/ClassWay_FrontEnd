import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authFetch } from '../../utils/auth.js';
import PaymentResultCard from './PaymentResultCard.jsx';

export default function PaymentFail() {
    const [searchParams] = useSearchParams();
    const hasCancelled = useRef(false);

    const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR';
    const errorMessage =
        searchParams.get('message') || '결제가 취소되었거나 오류가 발생했습니다.';
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId || hasCancelled.current) return;
        hasCancelled.current = true;

        // 리다이렉트 취소/실패 시에도 대기 주문 데이터 정리 (선점 정원 즉시 해제)
        authFetch('/payment/cancel_order', {
            method: 'POST',
            body: JSON.stringify({ order_no: orderId }),
        }).catch((err) => console.error('결제 실패/취소 건 주문 정리 오류:', err));
    }, [orderId]);

    const isUserCanceled =
        errorCode === 'USER_CANCEL' || errorCode === 'PAY_PROCESS_CANCELED';
    const isExpired =
        errorCode === 'ORDER_EXPIRED' ||
        errorCode === 'TIMEOUT' ||
        errorCode.includes('EXPIRED');

    const status = isUserCanceled
        ? 'CANCELED'
        : isExpired
          ? 'EXPIRED'
          : 'PAYMENT_FAILED';

    return (
        <PaymentResultCard
            status={status}
            orderNo={orderId || '-'}
            errorCode={errorCode}
            errorMessage={errorMessage}
        />
    );
}
