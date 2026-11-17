import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export default function OrderComplete() {
    const [searchParams] = useSearchParams();
    const orderNo = searchParams.get('orderNo');

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">결제가 완료되었습니다!</h2>
            <p className="mt-2 text-sm text-gray-600">
                주문이 성공적으로 접수되어 강의 수강이 가능합니다.
            </p>
            {orderNo && (
                <div className="mt-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-500 border border-gray-200">
                    주문 번호: <span className="font-semibold text-gray-700">{orderNo}</span>
                </div>
            )}
            <div className="mt-8 flex gap-3">
                <Link
                    to="/my/account"
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                    수강 내역 확인
                </Link>
                <Link
                    to="/"
                    className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 transition"
                >
                    홈으로 가기
                </Link>
            </div>
        </div>
    );
}
