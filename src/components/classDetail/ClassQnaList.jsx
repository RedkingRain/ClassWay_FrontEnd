import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { formatDate } from '../../utils/format.js';
import { authFetch } from '../../utils/auth.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';

// 서버 기본값과 같음
const PAGE_SIZE = 5;
// 서버 검사와 같은 길이
const MAX_LENGTH = 1000;

// 화면이 다시 그려질 때마다 새로 만들지 않게 컴포넌트 밖에 둠
async function fetchQnaPage(classId, page) {
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
    const response = await authFetch(`/classes/${encodeURIComponent(classId)}/qnas?${query}`, {
        // 비로그인도 보는 화면이라 토큰 문제가 있어도 로그인 페이지로 보내지 않음
        silentAuthError: true,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
        throw new Error(result.message || '문의를 불러오지 못했습니다.');
    }
    return result.data;
}

// 목록이 올 때까지 글 자리를 회색 상자로 미리 보여 줌
function QnaSkeleton() {
    return (
        <div className="animate-pulse" aria-label="문의 불러오는 중">
            <div className="h-6 w-24 rounded bg-gray-200" />
            <ul className="mt-5 border-t border-gray-200">
                {[1, 2, 3].map((n) => (
                    <li key={n} className="border-b border-gray-200 py-6">
                        <div className="h-4 w-40 rounded bg-gray-200" />
                        <div className="mt-4 h-5 w-3/4 rounded bg-gray-200" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Q&A 탭 (CLASS-003)
function ClassQnaList({ classId }) {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();

    // 더보기를 누를 때마다 뒤에 붙음
    const [qnas, setQnas] = useState([]);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    // 등록에 성공하면 1 올려서 첫 페이지를 다시 받음
    const [reloadCount, setReloadCount] = useState(0);
    const requestKey = `${classId}:${reloadCount}`;
    const [loadedKey, setLoadedKey] = useState(null);
    const [isError, setIsError] = useState(false);
    // 이름표가 다르면 아직 새 첫 페이지를 기다리는 중
    const loadState = loadedKey !== requestKey ? 'loading' : isError ? 'error' : 'done';
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadMoreError, setLoadMoreError] = useState('');

    const [question, setQuestion] = useState('');
    const [isSecret, setIsSecret] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        // 늦게 도착한 예전 응답은 무시함 (수강평 탭과 같은 방식)
        let ignore = false;

        fetchQnaPage(classId, 0)
            .then((data) => {
                if (ignore) return;
                setQnas(data.qnas);
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
    }, [classId, requestKey]);

    async function handleLoadMore() {
        setIsLoadingMore(true);
        setLoadMoreError('');
        try {
            const nextPage = page + 1;
            const data = await fetchQnaPage(classId, nextPage);
            setQnas((prev) => [...prev, ...data.qnas]);
            setTotalCount(data.totalCount);
            setHasNext(data.hasNext);
            setPage(nextPage);
        } catch {
            setLoadMoreError('문의를 더 불러오지 못했습니다. 다시 시도해 주세요.');
        } finally {
            setIsLoadingMore(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        // 새로고침 직후 로그인 확인 중에는 팝업을 띄우지 않음
        if (isAuthLoading) return;
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }
        if (!question.trim()) {
            setSubmitError('문의하실 내용을 작성해주세요.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        try {
            const response = await authFetch(`/classes/${encodeURIComponent(classId)}/qnas`, {
                method: 'POST',
                body: JSON.stringify({ question: question.trim(), isSecret }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                throw new Error(result.message);
            }
            setQuestion('');
            setIsSecret(false);
            setReloadCount((prev) => prev + 1);
        } catch {
            // 서버 문구는 앞에 칸 이름이 붙어 있어서 화면 문구를 직접 씀, 입력한 글은 남겨 둠
            setSubmitError('문의를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div>
            {loadState === 'loading' && <QnaSkeleton />}

            {loadState === 'error' && (
                <p className="py-16 text-center text-gray-400">문의를 불러오지 못했습니다.</p>
            )}

            {loadState === 'done' && totalCount === 0 && (
                <p className="py-16 text-center text-gray-400">아직 등록된 문의가 없습니다.</p>
            )}

            {loadState === 'done' && totalCount > 0 && (
                <>
                    <p className="border-b border-gray-200 pb-5 text-lg font-semibold text-gray-900">
                        문의 {totalCount.toLocaleString()}개
                    </p>

                    <ul>
                        {qnas.map((qna) => (
                            <li key={qna.qnaId} className="border-b border-gray-200 py-6">
                                <p className="flex items-center gap-2 text-xs">
                                    <span className={qna.isAnswered ? 'text-gray-500' : 'font-semibold text-point'}>
                                        {qna.isAnswered ? '답변 완료' : '답변 대기'}
                                    </span>
                                    {qna.isSecret && <Lock size={12} className="text-gray-400" aria-label="비밀글" />}
                                    <span className="text-gray-400">
                                        {qna.writerNickname} · {formatDate(qna.createdAt)}
                                    </span>
                                </p>

                                <p className="mt-3 flex gap-3">
                                    <span className="font-semibold text-gray-900">Q.</span>
                                    {qna.canView ? (
                                        <span className="whitespace-pre-line text-gray-800">{qna.question}</span>
                                    ) : (
                                        <span className="text-gray-400">비밀글입니다.</span>
                                    )}
                                </p>

                                {qna.answer && (
                                    <div className="mt-4 flex gap-3 rounded-lg bg-gray-50 p-4">
                                        <span className="font-semibold text-brand">A.</span>
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                강사 답변
                                                {qna.answeredAt && ` · ${formatDate(qna.answeredAt)}`}
                                            </p>
                                            <p className="mt-1 whitespace-pre-line text-gray-700">{qna.answer}</p>
                                        </div>
                                    </div>
                                )}
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
                            {isLoadingMore ? '불러오는 중...' : '문의 더보기'}
                        </button>
                    )}
                </>
            )}

            <form onSubmit={handleSubmit} className="mt-10">
                <label htmlFor="qna-question" className="text-sm font-semibold text-gray-900">
                    문의하기
                </label>
                <div className="relative mt-3">
                    <textarea
                        id="qna-question"
                        value={question}
                        onChange={(event) => {
                            setQuestion(event.target.value);
                            setSubmitError('');
                        }}
                        maxLength={MAX_LENGTH}
                        rows={4}
                        placeholder="클래스에 대해 궁금한 점을 남겨 주세요"
                        className="w-full resize-none rounded-lg border border-gray-300 p-4 pb-8 text-sm text-gray-800 focus:border-brand focus:outline-none"
                    />
                    <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-gray-400">
                        {question.length}/{MAX_LENGTH}
                    </span>
                </div>

                {submitError && <p role="alert" className="mt-2 text-sm text-red-600">{submitError}</p>}

                <div className="mt-3 flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={isSecret}
                            onChange={(event) => setIsSecret(event.target.checked)}
                            className="h-4 w-4 accent-brand"
                        />
                        비밀글로 작성
                    </label>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? '등록 중...' : '등록'}
                    </button>
                </div>
            </form>

            {isLoginModalOpen && (
                <ConfirmModal
                    message="로그인 후 이용 가능한 기능입니다."
                    confirmLabel="로그인하기"
                    onCancel={() => setIsLoginModalOpen(false)}
                    onConfirm={() => navigate('/login')}
                />
            )}
        </div>
    );
}

export default ClassQnaList;