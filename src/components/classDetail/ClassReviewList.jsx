import { useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { formatDate } from '../../utils/format.js';
import { mockReviews } from '../../mocks/reviewData.js';

const PAGE_SIZE = 5; // 한 번에 보여줄 개수

// 별 5개 중 rating개 채우기
function StarRating({ rating, size = 16 }) {
    return (
        <span className="flex items-center gap-0.5" aria-label={`별점 ${rating}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
          <Star
              key={n}
              size={size}
              className={n <= rating ? 'fill-point text-point' : 'fill-gray-200 text-gray-200'}
          />
      ))}
    </span>
    );
}

// classId: 클래스 번호, reviewCount·avgRating: 상세 정보에서 받은 값
function ClassReviewList({ classId, reviewCount, avgRating }) {
    // 정렬 기준 기억 (latest: 최신순 / rating: 별점순)
    const [sort, setSort] = useState('latest');
    // 지금 몇 개까지 보여주는지 기억
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // 가짜 데이터 (나중에 API 호출로 교체 — 정렬·페이지는 백엔드가 처리)
    const allReviews = mockReviews[classId] ?? [];

    // 정렬: 원본을 복사([...])한 뒤 정렬 → 원본 배열은 건드리지 않음
    const sortedReviews = [...allReviews].sort((a, b) => {
        if (sort === 'rating' && b.rating !== a.rating) {
            return b.rating - a.rating; // 별점 높은 순 (같으면 아래 최신순으로)
        }
        return new Date(b.createdAt) - new Date(a.createdAt); // 최신순
    });

    const visibleReviews = sortedReviews.slice(0, visibleCount);
    const hasNext = visibleCount < sortedReviews.length;

    // 정렬 바꾸면 처음 5개부터 다시
    function handleSortChange(event) {
        setSort(event.target.value);
        setVisibleCount(PAGE_SIZE);
        event.target.blur(); // 고른 뒤 선택 상태 해제 → 초록 테두리가 남지 않게
    }

    // 후기가 없을 때
    if (allReviews.length === 0) {
        return <p className="py-16 text-center text-gray-400">아직 작성된 후기가 없습니다.</p>;
    }

    return (
        <div>
            {/* 요약 + 정렬 */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <p className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    총 {reviewCount.toLocaleString()}개
                    <span className="flex items-center gap-1">
            <Star size={18} className="fill-point text-point" />
                        {avgRating}
          </span>
                </p>

                {/* 정렬 선택 — 마우스 올리면 초록 테두리 */}
                <div className="group relative w-32">
                    <select
                        value={sort}
                        onChange={handleSortChange}
                        aria-label="후기 정렬"
                        className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-10 text-sm text-gray-800 transition hover:border-brand focus:outline-none focus-visible:border-brand"
                    >
                        <option value="latest">최신순</option>
                        <option value="rating">별점순</option>
                    </select>
                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition group-hover:text-brand"
                    />
                </div>
            </div>

            {/* 후기 목록 */}
            <ul>
                {visibleReviews.map((review) => (
                    <li key={review.reviewId} className="border-b border-gray-200 py-6">
                        <p className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900">{review.writerName}</span>
                            <span className="text-xs text-gray-400">
                {/* 오프라인만 수업일 표시 */}
                                {review.attendedAt && `${formatDate(review.attendedAt)} 수강 · `}
                                {formatDate(review.createdAt)}
              </span>
                        </p>
                        <div className="mt-2">
                            <StarRating rating={review.rating} />
                        </div>
                        <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-700">{review.content}</p>
                    </li>
                ))}
            </ul>

            {/* 더보기 — 남은 후기가 있을 때만 */}
            {hasNext && (
                <button
                    type="button"
                    onClick={() => setVisibleCount(visibleCount + PAGE_SIZE)}
                    className="mt-6 w-full rounded-lg border border-gray-300 py-3 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                    후기 더보기
                </button>
            )}
        </div>
    );
}

export default ClassReviewList;