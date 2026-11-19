import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bookmark, Share2, ChevronRight, ChevronDown, Star,
    MapPin, Clock, PlayCircle, ListVideo, CalendarDays, Users,
} from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

// 상세 정보 (CLASS-001), detail은 상세 API 응답 data
function ClassDetailInfo({ detail }) {
    const {
        title, summary, classType, category, avgRating, reviewCount, wishCount,
        studentCount, totalDurationMinutes, lectureCount, region, tutor,
        maxCapacity,
    } = detail;

    const isOnline = classType === 'ONLINE';
    const [isTutorOpen, setIsTutorOpen] = useState(false);
    // 토스트는 없으면 null, 있으면 { type, message }
    const [toast, setToast] = useState(null);
    // 다시 누르면 이전 타이머를 취소하려고 번호를 기억함
    const toastTimerRef = useRef(null);
    // 페이지를 떠난 뒤 사라진 화면을 바꾸지 않게 남은 타이머를 취소함
    useEffect(() => {
        return () => clearTimeout(toastTimerRef.current);
    }, []);

    async function handleShare() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setToast({ type: 'success', message: '주소가 클립보드에 복사되었습니다.' });
        } catch {
            setToast({ type: 'error', message: '주소 복사에 실패했습니다. 다시 시도해 주세요.' });
        }
        // 연달아 눌러도 마지막 토스트가 2초 동안 보이게 이전 타이머를 취소하고 새로 검
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    }

    return (
        <section>
            <div className="flex items-center justify-between">
                <nav aria-label="경로" className="flex items-center text-sm text-gray-500">
                    <Link to="/" className="hover:text-gray-800">홈</Link>
                    <ChevronRight size={14} />
                    <Link
                        to={`/classes?category=${category.categoryId}`}
                        className="hover:text-gray-800"
                    >
                        {category.name}
                    </Link>
                </nav>
                <div className="flex items-center gap-1 text-gray-700">
                    {/* 찜하기는 P1 */}
                    <button
                        type="button"
                        aria-label="찜하기"
                        className="group p-2"
                    >
                        <Bookmark
                            size={20}
                            className="transition group-hover:fill-brand group-hover:text-brand"
                        />
                    </button>
                    <button
                        type="button"
                        aria-label="링크 공유"
                        onClick={handleShare}
                        className="rounded-full p-2 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <div className="mt-4 flex gap-1.5">
        <span className="rounded bg-brand px-2 py-0.5 text-xs text-white">
          {isOnline ? '온라인' : '오프라인'}
        </span>
                <span className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700">
          {category.name}
        </span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold text-gray-900">{title}</h1>

            <p className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                <Star size={14} className="fill-point text-point" />
                <span className="font-medium text-gray-900">{avgRating}</span>
                <span>({reviewCount.toLocaleString()}개 후기)</span>
                <span>· 찜 {wishCount.toLocaleString()}</span>
                {/* 새 클래스가 수강생 0명으로 보이면 오히려 손해라 0명이면 숨김 */}
                {studentCount > 0 && <span>· 수강생 {studentCount.toLocaleString()}명</span>}
            </p>

            <p className="mt-3 text-sm font-semibold text-gray-900">
                {isOnline ? `클래스 비활성화 전 까지 수강` : '원데이 클래스'}
                <span className="mx-2 font-normal text-gray-300">|</span>
                {formatDuration(totalDurationMinutes)}
            </p>

            {summary && <p className="mt-3 leading-relaxed text-gray-700">{summary}</p>}

            <div className="mt-6 rounded-lg bg-gray-50 p-5">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <p className="text-sm font-semibold text-gray-900">클래스 정보</p>
                    <p className="text-xs text-gray-400">
                        {isOnline ? '* 한 번 결제하면 기한 없이 계속 수강할 수 있습니다' : '* 일정에 따라 달라질 수 있습니다'}
                    </p>
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-y-2 text-sm text-gray-700 sm:grid-cols-4">
                    {isOnline ? (
                        <>
                            <li className="flex items-center gap-1.5"><PlayCircle size={16} />온라인 VOD</li>
                            <li className="flex items-center gap-1.5"><ListVideo size={16} />{lectureCount}강 · 총 {formatDuration(totalDurationMinutes)}</li>
                            <li className="flex items-center gap-1.5"><CalendarDays size={16} />기한 없이 계속 수강</li>
                        </>
                    ) : (
                        <>
                            <li className="flex items-center gap-1.5"><MapPin size={16} />{region}</li>
                            <li className="flex items-center gap-1.5"><Clock size={16} />{formatDuration(totalDurationMinutes)} 진행</li>
                            {maxCapacity && (
                                <li className="flex items-center gap-1.5"><Users size={16} />최대 {maxCapacity}명</li>
                            )}
                        </>
                    )}
                </ul>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 p-4">
                    {tutor.profileImage ? (
                        <img src={tutor.profileImage} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200" />
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{tutor.nickname} 강사</p>
                        <p className="truncate text-sm text-gray-500">
                            {tutor.intro}
                            {tutor.classCount > 0 && ` · 클래스 ${tutor.classCount}개 운영`}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsTutorOpen(!isTutorOpen)}
                        aria-expanded={isTutorOpen}
                        className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                    >
                        강사 소개
                        <ChevronDown size={16} className={isTutorOpen ? 'rotate-180 transition' : 'transition'} />
                    </button>
                </div>

                {isTutorOpen && (
                    <div className="border-t border-gray-200 p-4 text-sm leading-relaxed text-gray-700">
                        {tutor.intro && <p>{tutor.intro}</p>}
                        {tutor.career ? (
                            <>
                                <p className="mt-3 font-semibold text-gray-900">경력</p>
                                <p className="mt-1 whitespace-pre-line">{tutor.career}</p>
                            </>
                        ) : (
                            <p className="mt-3 text-gray-400">등록된 강사 소개가 없습니다.</p>
                        )}
                    </div>
                )}
            </div>
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg px-5 py-3 text-sm shadow-lg ${
                        toast.type === 'success'
                            ? 'bg-gray-900 text-white'
                            : 'border border-gray-300 bg-white text-gray-800'
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </section>
    );
}

export default ClassDetailInfo;