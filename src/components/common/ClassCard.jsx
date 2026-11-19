import { Link } from 'react-router-dom';
import { Bookmark, ChevronRight, Star } from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

// 클래스 카드 1장 (메인 인기 / 이벤트 / 전체, 나중에 검색 결과에서도 사용)
// card: 백엔드 ClassCardResponse 1개
// rank: 인기 순위 (인기 섹션에서만 넘김, 없으면 순위 배지 안 그림)
// showEventLabel: 이벤트 배지 표시 여부 (이벤트 섹션에서만 true)
// boxed: 흰 상자 모양 (진초록 배경인 이벤트 섹션에서만 true)
function ClassCard({ card, rank, showEventLabel = false, boxed = false }) {
    // 1. 필요한 값 꺼내기
    const {
        classId, title, thumbnailUrl, classType, categoryName,
        price, salePrice, discountRate,
        avgRating, reviewCount, wishCount,
        totalDurationMinutes, tutorNickname, eventLabel,
    } = card;

    // 2. 할인 여부 (할인율이 0보다 크고, 할인가가 있을 때만)
    const hasDiscount = discountRate > 0 && salePrice !== null;

    // 3. 화면에 크게 보여줄 가격
    const displayPrice = hasDiscount ? salePrice : price;

    // 흰 상자 모양이면: 카드 전체를 흰 상자로 감싸고, 사진 모서리는 상자가 둥글게 처리, 글자에 안쪽 여백
    const cardClass = boxed ? 'group block overflow-hidden rounded-xl bg-white' : 'group block';
    const thumbnailClass = boxed ? '' : 'rounded-xl';
    const textClass = boxed ? 'mt-3 space-y-1.5 px-4 pb-4' : 'mt-3 space-y-1.5';

    return (
        // 4. 카드 전체가 상세 페이지 링크
        <Link to={`/classes/${classId}`} className={cardClass}>
            {/* 5. 썸네일 */}
            <div className={`relative aspect-[4/3] overflow-hidden bg-gray-100 ${thumbnailClass}`}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        이미지 준비 중
                    </div>
                )}

                {/* 왼쪽 위 모서리: 순위 + 이벤트 배지 */}
                <div className="absolute left-0 top-0 flex">
                    {rank && (
                        <span className="rounded-br-lg bg-point px-3 py-1.5 text-sm font-semibold text-white">
                            {rank}위
                        </span>
                    )}
                    {showEventLabel && eventLabel && (
                        <span className="rounded-br-lg bg-point px-3 py-1.5 text-sm font-semibold text-white">
                            {eventLabel}
                        </span>
                    )}
                </div>

                {/* 오른쪽 위: 찜 수 */}
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-xs text-white">
                    {wishCount.toLocaleString()}+
                    <Bookmark size={14} />
                </span>
            </div>

            {/* 6. 글자 영역 */}
            <div className={textClass}>
                {/* 카테고리 */}
                <p className="flex items-center gap-0.5 text-sm text-gray-500">
                    {categoryName}
                    <ChevronRight size={14} />
                </p>

                {/* 제목 (2줄 넘으면 ...) */}
                <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-brand">
                    {title}
                </h3>

                {/* 별점 | 시간 | 강사 (항목 사이에 세로선) */}
                <p className="flex items-center divide-x divide-gray-300 text-sm text-gray-500">
                    {reviewCount > 0 && (
                        <span className="flex items-center gap-1 pr-2">
                            <Star size={14} className="fill-gray-400 text-gray-400" />
                            {Number(avgRating).toFixed(1)} ({reviewCount.toLocaleString()})
                        </span>
                    )}
                    {totalDurationMinutes > 0 && (
                        <span className="px-2 first:pl-0">{formatDuration(totalDurationMinutes)}</span>
                    )}
                    <span className="px-2 first:pl-0">{tutorNickname}</span>
                </p>

                {/* 가격 */}
                <p className="flex items-baseline gap-1.5 text-lg font-semibold">
                    {hasDiscount && <span className="text-point">{discountRate}%</span>}
                    <span className="text-gray-900">{displayPrice.toLocaleString()}원</span>
                </p>

                {/* 온라인 / 오프라인 태그 */}
                <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {classType === 'ONLINE' ? '온라인' : '오프라인'}
                </span>
            </div>
        </Link>
    );
}

export default ClassCard;
