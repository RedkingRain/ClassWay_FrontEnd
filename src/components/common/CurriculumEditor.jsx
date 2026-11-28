import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from 'lucide-react';
import { authFetch } from '../../utils/auth.js';

/**
 * 재사용 가능한 커리큘럼 등록 · 수정 컴포넌트
 *
 * - classId가 전달되면 내부에서 GET /tutor/{classId}/chapter 를 호출하여 기존 챕터/강의 데이터를 로드합니다.
 * - classId가 없으면 기본 챕터 1개 및 하위 강의 1개(빈칸)를 자동 생성합니다.
 * - 부모 컴포넌트는 ref를 통해 validate(), getPayload(), saveCurriculum()을 호출할 수 있습니다.
 */
const CurriculumEditor = forwardRef(function CurriculumEditor(
    { classId, disabled = false, onLoadError },
    ref
) {
    const uidCounterRef = useRef(1);

    function nextUid(prefix) {
        const id = `${prefix}-${uidCounterRef.current}`;
        uidCounterRef.current += 1;
        return id;
    }

    function createEmptyLecture() {
        return {
            _uid: nextUid('lec'),
            lectureId: null,
            title: '',
            minutes: '',
            seconds: '',
        };
    }

    function createEmptyChapter() {
        return {
            _uid: nextUid('ch'),
            chapterId: null,
            title: '',
            lectures: [createEmptyLecture()],
        };
    }

    const [chapters, setChapters] = useState(() => [createEmptyChapter()]);
    const [loadedKey, setLoadedKey] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [emptyChapterErrors, setEmptyChapterErrors] = useState({});
    const [dragItem, setDragItem] = useState(null); // { type: 'CHAPTER' | 'LECTURE', chIndex, lecIndex }

    const currentRequestKey = classId ? `${classId}:${reloadKey}` : null;
    const isLoading = Boolean(classId) && loadedKey !== currentRequestKey;

    // 서버 응답(chapters, lectures)을 내부 트리 상태 구조로 변환
    function mapCurriculumResponse(data) {
        const rawChapters = Array.isArray(data?.chapters)
            ? [...data.chapters].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            : [];
        const rawLectures = Array.isArray(data?.lectures)
            ? [...data.lectures].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            : [];

        if (rawChapters.length === 0) {
            return [createEmptyChapter()];
        }

        return rawChapters.map((ch) => {
            const matchedLectures = rawLectures
                .filter((lec) => lec.chapterId === ch.chapterId)
                .map((lec) => {
                    // 백엔드 durationSec (초 단위) -> 분 / 초 변환 (구버전 durationMinutes 폴백 호환)
                    const totalSec =
                        typeof lec.durationSec === 'number'
                            ? lec.durationSec
                            : typeof lec.durationMinutes === 'number'
                              ? lec.durationMinutes * 60
                              : 0;
                    const mins = totalSec > 0 ? String(Math.floor(totalSec / 60)) : '0';
                    const secs = totalSec > 0 ? String(totalSec % 60) : '0';

                    return {
                        _uid: nextUid('lec'),
                        lectureId: lec.lectureId ?? null,
                        title: lec.title ?? '',
                        minutes: mins,
                        seconds: secs,
                    };
                });

            return {
                _uid: nextUid('ch'),
                chapterId: ch.chapterId ?? null,
                title: ch.title ?? '',
                lectures: matchedLectures,
            };
        });
    }

    // classId가 있을 경우 내부에서 커리큘럼 조회 API (GET /tutor/{classId}/chapter) 호출
    useEffect(() => {
        if (!classId) {
            return;
        }

        let ignore = false;
        const reqKey = `${classId}:${reloadKey}`;

        async function fetchCurriculum() {
            try {
                const response = await authFetch(`/tutor/${encodeURIComponent(classId)}/chapter`);
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                if (!response.ok || !result.success) {
                    throw new Error(result.message || '커리큘럼 정보를 불러오지 못했습니다.');
                }

                setChapters(mapCurriculumResponse(result.data));
                setEmptyChapterErrors({});
                setLoadError('');
                setLoadedKey(reqKey);
                if (typeof onLoadError === 'function') {
                    onLoadError('');
                }
            } catch (error) {
                if (ignore) return;
                const msg = error.message || '커리큘럼 정보를 불러오지 못했습니다.';
                setLoadError(msg);
                setLoadedKey(reqKey);
                if (typeof onLoadError === 'function') {
                    onLoadError(msg);
                }
            }
        }

        fetchCurriculum();

        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classId, reloadKey]);

    // 백엔드 전송용 평탄화 데이터 생성
    function buildPayload() {
        const chaptersPayload = [];
        const lecturesPayload = [];

        chapters.forEach((ch, chIdx) => {
            const chapterSortOrder = chIdx + 1;
            chaptersPayload.push({
                chapterId: ch.chapterId ?? null,
                title: ch.title.trim(),
                sortOrder: chapterSortOrder,
            });

            ch.lectures.forEach((lec, lecIdx) => {
                const mins = parseInt(lec.minutes || '0', 10) || 0;
                const secs = parseInt(lec.seconds || '0', 10) || 0;
                const durationSec = mins * 60 + secs;

                lecturesPayload.push({
                    lectureId: lec.lectureId ?? null,
                    chapterId: ch.chapterId ?? null,
                    chapterSortOrder,
                    title: lec.title.trim(),
                    durationSec,
                    sortOrder: lecIdx + 1,
                });
            });
        });

        return {
            chapters: chaptersPayload,
            lectures: lecturesPayload,
        };
    }

    // 유효성 검증
    function validateCurriculum() {
        if (isLoading) {
            return {
                valid: false,
                message: '커리큘럼 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.',
            };
        }

        if (loadError) {
            return {
                valid: false,
                message:
                    '커리큘럼 정보를 불러오지 못한 상태에서는 저장할 수 없습니다. 커리큘럼 영역에서 다시 불러오기를 진행해 주세요.',
            };
        }

        if (chapters.length === 0) {
            return { valid: false, message: '최소 1개 이상의 챕터를 추가해 주세요.' };
        }

        const nextEmptyErrors = {};
        let hasEmptyChapter = false;

        chapters.forEach((ch) => {
            if (ch.lectures.length === 0) {
                nextEmptyErrors[ch._uid] = true;
                hasEmptyChapter = true;
            }
        });

        setEmptyChapterErrors(nextEmptyErrors);

        for (let i = 0; i < chapters.length; i += 1) {
            const ch = chapters[i];
            const chNum = i + 1;

            if (!ch.title.trim()) {
                return { valid: false, message: `CH ${chNum}의 챕터명을 입력해 주세요.` };
            }
            if (ch.title.trim().length > 100) {
                return { valid: false, message: `CH ${chNum}의 챕터명은 최대 100자까지 입력할 수 있습니다.` };
            }
        }

        if (hasEmptyChapter) {
            return { valid: false, message: '모든 챕터에 강의를 최소 1개 이상 추가해 주세요.' };
        }

        for (let i = 0; i < chapters.length; i += 1) {
            const ch = chapters[i];
            const chNum = i + 1;

            for (let j = 0; j < ch.lectures.length; j += 1) {
                const lec = ch.lectures[j];
                const lecNum = String(j + 1).padStart(2, '0');

                if (!lec.title.trim()) {
                    return {
                        valid: false,
                        message: `CH ${chNum}의 ${lecNum}번 강의명을 입력해 주세요.`,
                    };
                }
                if (lec.title.trim().length > 100) {
                    return {
                        valid: false,
                        message: `CH ${chNum}의 ${lecNum}번 강의명은 최대 100자까지 입력할 수 있습니다.`,
                    };
                }

                const mins = parseInt(lec.minutes || '0', 10) || 0;
                const secs = parseInt(lec.seconds || '0', 10) || 0;

                if (secs < 0 || secs > 59) {
                    return {
                        valid: false,
                        message: `CH ${chNum}의 ${lecNum}번 강의 진행 시간(초)은 0~59 사이로 입력해 주세요.`,
                    };
                }

                const totalSec = mins * 60 + secs;
                if (totalSec < 1) {
                    return {
                        valid: false,
                        message: `CH ${chNum}의 ${lecNum}번 강의 진행 시간을 1초 이상 입력해 주세요.`,
                    };
                }
            }
        }

        return { valid: true, message: '' };
    }

    // 커리큘럼 단독 저장 API 호출 (PATCH /tutor/{classId}/chapter)
    async function saveCurriculum(targetClassId) {
        const effectiveClassId = targetClassId || classId;
        if (!effectiveClassId) {
            throw new Error('클래스 번호가 없어 커리큘럼을 저장할 수 없습니다.');
        }

        if (isLoading || loadError) {
            throw new Error(
                '커리큘럼 정보를 정상적으로 불러오지 못한 상태에서는 커리큘럼을 저장할 수 없습니다.'
            );
        }

        const payload = buildPayload();
        const response = await authFetch(`/tutor/${encodeURIComponent(effectiveClassId)}/chapter`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
            throw new Error(result.message || '커리큘럼 저장 중 오류가 발생했습니다.');
        }

        // PATCH 성공 직후 최신 커리큘럼(새로 발급된 chapterId, lectureId)을 다시 조회하여 로컬 상태 동기화
        // -> 이후 클래스 기본 정보 PATCH가 실패해 재시도하더라도 신규 챕터/강의가 중복 생성되지 않도록 보장
        try {
            const syncRes = await authFetch(`/tutor/${encodeURIComponent(effectiveClassId)}/chapter`);
            const syncJson = await syncRes.json().catch(() => ({}));
            if (syncRes.ok && syncJson.success && syncJson.data) {
                setChapters(mapCurriculumResponse(syncJson.data));
                setEmptyChapterErrors({});
                setLoadError('');
            }
        } catch {
            // 동기화 재조회 실패 시에는 기존 상태를 유지
        }

        return result.data;
    }

    function handleRetryLoad() {
        setLoadError('');
        setReloadKey((k) => k + 1);
    }

    useImperativeHandle(ref, () => ({
        validate: validateCurriculum,
        getPayload: buildPayload,
        saveCurriculum,
        hasLoadError: () => Boolean(loadError),
        retryLoad: handleRetryLoad,
    }));

    // ── 챕터 조작 핸들러 ─────────────────────────────
    function handleChapterTitleChange(chIndex, value) {
        setChapters((prev) =>
            prev.map((ch, idx) => (idx === chIndex ? { ...ch, title: value } : ch))
        );
    }

    function handleAddChapter() {
        if (disabled) return;
        setChapters((prev) => [...prev, createEmptyChapter()]);
    }

    function handleRemoveChapter(chIndex) {
        if (disabled) return;
        if (chapters.length <= 1) return;
        const targetUid = chapters[chIndex]?._uid;
        setChapters((prev) => prev.filter((_, idx) => idx !== chIndex));
        if (targetUid) {
            setEmptyChapterErrors((prev) => {
                const next = { ...prev };
                delete next[targetUid];
                return next;
            });
        }
    }

    function moveChapter(fromIndex, toIndex) {
        if (disabled) return;
        if (toIndex < 0 || toIndex >= chapters.length || fromIndex === toIndex) return;
        setChapters((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }

    // ── 하위 강의 조작 핸들러 ─────────────────────────
    function handleAddLecture(chIndex) {
        if (disabled) return;
        const targetUid = chapters[chIndex]?._uid;
        setChapters((prev) =>
            prev.map((ch, idx) =>
                idx === chIndex ? { ...ch, lectures: [...ch.lectures, createEmptyLecture()] } : ch
            )
        );
        if (targetUid && emptyChapterErrors[targetUid]) {
            setEmptyChapterErrors((prev) => {
                const next = { ...prev };
                delete next[targetUid];
                return next;
            });
        }
    }

    function handleRemoveLecture(chIndex, lecIndex) {
        if (disabled) return;
        setChapters((prev) =>
            prev.map((ch, idx) => {
                if (idx !== chIndex) return ch;
                const nextLectures = ch.lectures.filter((_, lIdx) => lIdx !== lecIndex);
                return { ...ch, lectures: nextLectures };
            })
        );
    }

    function handleLectureTitleChange(chIndex, lecIndex, value) {
        setChapters((prev) =>
            prev.map((ch, idx) => {
                if (idx !== chIndex) return ch;
                return {
                    ...ch,
                    lectures: ch.lectures.map((lec, lIdx) =>
                        lIdx === lecIndex ? { ...lec, title: value } : lec
                    ),
                };
            })
        );
    }

    function handleLectureTimeChange(chIndex, lecIndex, field, rawValue) {
        const digitsOnly = rawValue.replace(/\D/g, '');
        let normalized = digitsOnly;

        if (field === 'seconds' && digitsOnly !== '') {
            const num = parseInt(digitsOnly, 10);
            if (num > 59) normalized = '59';
        }

        setChapters((prev) =>
            prev.map((ch, idx) => {
                if (idx !== chIndex) return ch;
                return {
                    ...ch,
                    lectures: ch.lectures.map((lec, lIdx) =>
                        lIdx === lecIndex ? { ...lec, [field]: normalized } : lec
                    ),
                };
            })
        );
    }

    // 드롭박스에서 다른 챕터 그룹을 선택했을 때 자동으로 해당 챕터 영역으로 이동
    function handleChangeLectureChapter(fromChIndex, lecIndex, targetChUid) {
        if (disabled) return;
        const targetChIndex = chapters.findIndex((ch) => ch._uid === targetChUid);
        if (targetChIndex === -1 || targetChIndex === fromChIndex) return;

        setChapters((prev) => {
            const next = prev.map((ch) => ({ ...ch, lectures: [...ch.lectures] }));
            const [movedLecture] = next[fromChIndex].lectures.splice(lecIndex, 1);
            if (movedLecture) {
                next[targetChIndex].lectures.push(movedLecture);
            }
            return next;
        });

        if (emptyChapterErrors[targetChUid]) {
            setEmptyChapterErrors((prev) => {
                const next = { ...prev };
                delete next[targetChUid];
                return next;
            });
        }
    }

    // 강의 위/아래 순서 이동 (∧ / ∨ 버튼)
    function moveLecture(chIndex, fromLecIndex, toLecIndex) {
        if (disabled) return;
        const lectures = chapters[chIndex]?.lectures || [];
        if (toLecIndex < 0 || toLecIndex >= lectures.length || fromLecIndex === toLecIndex) return;

        setChapters((prev) =>
            prev.map((ch, idx) => {
                if (idx !== chIndex) return ch;
                const nextLectures = [...ch.lectures];
                const [moved] = nextLectures.splice(fromLecIndex, 1);
                nextLectures.splice(toLecIndex, 0, moved);
                return { ...ch, lectures: nextLectures };
            })
        );
    }

    // ── HTML5 드래그 앤 드롭 핸들러 ────────────────────
    function handleChapterDragStart(e, chIndex) {
        if (disabled) {
            e.preventDefault();
            return;
        }
        setDragItem({ type: 'CHAPTER', chIndex });
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleLectureDragStart(e, chIndex, lecIndex) {
        if (disabled) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        setDragItem({ type: 'LECTURE', chIndex, lecIndex });
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e) {
        if (disabled || !dragItem) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleChapterDrop(e, targetChIndex) {
        if (disabled || !dragItem) return;
        e.preventDefault();
        e.stopPropagation();

        if (dragItem.type === 'CHAPTER') {
            moveChapter(dragItem.chIndex, targetChIndex);
        } else if (dragItem.type === 'LECTURE') {
            // 강의를 다른 챕터 박스 헤더/빈 영역에 드롭한 경우 해당 챕터의 맨 끝으로 이동
            const { chIndex: fromChIndex, lecIndex: fromLecIndex } = dragItem;
            if (fromChIndex !== targetChIndex) {
                const targetUid = chapters[targetChIndex]?._uid;
                handleChangeLectureChapter(fromChIndex, fromLecIndex, targetUid);
            }
        }
        setDragItem(null);
    }

    function handleLectureDrop(e, targetChIndex, targetLecIndex) {
        if (disabled || !dragItem) return;
        e.preventDefault();
        e.stopPropagation();

        if (dragItem.type === 'CHAPTER') {
            moveChapter(dragItem.chIndex, targetChIndex);
            setDragItem(null);
            return;
        }

        if (dragItem.type === 'LECTURE') {
            const { chIndex: fromChIndex, lecIndex: fromLecIndex } = dragItem;
            if (fromChIndex === targetChIndex && fromLecIndex === targetLecIndex) {
                setDragItem(null);
                return;
            }

            setChapters((prev) => {
                const next = prev.map((ch) => ({ ...ch, lectures: [...ch.lectures] }));
                const [movedLecture] = next[fromChIndex].lectures.splice(fromLecIndex, 1);
                if (movedLecture) {
                    next[targetChIndex].lectures.splice(targetLecIndex, 0, movedLecture);
                }
                return next;
            });

            const targetUid = chapters[targetChIndex]?._uid;
            if (targetUid && emptyChapterErrors[targetUid]) {
                setEmptyChapterErrors((prev) => {
                    const next = { ...prev };
                    delete next[targetUid];
                    return next;
                });
            }
        }

        setDragItem(null);
    }

    function handleDragEnd() {
        setDragItem(null);
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-6 text-center">
                <p className="text-sm font-semibold text-red-700">
                    커리큘럼 정보를 불러오지 못했습니다.
                </p>
                <p className="mt-1 text-xs text-red-600">{loadError}</p>
                <p className="mt-1 text-xs text-gray-500">
                    기존 커리큘럼 보호를 위해 조회가 완료되기 전에는 편집 및 저장할 수 없습니다.
                </p>
                <button
                    type="button"
                    onClick={handleRetryLoad}
                    className="mt-4 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand/90"
                >
                    커리큘럼 다시 불러오기
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {chapters.map((chapter, chIndex) => {
                const isChapterEmptyError =
                    Boolean(emptyChapterErrors[chapter._uid]) && chapter.lectures.length === 0;

                return (
                    <div key={chapter._uid}>
                        <div
                            draggable={!disabled}
                            onDragStart={(e) => handleChapterDragStart(e, chIndex)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleChapterDrop(e, chIndex)}
                            onDragEnd={handleDragEnd}
                            className={`rounded-xl border p-4 transition ${
                                isChapterEmptyError
                                    ? 'border-red-500 bg-red-50/30'
                                    : 'border-gray-200 bg-gray-50/70'
                            }`}
                        >
                            {/* 챕터 헤더 행 */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-gray-400 ${
                                        disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                                    }`}
                                    title="드래그하여 챕터 순서 변경"
                                >
                                    <GripVertical size={16} />
                                </span>

                                {/* 챕터 ∧ / ∨ 순서 이동 버튼 */}
                                <div className="flex flex-col">
                                    <button
                                        type="button"
                                        disabled={disabled || chIndex === 0}
                                        onClick={() => moveChapter(chIndex, chIndex - 1)}
                                        aria-label={`CH ${chIndex + 1} 위로 이동`}
                                        className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <ChevronUp size={13} />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={disabled || chIndex === chapters.length - 1}
                                        onClick={() => moveChapter(chIndex, chIndex + 1)}
                                        aria-label={`CH ${chIndex + 1} 아래로 이동`}
                                        className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        <ChevronDown size={13} />
                                    </button>
                                </div>

                                <span className="w-10 shrink-0 text-xs font-bold text-gray-800">
                                    CH {chIndex + 1}
                                </span>

                                <input
                                    type="text"
                                    value={chapter.title}
                                    disabled={disabled}
                                    maxLength={100}
                                    onChange={(e) => handleChapterTitleChange(chIndex, e.target.value)}
                                    onDragStart={(e) => e.stopPropagation()}
                                    placeholder="챕터명을 입력하세요 (예: 머랭과 꼬끄)"
                                    className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                />

                                <button
                                    type="button"
                                    disabled={disabled || chapters.length <= 1}
                                    onClick={() => handleRemoveChapter(chIndex)}
                                    aria-label={`CH ${chIndex + 1} 삭제`}
                                    title={
                                        chapters.length <= 1
                                            ? '최소 1개의 챕터가 필요합니다'
                                            : '챕터 삭제'
                                    }
                                    className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* 하위 강의 목록 */}
                            {chapter.lectures.length > 0 && (
                                <div className="mt-3 space-y-2.5 pl-4">
                                    {chapter.lectures.map((lecture, lecIndex) => (
                                        <div
                                            key={lecture._uid}
                                            draggable={!disabled}
                                            onDragStart={(e) => handleLectureDragStart(e, chIndex, lecIndex)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleLectureDrop(e, chIndex, lecIndex)}
                                            onDragEnd={handleDragEnd}
                                            className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                                        >
                                            <span
                                                className={`text-gray-300 ${
                                                    disabled
                                                        ? 'cursor-not-allowed'
                                                        : 'cursor-grab active:cursor-grabbing'
                                                }`}
                                                title="드래그하여 강의 순서 변경"
                                            >
                                                <GripVertical size={15} />
                                            </span>

                                            {/* 강의 ∧ / ∨ 순서 이동 버튼 */}
                                            <div className="flex flex-col">
                                                <button
                                                    type="button"
                                                    disabled={disabled || lecIndex === 0}
                                                    onClick={() => moveLecture(chIndex, lecIndex, lecIndex - 1)}
                                                    aria-label={`${lecIndex + 1}번 강의 위로 이동`}
                                                    className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        disabled || lecIndex === chapter.lectures.length - 1
                                                    }
                                                    onClick={() => moveLecture(chIndex, lecIndex, lecIndex + 1)}
                                                    aria-label={`${lecIndex + 1}번 강의 아래로 이동`}
                                                    className="text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>

                                            <span className="w-6 shrink-0 text-xs font-medium text-gray-500">
                                                {String(lecIndex + 1).padStart(2, '0')}
                                            </span>

                                            {/* 소속 챕터 그룹 드롭박스 (변경 시 해당 챕터로 즉시 이동) */}
                                            <div className="relative w-24 shrink-0">
                                                <select
                                                    value={chapter._uid}
                                                    disabled={disabled}
                                                    aria-label="소속 챕터 선택"
                                                    onChange={(e) =>
                                                        handleChangeLectureChapter(
                                                            chIndex,
                                                            lecIndex,
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-7 text-xs font-medium text-gray-800 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                >
                                                    {chapters.map((optCh, optIdx) => (
                                                        <option key={optCh._uid} value={optCh._uid}>
                                                            CH {optIdx + 1}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown
                                                    size={14}
                                                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                                />
                                            </div>

                                            {/* 강의명 입력칸 */}
                                            <input
                                                type="text"
                                                value={lecture.title}
                                                disabled={disabled}
                                                maxLength={100}
                                                onChange={(e) =>
                                                    handleLectureTitleChange(chIndex, lecIndex, e.target.value)
                                                }
                                                onDragStart={(e) => e.stopPropagation()}
                                                placeholder="강의 제목을 입력하세요"
                                                className="h-9 min-w-[160px] flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                            />

                                            {/* 강의 진행 시간 입력칸 (분 / 초) */}
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={lecture.minutes}
                                                    disabled={disabled}
                                                    maxLength={4}
                                                    onChange={(e) =>
                                                        handleLectureTimeChange(
                                                            chIndex,
                                                            lecIndex,
                                                            'minutes',
                                                            e.target.value
                                                        )
                                                    }
                                                    onDragStart={(e) => e.stopPropagation()}
                                                    placeholder="0"
                                                    aria-label="강의 진행 시간(분)"
                                                    className="h-9 w-14 rounded-lg border border-gray-300 bg-white px-2 text-right text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                />
                                                <span className="text-xs text-gray-500">분</span>

                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={lecture.seconds}
                                                    disabled={disabled}
                                                    maxLength={2}
                                                    onChange={(e) =>
                                                        handleLectureTimeChange(
                                                            chIndex,
                                                            lecIndex,
                                                            'seconds',
                                                            e.target.value
                                                        )
                                                    }
                                                    onDragStart={(e) => e.stopPropagation()}
                                                    placeholder="0"
                                                    aria-label="강의 진행 시간(초)"
                                                    className="h-9 w-14 rounded-lg border border-gray-300 bg-white px-2 text-right text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                                                />
                                                <span className="text-xs text-gray-500">초</span>
                                            </div>

                                            {/* 강의 삭제 버튼 */}
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => handleRemoveLecture(chIndex, lecIndex)}
                                                aria-label={`${lecIndex + 1}번 강의 삭제`}
                                                className="p-1 text-gray-400 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* + 항목 추가 버튼 */}
                            <div className="mt-3 pl-4">
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => handleAddLecture(chIndex)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <Plus size={14} />
                                    항목 추가
                                </button>
                            </div>
                        </div>

                        {/* 빈 챕터 검증 오류 메시지 */}
                        {isChapterEmptyError && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                                이 챕터에 강의를 1개 이상 추가해 주세요.
                            </p>
                        )}
                    </div>
                );
            })}

            {/* + 챕터 추가 버튼 */}
            <div>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={handleAddChapter}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Plus size={14} />
                    챕터 추가
                </button>
                <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    항목마다 챕터를 골라 옮길 수 있고, ⠿ 또는 ∧/∨ 버튼으로 챕터와 강의 순서를 바꿉니다. 챕터 1개 이상, 각 챕터마다 강의 1개 이상이 있어야 저장할 수 있습니다.
                </p>
            </div>
        </div>
    );
});

export default CurriculumEditor;
