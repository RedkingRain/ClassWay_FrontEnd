import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { formatDate } from '../../utils/format.js';
import { authFetch } from '../../utils/auth.js';
import Dropdown from '../common/Dropdown.jsx';

const SORTS = [
    { value: 'latest', label: '최신순' },
    { value: 'rating', label: '별점순' },
];

// 서버 기본값과 같음
const PAGE_SIZE = 5;

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

// 후기가 올 때까지 글 자리를 회색 상자로 미리 보여 줌
function ReviewSkeleton() {
    return (
        <div role="status" aria-label="수강평 불러오는 중" className="animate-pulse">
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <div className="h-6 w-28 rounded bg-gray-200" />
                <div className="h-10 w-32 rounded-lg bg-gray-200" />
            </div>
            <ul>
                {[1, 2, 3].map((n) => (
                    <li key={n} className="border-b border-gray-200 py-6">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                        <div className="mt-2 h-4 w-24 rounded bg-gray-200" />
                        <div className="mt-3 h-5 w-3/4 rounded bg-gray-200" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

// 화면이 다시 그려질 때마다 새로 만들지 않게 컴포넌트 밖에 둠
async function fetchReviewPage(classId, sort, page) {
    const query = new URLSearchParams({ sort, page: String(page), size: String(PAGE_SIZE) });
    const response = await authFetch(`/classes/${encodeURIComponent(classId)}/reviews?${query}`, {
        // 비로그인도 보는 화면이라 토큰 문제가 있어도 로그인 페이지로 보내지 않음
        silentAuthError: true,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '수강평을 불러오지 못했습니다.');
    }
    return result.data;
}

// 수강평 탭 (CLASS-001), avgRating은 상세 정보에서 받은 평균 별점
function ClassReviewList({ classId, avgRating }) {
    const [sort, setSort] = useState('latest');
    // 더보기를 누를 때마다 뒤에 붙음
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    // 클래스나 정렬이 바뀌면 이름표가 바뀌어서 첫 페이지부터 다시 받음
    const requestKey = `${classId}:${sort}`;
    const [loadedKey, setLoadedKey] = useState(null);
    const [isError, setIsError] = useState(false);
    // 이름표가 다르면 아직 새 첫 페이지를 기다리는 중
    const loadState = loadedKey !== requestKey ? 'loading' : isError ? 'error' : 'done';
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');

    useEffect(() => {
        // 늦게 도착한 예전 응답은 무시함 (상세 페이지와 같은 방식)
        let ignore = false;

        fetchReviewPage(classId, sort, 0)
            .then((data) => {
                if (ignore) return;
                setReviews(data.reviews);
                setTotalCount(data.totalCount);
                setHasNext(data.hasNext);
                setPage(0);
                setIsError(false);
                setLoadedKey(requestKey);
            })
            .catch(() => {
                if (ignore) return;
                setIsError(true);
                setLoadedKey(requestKey);
            });

        return () => {
            ignore = true;
        };
    }, [classId, sort, requestKey]);

    function handleSortChange(nextSort) {
        setSort(nextSort);
        setLoadMoreError('');
    }

    async function handleLoadMore() {
        setIsLoadingMore(true);
        setLoadMoreError('');
        try {
            const nextPage = page + 1;
            const data = await fetchReviewPage(classId, sort, nextPage);
            // 페이지 사이에 새 후기가 등록되면 한 칸씩 밀려 같은 후기가 또 올 수 있어서 이미 있는 후기는 뺌
            setReviews((prev) => [
                ...prev,
                ...data.reviews.filter((review) => !prev.some((p) => p.reviewId === review.reviewId)),
            ]);
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
        return <ReviewSkeleton />;
    }

    if (loadState === 'error') {
        return <p className="py-16 text-center text-gray-400">수강평을 불러오지 못했습니다.</p>;
    }

    if (totalCount === 0) {
        return <p className="py-16 text-center text-gray-400">아직 작성된 후기가 없습니다.</p>;
    }

    return (
        <div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <p className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                    총 {totalCount.toLocaleString()}개
                    <span className="flex items-center gap-1">
                        <Star size={18} className="fill-point text-point" />
                        {avgRating}
                    </span>
                </p>

                {/* 더보기 중에 정렬을 바꾸면 늦게 온 이전 정렬 후기가 새 목록 뒤에 붙어서 막음 */}
                <Dropdown
                    label="후기 정렬"
                    options={SORTS}
                    value={sort}
                    onChange={handleSortChange}
                    disabled={isLoadingMore}
                    className="w-32"
                />
            </div>

            <ul>
                {reviews.map((review) => (
                    <li key={review.reviewId} className="border-b border-gray-200 py-6">
                        <p className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900">{review.writerNickname}</span>
                            <span className="text-xs text-gray-400">
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

            {loadMoreError && (
                <p role="alert" className="mt-4 text-center text-sm text-red-600">{loadMoreError}</p>
            )}

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