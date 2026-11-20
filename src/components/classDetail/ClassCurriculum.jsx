import { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

function twoDigits(n) {
    return String(n).padStart(2, '0');
}

// 강의 한 줄, showLock은 결제 전 모든 강의가 잠기는 온라인에서만 true
function LectureRow({ number, lecture, showLock }) {
    return (
        <li className="flex items-center py-3">
            <span className="w-12 shrink-0 font-semibold text-brand">{twoDigits(number)}</span>

            <span className="flex-1 text-gray-800">{lecture.title}</span>

            {/* 자물쇠가 없는 줄도 세로줄이 맞게 같은 폭의 칸을 둠 */}
            {showLock && (
                <span className="flex w-20 shrink-0 justify-end">
                    <Lock size={13} className="text-gray-400" aria-label="결제 후 수강 가능" />
                </span>
            )}

            <span className="w-14 shrink-0 text-right text-gray-500">{lecture.durationMinutes}분</span>
        </li>
    );
}

// 커리큘럼 탭 (CLASS-001), 오프라인은 단계 목록, 온라인은 챕터를 접고 펼침
function ClassCurriculum({ classType, chapters }) {
    // 개수와 총 시간을 계산하려고 모든 강의를 한 목록으로 폄
    const allLectures = chapters.flatMap((chapter) => chapter.lectures);
    const totalMinutes = allLectures.reduce((sum, lecture) => sum + lecture.durationMinutes, 0);
    // 총 약 3시간은 어색해서 총 3시간으로 씀
    const totalText = formatDuration(totalMinutes).replace('약 ', '');

    // 처음에는 첫 챕터만 펼침
    const [openIds, setOpenIds] = useState(chapters.length > 0 ? [chapters[0].chapterId] : []);
    const isAllOpen = openIds.length === chapters.length;

    function toggleChapter(chapterId) {
        if (openIds.includes(chapterId)) {
            setOpenIds(openIds.filter((id) => id !== chapterId));
        } else {
            setOpenIds([...openIds, chapterId]);
        }
    }

    function toggleAll() {
        setOpenIds(isAllOpen ? [] : chapters.map((chapter) => chapter.chapterId));
    }

    if (allLectures.length === 0) {
        return <p className="py-10 text-center text-sm text-gray-400">등록된 커리큘럼이 없습니다.</p>;
    }

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

    return (
        <div className="rounded-2xl border border-gray-200">
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

            <ul>
                {chapters.map((chapter, chapterIndex) => {
                    const isOpen = openIds.includes(chapter.chapterId);
                    return (
                        <li key={chapter.chapterId} className="border-b border-gray-200 last:border-b-0">
                            {/* 열린 챕터 배경이 테두리에서 살짝 떨어진 둥근 상자로 보이게 바깥 여백을 둠 */}
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