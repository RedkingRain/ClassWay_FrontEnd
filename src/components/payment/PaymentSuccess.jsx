import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../../utils/auth.js';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [statusMessage, setStatusMessage] = useState('결제 최종 승인을 처리하는 중입니다...');
    const hasRequested = useRef(false);

    useEffect(() => {
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = Number(searchParams.get('amount'));

        if (!paymentKey || !orderId || !amount) {
            alert('유효하지 않은 결제 정보입니다.');
            navigate('/cart');
            return;
        }

        // StrictMode 이중 실행 방지
        if (hasRequested.current) return;
        hasRequested.current = true;

        async function confirmOrder() {
            try {
                // ③ 토스 결제 최종 승인 API: POST /payment/orders_confirm
                const res = await authFetch('/payment/orders_confirm', {
                    method: 'POST',
                    body: JSON.stringify({
                        paymentKey: paymentKey,
                        order_no: orderId,
                        amount: amount,
                    }),
                });

                const result = await res.json();
                if (res.ok && result.success) {
                    setStatusMessage('결제가 성공적으로 완료되었습니다! 이동 중입니다...');
                    alert('결제가 성공적으로 완료되었습니다!');
                    navigate(`/order/complete?orderNo=${result.data?.orderNo || orderId}`);
                } else {
                    setStatusMessage(result.message || '결제 승인에 실패하였습니다.');
                    alert(result.message || '결제 승인에 실패하였습니다.');
                    navigate('/cart');
                }
            } catch (err) {
                console.error('결제 승인 통신 에러:', err);
                setStatusMessage('결제 처리 중 서버 통신 에러가 발생했습니다.');
                alert('결제 처리 중 서버 통신 에러가 발생했습니다.');
                navigate('/cart');
            }
        }

        confirmOrder();
    }, [searchParams, navigate]);

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-800 border-t-transparent" />
            <h2 className="mt-6 text-xl font-bold text-gray-800">결제 승인 진행 중</h2>
            <p className="mt-2 text-sm text-gray-500">{statusMessage}</p>
        </div>
    );
}
