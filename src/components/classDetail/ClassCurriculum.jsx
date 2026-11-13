import { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

// 숫자를 두 자리로 (1 → "01")
function twoDigits(n) {
    return String(n).padStart(2, '0');
}

// 강의 한 줄 (온·오프라인 공통 모양)
// showLock: 자물쇠 칸을 보여줄지 (온라인만 — 결제 전에는 모든 강의가 잠김)
function LectureRow({ number, lecture, showLock }) {
    return (
        <li className="flex items-center py-3">
            {/* 번호 */}
            <span className="w-12 shrink-0 font-semibold text-brand">{twoDigits(number)}</span>

            {/* 강의 제목 */}
            <span className="flex-1 text-gray-800">{lecture.title}</span>

            {/* 자물쇠 — 같은 폭의 칸에 넣어서 세로줄 맞춤 */}
            {showLock && (
                <span className="flex w-20 shrink-0 justify-end">
                    <Lock size={13} className="text-gray-400" aria-label="결제 후 수강 가능" />
                </span>
            )}

            {/* 시간 — 오른쪽 끝 정렬 */}
            <span className="w-14 shrink-0 text-right text-gray-500">{lecture.durationMinutes}분</span>
        </li>
    );
}

// classType: ONLINE / OFFLINE, chapters: 챕터 목록 (안에 강의 목록)
function ClassCurriculum({ classType, chapters }) {
    // 모든 강의를 한 줄로 펼친 목록 (개수·총 시간 계산용)
    const allLectures = chapters.flatMap((chapter) => chapter.lectures);
    const totalMinutes = allLectures.reduce((sum, lecture) => sum + lecture.durationMinutes, 0);
    // "총 약 3시간"은 어색해서 "총 3시간"으로
    const totalText = formatDuration(totalMinutes).replace('약 ', '');

    // 펼쳐진 챕터 번호 목록 기억 (처음엔 첫 챕터만)
    const [openIds, setOpenIds] = useState(chapters.length > 0 ? [chapters[0].chapterId] : []);
    const isAllOpen = openIds.length === chapters.length;

    // 챕터 하나 열기/닫기
    function toggleChapter(chapterId) {
        if (openIds.includes(chapterId)) {
            setOpenIds(openIds.filter((id) => id !== chapterId)); // 열려 있으면 빼기 = 닫기
        } else {
            setOpenIds([...openIds, chapterId]); // 닫혀 있으면 추가 = 열기
        }
    }

    // 전체 열기 / 전체 닫기
    function toggleAll() {
        setOpenIds(isAllOpen ? [] : chapters.map((chapter) => chapter.chapterId));
    }

    // 커리큘럼이 아직 없을 때
    if (allLectures.length === 0) {
        return <p className="py-10 text-center text-sm text-gray-400">등록된 커리큘럼이 없습니다.</p>;
    }

    // ───── 오프라인: 단계 목록 ─────
    if (classType === 'OFFLINE') {
        return (
            <div className="rounded-2xl border border-gray-200">
                <div className="border-b border-gray-200 px-7 py-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                        커리큘럼
                        <span className="ml-3 text-sm font-normal text-gray-400">
              {allLectures.length}단계 | 총 {totalText}
            </span>
                    </h3>
                </div>
                <ol className="px-7 py-3">
                    {allLectures.map((lecture, index) => (
                        <LectureRow key={lecture.lectureId} number={index + 1} lecture={lecture} />
                    ))}
                </ol>
            </div>
        );
    }

    // ───── 온라인: 챕터 접고 펼치기 ─────
    return (
        <div className="rounded-2xl border border-gray-200">
            {/* 제목 줄 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-7 py-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    커리큘럼
                    <span className="ml-3 text-sm font-normal text-gray-400">
            챕터 {chapters.length}개 | {allLectures.length}강 | 총 {totalText}
          </span>
                </h3>
                <button
                    type="button"
                    onClick={toggleAll}
                    className="text-sm font-medium text-gray-900 hover:underline"
                >
                    {isAllOpen ? '전체 챕터 닫기' : '전체 챕터 열기'}
                </button>
            </div>

            {/* 챕터 목록 */}
            <ul>
                {chapters.map((chapter, chapterIndex) => {
                    const isOpen = openIds.includes(chapter.chapterId);
                    return (
                        <li key={chapter.chapterId} className="border-b border-gray-200 last:border-b-0">
                            {/* 바깥 여백(p-3) → 열린 챕터 배경이 테두리에서 살짝 떨어진 둥근 박스로 보이게 */}
                            <div className="p-3">
                                <button
                                    type="button"
                                    onClick={() => toggleChapter(chapter.chapterId)}
                                    aria-expanded={isOpen}
                                    className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition ${
                                        isOpen ? 'bg-brand-soft' : 'hover:bg-brand-soft'
                                    }`}
                                >
                  <span>
                    <span className="block text-xs tracking-wide text-gray-500">
                      CHAPTER {chapterIndex + 1}
                    </span>
                    <span className="mt-1 block font-semibold text-gray-900">{chapter.title}</span>
                  </span>
                                    <ChevronDown
                                        size={18}
                                        className={`text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                            </div>

                            {/* 펼쳤을 때만 강의 목록 */}
                            {isOpen && (
                                <ol className="px-8 pb-4">
                                    {chapter.lectures.map((lecture, lectureIndex) => (
                                        <LectureRow
                                            key={lecture.lectureId}
                                            number={lectureIndex + 1}
                                            lecture={lecture}
                                            showLock
                                        />
                                    ))}
                                </ol>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default ClassCurriculum;