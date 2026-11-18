import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';

export default function PaymentFail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasCancelled = useRef(false);

    const errorCode = searchParams.get('code');
    const errorMessage = searchParams.get('message') || '결제가 취소되었거나 오류가 발생했습니다.';
    const orderId = searchParams.get('orderId');

    useEffect(() => {
        if (!orderId || hasCancelled.current) return;
        hasCancelled.current = true;

        // 리다이렉트 취소 시에도 대기 주문 데이터 정리
        authFetch('/payment/cancel_order', {
            method: 'POST',
            body: JSON.stringify({ order_no: orderId }),
        }).catch((err) => console.error('결제 실패 건 주문 정리 오류:', err));
    }, [orderId]);

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">결제 실패</h2>
            <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>
            {errorCode && <p className="mt-1 text-xs text-gray-400">오류 코드: {errorCode}</p>}
            <button
                type="button"
                onClick={() => navigate('/carts')}
                className="mt-6 rounded-lg bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 transition"
            >
                장바구니로 돌아가기
            </button>
        </div>
    );
}
