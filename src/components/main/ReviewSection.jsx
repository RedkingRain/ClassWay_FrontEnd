import { Link } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useApiData } from '../../utils/api.js';

// 메인 수강생 후기 (MAIN-004)
function ReviewSection() {
    const { state, data } = useApiData('/reviews/main');
    const reviews = data ?? [];

    // 불러오는 중, 실패, 0개일 때는 섹션을 숨김
    if (state !== 'done' || reviews.length === 0) {
        return null;
    }

    return (
        <section className="bg-[#F7F7F5] py-11">
            <div className="mx-auto max-w-6xl px-4">
                <h2 className="mb-6 text-2xl font-semibold text-gray-900">수강생 후기</h2>

                <ul className="grid gap-6 md:grid-cols-3">
                    {reviews.map((review) => (
                        <li key={review.reviewId}>
                            <Link
                                to={`/classes/${review.classId}`}
                                className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-7 hover:border-gray-300"
                            >
                                <p className="flex items-center gap-2">
                                    {/* 메인에는 5점 후기만 오므로 별은 항상 5개 채움 */}
                                    <span className="flex gap-0.5" role="img" aria-label="별점 5점">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star key={n} size={18} className="fill-point text-point" />
                                        ))}
                                    </span>
                                    <span className="text-lg font-semibold text-gray-600">5.0</span>
                                </p>

                                <p className="mt-4 line-clamp-3 flex-1 leading-7 text-gray-700">{review.content}</p>

                                <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-5">
                                    {review.thumbnailUrl ? (
                                        <img
                                            src={review.thumbnailUrl}
                                            alt=""
                                            className="h-12 w-16 shrink-0 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-16 shrink-0 rounded-lg bg-brand-light" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-0.5 text-sm font-semibold text-gray-900">
                                            <span className="truncate">{review.classTitle}</span>
                                            <ChevronRight size={14} className="shrink-0" />
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {review.writerNickname} · {review.classType === 'ONLINE' ? '온라인' : '오프라인'} 수강
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

export default ReviewSection;