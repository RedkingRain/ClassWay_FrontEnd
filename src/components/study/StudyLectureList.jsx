import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// 강의 컨텐츠 (STUDY-001 온라인), 챕터를 접고 펼치고 강의를 누르면 강의 화면으로 이동
function StudyLectureList({ classId, chapters, isTutor }) {
    const lectureCount = chapters.reduce((sum, chapter) => sum + chapter.lectures.length, 0);

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

    return (
        <section className="rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-200 px-7 py-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    강의 컨텐츠
                    <span className="ml-3 text-sm font-normal text-gray-400">
                        챕터 {chapters.length}개 | {lectureCount}강
                    </span>
                </h3>

                <div className="flex items-center gap-2">
                    {lectureCount > 0 && (
                        <button
                            type="button"
                            onClick={toggleAll}
                            className="px-2 text-sm font-medium text-gray-900 hover:underline"
                        >
                            {isAllOpen ? '전체 챕터 닫기' : '전체 챕터 열기'}
                        </button>
                    )}

                    {/* 등록, 선택 삭제는 STUDY-003에서 연결 */}
                    {isTutor && (
                        <>
                            <button
                                type="button"
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                            >
                                선택 삭제
                            </button>
                            <button
                                type="button"
                                className="rounded-lg bg-brand px-4 py-2 text-sm text-white hover:opacity-90"
                            >
                                + 클래스 컨텐츠 등록
                            </button>
                        </>
                    )}
                </div>
            </div>

            {lectureCount === 0 ? (
                <p className="py-14 text-center text-sm text-gray-400">아직 등록된 강의가 없습니다.</p>
            ) : (
                <ul>
                    {chapters.map((chapter, chapterIndex) => {
                        const isOpen = openIds.includes(chapter.chapterId);
                        return (
                            <li key={chapter.chapterId} className="border-b border-gray-200 last:border-b-0">
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
                                            <span className="mt-1 block font-semibold text-gray-900">
                                                {chapter.title}
                                            </span>
                                        </span>
                                        <ChevronDown
                                            size={18}
                                            className={`text-gray-600 transition ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                </div>

                                {isOpen && (
                                    <ol className="px-3 pb-4">
                                        {chapter.lectures.map((lecture, lectureIndex) => (
                                            <li key={lecture.lectureId}>
                                                {/* 강의 화면은 STUDY-002에서 만듦 */}
                                                <Link
                                                    to={`/study/${classId}/${lecture.lectureId}`}
                                                    className="flex items-center rounded-lg px-5 py-3 hover:bg-gray-50"
                                                >
                                                    <span className="w-12 shrink-0 font-semibold text-brand">
                                                        {String(lectureIndex + 1).padStart(2, '0')}
                                                    </span>
                                                    <span className="flex-1 text-gray-800">{lecture.title}</span>
                                                    <span className="w-14 shrink-0 text-right text-gray-500">
                                                        {lecture.durationMinutes}분
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}

export default StudyLectureList;