export function ClassCardSkeleton() {
    return (
        <div
            role="status"
            aria-label="클래스 목록 불러오는 중"
            className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
            <div className="aspect-[4/3] w-full bg-gray-200" />
            <div className="p-4 space-y-2.5">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-5 w-4/5 rounded bg-gray-200" />
                <div className="h-4 w-3/5 rounded bg-gray-100" />
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="h-6 w-20 rounded-full bg-gray-200" />
                    <div className="h-8 w-14 rounded-lg bg-gray-200" />
                </div>
            </div>
        </div>
    );
}

export function ClassListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <ClassCardSkeleton key={index} />
            ))}
        </div>
    );
}
