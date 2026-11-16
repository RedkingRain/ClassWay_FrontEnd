import { useEffect, useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import { formatDate } from '../../utils/format.js';
import { authFetch } from '../../utils/auth.js';

const PAGE_SIZE = 5; // 한 번에 받아올 개수 (서버 기본값과 같음)

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

// 수강평 한 페이지 요청 (GET /classes/{classId}/reviews?sort=&page=&size=)
// 컴포넌트 밖에 둔 이유: 화면이 다시 그려질 때마다 함수를 새로 만들지 않게
async function fetchReviewPage(classId, sort, page) {
    const query = new URLSearchParams({ sort, page: String(page), size: String(PAGE_SIZE) });
    const response = await authFetch(`/classes/${encodeURIComponent(classId)}/reviews?${query}`, {
        silentAuthError: true, // 비로그인도 보는 화면 → 토큰 문제로 로그인 페이지로 튕기지 않게
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '수강평을 불러오지 못했습니다.');
    }
    return result.data; // { reviews, totalCount, hasNext }
}

// classId: 클래스 번호, avgRating: 상세 정보에서 받은 평균 별점
function ClassReviewList({ classId, avgRating }) {
    // 정렬 기준 (latest: 최신순 / rating: 별점순)
    const [sort, setSort] = useState('latest');
    // 지금까지 받아온 수강평 (더보기 누를 때마다 뒤에 붙음)
    const [reviews, setReviews] = useState([]);
    // 마지막으로 받아온 페이지 번호 (0부터)
    const [page, setPage] = useState(0);
    // 숨김 · 삭제 뺀 전체 개수, 다음 페이지 여부
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    // 첫 페이지 불러오기 상태: loading / done / error
    const [loadState, setLoadState] = useState('loading');
    // 더보기 중인지, 더보기 실패 안내
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');

    // 처음 열 때 · 정렬 바꿀 때 → 첫 페이지부터 다시 받기
    useEffect(() => {
        let ignore = false; // 늦게 온 예전 응답 무시 (상세 페이지와 같은 원리)
        setLoadState('loading');
        setLoadMoreError('');

        fetchReviewPage(classId, sort, 0)
            .then((data) => {
                if (ignore) return;
                setReviews(data.reviews);
                setTotalCount(data.totalCount);
                setHasNext(data.hasNext);
                setPage(0);
                setLoadState('done');
            })
            .catch(() => {
                if (!ignore) setLoadState('error');
            });

        return () => {
            ignore = true;
        };
    }, [classId, sort]);

    function handleSortChange(event) {
        setSort(event.target.value); // sort가 바뀌면 위 useEffect가 다시 실행됨
        event.target.blur(); // 고른 뒤 선택 상태 해제 → 초록 테두리가 남지 않게
    }

    // 더보기 → 다음 페이지를 받아서 기존 목록 뒤에 붙이기
    async function handleLoadMore() {
        setIsLoadingMore(true);
        setLoadMoreError('');
        try {
            const nextPage = page + 1;
            const data = await fetchReviewPage(classId, sort, nextPage);
            setReviews((prev) => [...prev, ...data.reviews]);
            setTotalCount(data.totalCount);
            setHasNext(data.hasNext);
            setPage(nextPage);
        } catch {
            setLoadMoreError('후기를 더 불러오지 못했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoadingMore(false);
        }
    }

    if (loadState === 'loading') {
        return <p className="py-16 text-center text-gray-400">불러오는 중...</p>;
    }

    if (loadState === 'error') {
        return <p className="py-16 text-center text-gray-400">수강평을 불러오지 못했습니다.</p>;
    }

    // 후기가 없을 때
    if (totalCount === 0) {
        return <p className="py-16 text-center text-gray-400">아직 작성된 후기가 없습니다.</p>;
    }

    return (
        <div>
            {/* 요약 + 정렬 */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <p className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    총 {totalCount.toLocaleString()}개
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
                {reviews.map((review) => (
                    <li key={review.reviewId} className="border-b border-gray-200 py-6">
                        <p className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900">{review.writerNickname}</span>
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

            {/* 더보기 실패 안내 */}
            {loadMoreError && (
                <p role="alert" className="mt-4 text-center text-sm text-red-600">{loadMoreError}</p>
            )}

            {/* 더보기 — 다음 페이지가 있을 때만 */}
            {hasNext && (
                <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="mt-6 w-full rounded-lg border border-gray-300 py-3 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoadingMore ? '불러오는 중...' : '후기 더보기'}
                </button>
            )}
        </div>
    );
}

export default ClassReviewList;