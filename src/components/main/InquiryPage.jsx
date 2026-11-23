import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { authFetch } from '../../utils/auth.js';
import TiptapEditor from '../common/TiptapEditor.jsx';
import Dropdown from '../common/Dropdown.jsx';
import { formatFileSize } from '../../utils/format.js';

const CATEGORIES = [
    { value: 'PAYMENT', label: '결제 및 환불' },
    { value: 'RESERVATION', label: '수강 및 예약' },
    { value: 'ACCOUNT', label: '계정' },
    { value: 'TUTOR', label: '강사 신청' },
    { value: 'ETC', label: '기타' },
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];

const inputClass =
    'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand';

// 1:1 문의 작성 화면 (/support/inquiry), 로그인 회원만
function InquiryPage() {
    const { isAuthenticated, isLoading } = useAuth();
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [orderNo, setOrderNo] = useState('');
    const [files, setFiles] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDone, setIsDone] = useState(false);

    // 새로고침 직후 로그인 확인 전에 로그인 안내가 잠깐 보이지 않게 기다림
    if (isLoading) return null;

    function handleFileChange(event) {
        const picked = Array.from(event.target.files);
        // 같은 파일을 지웠다가 다시 고를 수 있게 비워 둠
        event.target.value = '';

        if (files.length + picked.length > MAX_FILES) {
            setErrorMessage('첨부 파일은 최대 3개까지 올릴 수 있습니다.');
            return;
        }
        const wrongType = picked.find(
            (file) => !ALLOWED_EXTENSIONS.includes(file.name.split('.').pop().toLowerCase())
        );
        if (wrongType) {
            setErrorMessage(`${wrongType.name}: JPG, PNG, PDF 파일만 올릴 수 있습니다.`);
            return;
        }
        const tooBig = picked.find((file) => file.size > MAX_FILE_SIZE);
        if (tooBig) {
            setErrorMessage(`${tooBig.name}: 파일당 10MB까지 올릴 수 있습니다.`);
            return;
        }

        setErrorMessage('');
        setFiles([...files, ...picked]);
    }

    function handleRemoveFile(removeIndex) {
        setFiles(files.filter((_, index) => index !== removeIndex));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setIsDone(false);

        if (!category || !title.trim() || !content) {
            setErrorMessage('문의 유형, 제목, 내용을 입력해 주세요.');
            return;
        }

        // 칸 이름은 백엔드 InquiryCreateRequest와 똑같이 맞춤
        const formData = new FormData();
        formData.append('category', category);
        formData.append('title', title.trim());
        formData.append('content', content);
        if (orderNo.trim()) formData.append('orderNo', orderNo.trim());
        files.forEach((file) => formData.append('files', file));

        setIsSubmitting(true);
        setErrorMessage('');
        try {
            const response = await authFetch('/inquiries', { method: 'POST', body: formData });
            // 크기 초과는 서버가 JSON 없이 줄 수 있어서 상태 번호로 먼저 확인
            if (response.status === 413) {
                setErrorMessage('업로드 크기가 초과되었습니다. 파일당 10MB까지 올릴 수 있습니다.');
                return;
            }
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                setErrorMessage(result.message || '문의를 등록하지 못했습니다.');
                return;
            }

            setCategory('');
            setTitle('');
            setContent('');
            setOrderNo('');
            setFiles([]);
            setIsDone(true);
        } catch {
            setErrorMessage('서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section>
            <h1 className="text-2xl font-semibold text-gray-900">1:1 문의</h1>
            <p className="mt-2 text-sm text-gray-500">
                서비스 이용 중 궁금한 점을 남겨 주세요.
            </p>

            {!isAuthenticated && (
                <div className="mt-8 rounded-xl bg-gray-50 px-6 py-14 text-center">
                    <p className="text-sm text-gray-700">로그인 후 이용 가능한 기능입니다.</p>
                    <Link
                        to="/login"
                        className="mt-4 inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand/90"
                    >
                        로그인
                    </Link>
                </div>
            )}

            {isAuthenticated && (
                <form onSubmit={handleSubmit} className="mt-8 border-t border-gray-900">
                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[120px_1fr] md:items-center">
                        <label htmlFor="inquiry-category" className="text-sm font-medium text-gray-900">
                            문의 유형 <span className="text-point">*</span>
                        </label>
                        <Dropdown
                            id="inquiry-category"
                            options={CATEGORIES}
                            value={category}
                            onChange={setCategory}
                            placeholder="유형을 선택하세요"
                            label="문의 유형"
                            className="w-full md:max-w-xs"
                        />
                    </div>

                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[120px_1fr] md:items-center">
                        <label htmlFor="inquiry-title" className="text-sm font-medium text-gray-900">
                            제목 <span className="text-point">*</span>
                        </label>
                        <input
                            id="inquiry-title"
                            type="text"
                            value={title}
                            maxLength={100}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="제목을 입력하세요"
                            className={inputClass}
                        />
                    </div>

                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[120px_1fr]">
                        <p className="text-sm font-medium text-gray-900 md:pt-3">
                            내용 <span className="text-point">*</span>
                        </p>
                        <TiptapEditor
                            value={content}
                            onChange={setContent}
                            limit={1000}
                            label="문의 내용"
                            placeholder="문의 내용을 자세히 작성해주세요."
                        />
                    </div>

                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[120px_1fr] md:items-center">
                        <label htmlFor="inquiry-order-no" className="text-sm font-medium text-gray-900">
                            주문 번호
                        </label>
                        <input
                            id="inquiry-order-no"
                            type="text"
                            value={orderNo}
                            maxLength={64}
                            onChange={(event) => setOrderNo(event.target.value)}
                            placeholder="결제 및 환불 문의라면 주문 번호를 작성해주세요."
                            className={inputClass}
                        />
                    </div>

                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[120px_1fr]">
                        <p className="text-sm font-medium text-gray-900 md:pt-2.5">첨부 파일</p>
                        <div>
                            {/* label이 input을 감싸서, 글자를 눌러도 파일 고르는 창이 열림 */}
                            <label
                                className={`inline-flex w-full items-center justify-center rounded-lg border border-dashed border-gray-400 px-4 py-2.5 text-sm focus-within:border-brand md:max-w-xs ${
                                    files.length >= MAX_FILES
                                        ? 'cursor-not-allowed text-gray-400'
                                        : 'cursor-pointer text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    disabled={files.length >= MAX_FILES}
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                                파일 첨부
                            </label>
                            <p className="mt-2 text-xs text-gray-500">JPG, PNG, PDF 파일당 10MB, 최대 3개</p>

                            {files.length > 0 && (
                                <ul className="mt-3 space-y-2">
                                    {files.map((file, index) => (
                                        <li
                                            key={`${index}-${file.name}`}
                                            className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                                        >
                                            <span className="truncate">
                                                {file.name} ({formatFileSize(file.size)})
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFile(index)}
                                                aria-label={`${file.name} 삭제`}
                                                className="ml-2 shrink-0 text-gray-400 hover:text-gray-700"
                                            >
                                                <X size={16} aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col items-end gap-3">
                        {errorMessage && (
                            <p role="alert" className="text-sm text-red-500">
                                {errorMessage}
                            </p>
                        )}
                        {isDone && (
                            <p role="status" className="text-sm text-point">
                                문의가 등록되었습니다.
                            </p>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-brand px-8 py-3 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50"
                        >
                            {isSubmitting ? '등록 중...' : '문의 등록'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}

export default InquiryPage;