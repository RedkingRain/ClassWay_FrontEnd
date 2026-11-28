import { Link } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import { formatDate } from '../../utils/format.js';

// 공지 / 학습 자료 게시판 (STUDY-001), 순서는 서버가 공지 먼저, 최신순으로 정해서 줌
function StudyPostTable({ classId, posts, isTutor }) {
    return (
        <section className="rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between px-7 py-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    공지 / 학습 자료 {posts.length}
                </h3>

                {/* 등록, 선택 삭제는 STUDY-004에서 연결 */}
                {isTutor && (
                    <div className="flex gap-2">
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
                            + 등록
                        </button>
                    </div>
                )}
            </div>

            {posts.length === 0 ? (
                <p className="border-t border-gray-200 py-14 text-center text-sm text-gray-400">
                    아직 등록된 공지 / 학습 자료가 없습니다.
                </p>
            ) : (
                <table className="w-full text-sm">
                    <thead className="border-y border-gray-200 bg-gray-50 text-left text-gray-500">
                    <tr>
                        <th className="w-24 px-7 py-3 font-normal">구분</th>
                        <th className="px-2 py-3 font-normal">제목</th>
                        <th className="w-40 px-2 py-3 font-normal">작성일</th>
                        <th className="w-24 px-7 py-3 font-normal">조회</th>
                    </tr>
                    </thead>
                    <tbody>
                    {posts.map((post) => (
                        <tr key={post.postId} className="border-b border-gray-200 last:border-b-0">
                            <td className="px-7 py-5">
                                {post.type === 'NOTICE' ? (
                                    <span className="font-medium text-point">공지</span>
                                ) : (
                                    <span className="text-gray-500">자료</span>
                                )}
                            </td>
                            <td className="px-2 py-5">
                                <Link
                                    to={`/study/${classId}/notice/${post.postId}`}
                                    className="text-gray-900 hover:underline"
                                >
                                    {post.title}
                                </Link>
                                {post.hasAttachment && (
                                    <Paperclip
                                        size={14}
                                        aria-label="첨부파일 있음"
                                        className="ml-1.5 inline text-gray-400"
                                    />
                                )}
                            </td>
                            <td className="px-2 py-5 text-gray-600">{formatDate(post.createdAt)}</td>
                            <td className="px-7 py-5 text-gray-600">{post.viewCount}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

export default StudyPostTable;