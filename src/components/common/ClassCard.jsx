import { Link } from 'react-router-dom';
import { Bookmark, ChevronRight, Star } from 'lucide-react';
import { formatDuration, isDiscounted } from '../../utils/format.js';

// 클래스 카드 1장 (MAIN-002, MAIN-003), rank는 인기, showEventLabel과 boxed는 이벤트 섹션에서만 넘김
function ClassCard({ card, rank, showEventLabel = false, boxed = false }) {
    const {
        classId, title, thumbnailUrl, classType, categoryName,
        price, salePrice, discountRate,
        avgRating, reviewCount, wishCount,
        totalDurationMinutes, tutorNickname, eventLabel,
    } = card;

    const hasDiscount = isDiscounted(card);

    const displayPrice = hasDiscount ? salePrice : price;

    const cardClass = boxed ? 'group block overflow-hidden rounded-xl bg-white' : 'group block';
    const thumbnailClass = boxed ? '' : 'rounded-xl';
    const textClass = boxed ? 'mt-3 space-y-1.5 px-4 pb-4' : 'mt-3 space-y-1.5';

    return (
        <Link to={`/classes/${classId}`} className={cardClass}>
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

                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full border border-white/30 bg-black/50 px-2.5 py-1 text-xs text-white">
                    {wishCount.toLocaleString()}+
                    <Bookmark size={14} />
                </span>
            </div>

            <div className={textClass}>
                <p className="flex items-center gap-0.5 text-sm text-gray-500">
                    {categoryName}
                    <ChevronRight size={14} />
                </p>

                <h3 className="line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-brand">
                    {title}
                </h3>

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

                <p className="flex items-baseline gap-1.5 text-lg font-semibold">
                    {hasDiscount && <span className="text-point">{discountRate}%</span>}
                    <span className="text-gray-900">{displayPrice.toLocaleString()}원</span>
                </p>

                <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                    {classType === 'ONLINE' ? '온라인' : '오프라인'}
                </span>
            </div>
        </Link>
    );
}

export default ClassCard;
