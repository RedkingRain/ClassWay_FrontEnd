import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL, authFetch } from '../../utils/auth.js';
import { useCategories } from '../../utils/api.js';
import Dropdown from '../common/Dropdown.jsx';
import TiptapEditor from '../common/TiptapEditor.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';
import AlertModal from '../common/AlertModal.jsx';
import ClassLocationMap from '../classDetail/ClassLocationMap.jsx';
import CurriculumEditor from '../common/CurriculumEditor.jsx';

const MAX_TITLE_LENGTH = 100;
const MIN_SUMMARY_LENGTH = 10;
const MAX_SUMMARY_LENGTH = 250;
const MAX_DESCRIPTION_LENGTH = 30000;
const MAX_PRICE = 1000000; // 최대 100만 원
const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MIN_BANNER_WIDTH = 1000; // 최소 가로 1000px (권장 1200px)
const ALLOWED_BANNER_EXTENSIONS = ['jpg', 'jpeg', 'png'];
const ALLOWED_BANNER_MIMES = ['image/jpeg', 'image/png'];

function resolveImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('/') && !url.startsWith('//')) {
        return `${API_BASE_URL}${url}`;
    }
    return url;
}

/**
 * [TUTOR-001] 강사 클래스 등록 · 수정 통합 페이지
 * - /instructor/classes/new         -> 신규 등록 모드
 * - /instructor/classes/:classId/edit -> 수정 모드
 */
function InstructorClassFormPage() {
    const { classId } = useParams();
    const isEditMode = Boolean(classId);
    const navigate = useNavigate();
    const { tutorStatus } = useOutletContext() || {};
    const isApproved = tutorStatus === 'APPROVED';

    const curriculumRef = useRef(null);
    const bannerInputRef = useRef(null);

    // 카테고리 목록 조회 (GET /categories)
    const { data: categories } = useCategories();
    const categoryOptions = categories.map((cat) => ({
        value: String(cat.categoryId),
        label: cat.name,
    }));

    // 수정 모드 초기 로딩 상태 및 클래스 상태(status)
    const [loadedKey, setLoadedKey] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [curriculumLoadError, setCurriculumLoadError] = useState('');
    const [classStatus, setClassStatus] = useState('DRAFT');

    const currentRequestKey = isEditMode ? `${classId}:${reloadKey}` : null;
    const isPageLoading = isEditMode && isApproved && loadedKey !== currentRequestKey;

    // 입력 폼 상태
    const [classType, setClassType] = useState('OFFLINE');
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [summary, setSummary] = useState('');
    const [price, setPrice] = useState(0);
    const [discountRate, setDiscountRate] = useState(0);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState('');
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState('');
    const [description, setDescription] = useState('');
    const [mainAddress, setMainAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // 제출 및 모달 상태
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmType, setConfirmType] = useState(null); // 'CANCEL' | 'SAVE' | null
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '안내',
        message: '',
    });

    function openAlert(message, alertTitle = '입력 항목 확인') {
        setAlertState({
            isOpen: true,
            title: alertTitle,
            message,
        });
    }

    // 미리보기용 Object URL 메모리 정리
    useEffect(() => {
        return () => {
            if (bannerPreviewUrl && bannerPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(bannerPreviewUrl);
            }
        };
    }, [bannerPreviewUrl]);

    // 수정 모드 진입 시 기존 클래스 정보 조회 (GET /tutor/{classId})
    useEffect(() => {
        if (!isEditMode || !isApproved) {
            return;
        }

        let ignore = false;
        const reqKey = `${classId}:${reloadKey}`;

        async function fetchClassDetail() {
            try {
                const response = await authFetch(`/tutor/${encodeURIComponent(classId)}`);
                const result = await response.json().catch(() => ({}));
                if (ignore) return;

                if (!response.ok || !result.success || !result.data) {
                    throw new Error(result.message || '클래스 정보를 불러오지 못했습니다.');
                }

                const data = result.data;
                setClassStatus(data.status || 'DRAFT');
                setClassType(data.classType === 'ONLINE' ? 'ONLINE' : 'OFFLINE');
                setTitle(data.title ?? '');
                setCategoryId(data.categoryId != null ? String(data.categoryId) : '');
                setSummary(data.summary ?? '');
                setPrice(typeof data.price === 'number' ? data.price : 0);
                setDiscountRate(typeof data.discountRate === 'number' ? data.discountRate : 0);
                setExistingThumbnailUrl(data.thumbnailUrl ?? '');
                setDescription(data.description ?? '');

                if (data.address) {
                    const [mainPart, ...restParts] = String(data.address).split('|');
                    setMainAddress((mainPart || '').trim());
                    setDetailAddress(restParts.join('|').trim());
                } else {
                    setMainAddress('');
                    setDetailAddress('');
                }

                setLoadError('');
                setLoadedKey(reqKey);
            } catch (error) {
                if (ignore) return;
                const msg = error.message || '클래스 정보를 불러오지 못했습니다.';
                setLoadError(msg);
                setLoadedKey(reqKey);
            }
        }

        fetchClassDetail();

        return () => {
            ignore = true;
        };
    }, [classId, isEditMode, isApproved, reloadKey]);

    if (!isApproved) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-24 text-center shadow-sm">
                <p className="text-lg font-bold text-gray-900">
                    {tutorStatus === 'REJECTED'
                        ? '강사 신청이 반려되었습니다'
                        : '강사 승인 심사가 진행 중입니다'}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    관리자 승인이 완료된 후 클래스를 등록하고 수정할 수 있습니다.
                </p>
            </div>
        );
    }

    // ── 클래스 상태(status)별 수정 차단 / 비활성화 규칙 ────────────
    // PENDING, STOPPED: 모든 데이터 수정 차단
    // PUBLISHED: 진행 방식, 클래스 명, 카테고리, 가격, 할인율 수정 금지
    // HIDDEN: 진행 방식, 클래스 명, 카테고리 수정 금지
    // DRAFT (및 신규 등록): 모든 항목 수정 가능
    const isAllBlocked =
        isEditMode && (classStatus === 'PENDING' || classStatus === 'STOPPED');
    const isCoreLocked =
        isEditMode &&
        (isAllBlocked || classStatus === 'PUBLISHED' || classStatus === 'HIDDEN');
    const isPriceLocked =
        isEditMode && (isAllBlocked || classStatus === 'PUBLISHED');

    // ── 가격 및 할인율 실시간 최종 판매가 계산 (명세서 공식) ─────────
    const numericPrice = Number(price) || 0;
    const numericDiscountRate = Number(discountRate) || 0;
    const salePrice =
        !numericDiscountRate || numericDiscountRate === 0
            ? null
            : Math.floor((numericPrice * (100 - numericDiscountRate)) / 1000) * 10;
    const finalDisplayPrice = salePrice !== null ? salePrice : numericPrice;

    // 가격 입력 핸들러 (0 ~ 1,000,000)
    function handlePriceChange(e) {
        if (isPriceLocked) return;
        const digits = e.target.value.replace(/\D/g, '');
        if (digits === '') {
            setPrice(0);
            return;
        }
        const parsed = parseInt(digits, 10);
        setPrice(Math.min(MAX_PRICE, Math.max(0, parsed)));
    }

    // 할인율 입력 핸들러 (0 ~ 100)
    function handleDiscountRateChange(e) {
        if (isPriceLocked) return;
        const digits = e.target.value.replace(/\D/g, '');
        if (digits === '') {
            setDiscountRate(0);
            return;
        }
        const parsed = parseInt(digits, 10);
        setDiscountRate(Math.min(100, Math.max(0, parsed)));
    }

    // 배너 이미지 파일 선택 및 검증 (JPG/PNG, 5MB 이하, 가로 1000px 이상)
    function handleBannerChange(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isValidType =
            ALLOWED_BANNER_EXTENSIONS.includes(ext) &&
            (!file.type || ALLOWED_BANNER_MIMES.includes(file.type));

        if (!isValidType) {
            openAlert('배너 이미지는 JPG, PNG 파일만 업로드할 수 있습니다.');
            return;
        }

        if (file.size > MAX_BANNER_SIZE_BYTES) {
            openAlert('배너 이미지 크기는 5MB 이하여야 합니다.');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            if (img.naturalWidth < MIN_BANNER_WIDTH) {
                URL.revokeObjectURL(objectUrl);
                openAlert(
                    `배너 이미지의 가로 해상도는 최소 ${MIN_BANNER_WIDTH}px 이상이어야 합니다. (현재 ${img.naturalWidth}px, 권장 1200px 이상)`
                );
                return;
            }

            setBannerPreviewUrl((prevUrl) => {
                if (prevUrl && prevUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(prevUrl);
                }
                return objectUrl;
            });
            setBannerFile(file);
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            openAlert('이미지 파일을 읽을 수 없습니다. 다른 파일을 선택해 주세요.');
        };

        img.src = objectUrl;
    }

    // 카카오 우편번호 서비스 팝업 호출
    function handleOpenPostcode() {
        if (isAllBlocked) return;
        if (!window.daum || !window.daum.Postcode) {
            openAlert(
                '우편번호 검색 서비스를 불러오지 못했습니다. 페이지를 새로고침한 후 다시 시도해 주세요.',
                '서비스 로드 오류'
            );
            return;
        }

        new window.daum.Postcode({
            oncomplete: (data) => {
                setMainAddress(data.address || '');
            },
        }).open();
    }

    // 전체 폼 유효성 검사
    function validateForm() {
        if (isEditMode && loadError) {
            openAlert('클래스 정보를 불러오지 못한 상태에서는 저장할 수 없습니다. 다시 시도해 주세요.');
            return false;
        }

        if (isEditMode && (curriculumLoadError || curriculumRef.current?.hasLoadError?.())) {
            openAlert(
                '커리큘럼 정보를 불러오지 못한 상태에서는 저장할 수 없습니다. 커리큘럼 영역에서 다시 불러오기를 진행해 주세요.'
            );
            return false;
        }

        if (isAllBlocked) {
            openAlert('현재 상태에서는 클래스 정보를 수정할 수 없습니다.');
            return false;
        }

        if (classType !== 'OFFLINE' && classType !== 'ONLINE') {
            openAlert('진행 방식을 선택해 주세요.');
            return false;
        }

        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            openAlert('클래스 명을 입력해 주세요.');
            return false;
        }
        if (trimmedTitle.length > MAX_TITLE_LENGTH) {
            openAlert(`클래스 명은 최대 ${MAX_TITLE_LENGTH}자까지 입력할 수 있습니다.`);
            return false;
        }

        if (!categoryId) {
            openAlert('카테고리를 선택해 주세요.');
            return false;
        }

        const trimmedSummary = summary.trim();
        if (!trimmedSummary) {
            openAlert('클래스 한 줄 소개를 입력해 주세요. (공백만 입력할 수 없습니다)');
            return false;
        }
        if (trimmedSummary.length < MIN_SUMMARY_LENGTH || summary.length > MAX_SUMMARY_LENGTH) {
            openAlert(
                `클래스 한 줄 소개는 공백 제외 ${MIN_SUMMARY_LENGTH}자 이상, 최대 ${MAX_SUMMARY_LENGTH}자 이하로 입력해 주세요.`
            );
            return false;
        }

        if (numericPrice < 0 || numericPrice > MAX_PRICE) {
            openAlert('가격은 0원부터 1,000,000원 사이로 입력해 주세요.');
            return false;
        }

        if (numericDiscountRate < 0 || numericDiscountRate > 100) {
            openAlert('할인율은 0부터 100 사이로 입력해 주세요.');
            return false;
        }

        if (!isEditMode && !bannerFile) {
            openAlert('배너 이미지를 선택해 주세요.');
            return false;
        }
        if (isEditMode && !bannerFile && !existingThumbnailUrl) {
            openAlert('배너 이미지를 선택해 주세요.');
            return false;
        }

        if (!description || !description.trim()) {
            openAlert('클래스 상세 소개를 입력해 주세요.');
            return false;
        }

        if (curriculumRef.current) {
            const curriculumResult = curriculumRef.current.validate();
            if (!curriculumResult.valid) {
                openAlert(curriculumResult.message);
                return false;
            }
        }

        if (classType === 'OFFLINE' && !mainAddress.trim()) {
            openAlert('오프라인 클래스는 수업 장소를 입력해 주세요.');
            return false;
        }

        return true;
    }

    // 저장 / 수정 완료 버튼 클릭 시 검증 후 확인 모달 표시
    function handleSaveButtonClick() {
        if (!validateForm()) return;
        setConfirmType('SAVE');
    }

    // 백엔드 전송용 주소 문자열 생성 (상세 주소가 있을 때만 '메인주소|상세주소', 없으면 '메인주소')
    function buildCombinedAddress() {
        const trimmedMain = mainAddress.trim();
        const trimmedDetail = detailAddress.trim();
        return trimmedDetail ? `${trimmedMain}|${trimmedDetail}` : trimmedMain;
    }

    // ConfirmModal에서 확인 클릭 시 실제 API 호출
    async function handleConfirmSubmit() {
        setConfirmType(null);
        setIsSubmitting(true);

        try {
            if (!isEditMode) {
                // ── 1. 클래스 신규 등록: POST /tutor/class_create (FormData) ──
                const formData = new FormData();
                formData.append('classType', classType);
                formData.append('title', title.trim());
                formData.append('categoryId', Number(categoryId));
                formData.append('summary', summary.trim());
                formData.append('price', numericPrice);
                formData.append('discountRate', numericDiscountRate);
                if (bannerFile) {
                    formData.append('bannerImage', bannerFile);
                }
                formData.append('description', description);

                if (classType === 'OFFLINE') {
                    formData.append('address', buildCombinedAddress());
                }

                const { chapters, lectures } = curriculumRef.current.getPayload();

                chapters.forEach((ch, idx) => {
                    formData.append(`chapters[${idx}].title`, ch.title);
                    formData.append(`chapters[${idx}].sortOrder`, ch.sortOrder);
                });

                lectures.forEach((lec, idx) => {
                    formData.append(`lectures[${idx}].chapterSortOrder`, lec.chapterSortOrder);
                    formData.append(`lectures[${idx}].title`, lec.title);
                    formData.append(`lectures[${idx}].durationSec`, lec.durationSec);
                    formData.append(`lectures[${idx}].sortOrder`, lec.sortOrder);
                });

                const response = await authFetch('/tutor/class_create', {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json().catch(() => ({}));

                if (!response.ok || !result.success) {
                    throw new Error(result.message || '클래스 등록에 실패했습니다.');
                }

                navigate('/instructor/classes', { replace: true });
            } else {
                // ── 2. 클래스 수정: PATCH /tutor/{classId}/chapter + PATCH /tutor/{classId} ──
                // (1) 커리큘럼 저장 (내부에서 PATCH 성공 직후 최신 chapterId/lectureId를 재조회하여 동기화함)
                await curriculumRef.current.saveCurriculum(classId);

                // (2) 클래스 기본/상세 정보 저장
                try {
                    const formData = new FormData();
                    formData.append('classType', classType);
                    formData.append('title', title.trim());
                    formData.append('categoryId', Number(categoryId));
                    formData.append('summary', summary.trim());
                    formData.append('price', numericPrice);
                    formData.append('discountRate', numericDiscountRate);
                    if (bannerFile) {
                        formData.append('bannerImage', bannerFile);
                    }
                    formData.append('description', description);

                    if (classType === 'OFFLINE') {
                        formData.append('address', buildCombinedAddress());
                    }

                    const response = await authFetch(`/tutor/${encodeURIComponent(classId)}`, {
                        method: 'PATCH',
                        body: formData,
                    });
                    const result = await response.json().catch(() => ({}));

                    if (!response.ok || !result.success) {
                        throw new Error(result.message || '클래스 기본 정보 수정에 실패했습니다.');
                    }
                } catch (classPatchError) {
                    throw new Error(
                        `커리큘럼 변경 사항은 저장되었으나 클래스 기본 정보 수정에 실패했습니다.\n(${
                            classPatchError.message || '서버 오류'
                        })\n입력 항목을 확인한 뒤 '수정 완료'를 다시 눌러 재시도해 주세요.`,
                        { cause: classPatchError }
                    );
                }

                navigate('/instructor/classes', { replace: true });
            }
        } catch (error) {
            openAlert(error.message || '저장 중 오류가 발생했습니다.', '저장 실패');
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleCancelConfirm() {
        setConfirmType(null);
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/instructor/classes');
        }
    }

    const displayedBannerSrc = bannerPreviewUrl || resolveImageUrl(existingThumbnailUrl);

    if (isPageLoading) {
        return (
            <div className="space-y-6 py-8">
                <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
                <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            </div>
        );
    }

    // 수정 모드에서 클래스 정보 조회 실패 시 빈 폼 노출 및 덮어쓰기 저장을 원천 차단하고 재시도 화면 표시
    if (isEditMode && loadError) {
        return (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 px-4 text-center shadow-sm">
                <p className="text-base font-semibold text-gray-800">
                    클래스 정보를 불러오지 못했습니다
                </p>
                <p className="mt-1 text-xs text-gray-500">{loadError}</p>
                <p className="mt-1 text-xs text-gray-400">
                    기존 클래스 데이터 보호를 위해 조회 실패 상태에서는 수정할 수 없습니다.
                </p>
                <div className="mt-5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/instructor/classes')}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        목록으로 돌아가기
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setLoadError('');
                            setReloadKey((k) => k + 1);
                        }}
                        className="rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand/90"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-16">
            {/* 상단 돌아가기 링크 */}
            <Link
                to="/instructor/classes"
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
            >
                <ChevronLeft size={14} />
                클래스 관리로 돌아가기
            </Link>

            {/* 페이지 헤더 */}
            <div className="mt-3">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? '클래스 수정' : '클래스 등록'}
                </h1>
                <p className="mt-1.5 text-xs text-gray-500">
                    <span className="font-semibold text-point">*</span> 표시는 필수 항목입니다.{' '}
                    {isEditMode
                        ? '수정한 내용은 저장 후 클래스 상세에 반영됩니다.'
                        : '저장하면 관리자 검토 후 오픈할 수 있습니다.'}
                </p>
            </div>

            {/* PENDING / STOPPED 수정 차단 안내 배너 */}
            {isAllBlocked && (
                <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                    {classStatus === 'PENDING'
                        ? '현재 관리자 검토 대기(PENDING) 중인 클래스이므로 데이터를 수정할 수 없습니다.'
                        : '판매 중지(STOPPED)된 클래스이므로 데이터를 수정할 수 없습니다.'}
                </div>
            )}

            {/* ── 1. 진행 방식 섹션 ─────────────────────────────── */}
            <section className="mt-8">
                <h2 className="border-b border-gray-900 pb-2.5 text-base font-bold text-gray-900">
                    진행 방식
                </h2>

                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <span className="text-sm font-medium text-gray-900 md:pt-2">
                        진행 방식 <span className="text-point">*</span>
                    </span>
                    <div>
                        <div className="flex gap-2" role="radiogroup" aria-label="진행 방식">
                            {[
                                { value: 'OFFLINE', label: '오프라인' },
                                { value: 'ONLINE', label: '온라인' },
                            ].map((opt) => {
                                const isSelected = classType === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        disabled={isCoreLocked}
                                        onClick={() => setClassType(opt.value)}
                                        className={`h-10 rounded-lg border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                            isSelected
                                                ? 'border-brand bg-white font-semibold text-brand ring-1 ring-brand'
                                                : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            {isCoreLocked
                                ? '진행 방식은 등록 후 변경할 수 없습니다.'
                                : '먼저 선택하면 아래 입력 항목이 진행 방식에 맞게 바뀝니다. (오프라인: 수업 장소 / 온라인: 장소·일정 없음)'}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 2. 기본 정보 섹션 ─────────────────────────────── */}
            <section className="mt-10">
                <h2 className="border-b border-gray-900 pb-2.5 text-base font-bold text-gray-900">
                    기본 정보
                </h2>

                {/* 클래스명 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-center">
                    <label htmlFor="class-title" className="text-sm font-medium text-gray-900">
                        클래스명 <span className="text-point">*</span>
                    </label>
                    <input
                        id="class-title"
                        type="text"
                        value={title}
                        disabled={isCoreLocked}
                        maxLength={MAX_TITLE_LENGTH}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={
                            classType === 'ONLINE'
                                ? '예: 집에서 배우는 마카롱 기초 온라인 클래스'
                                : '예: 주말 원데이 마카롱 만들기'
                        }
                        className="h-11 w-full max-w-xl rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>

                {/* 카테고리 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-center">
                    <label htmlFor="class-category" className="text-sm font-medium text-gray-900">
                        카테고리 <span className="text-point">*</span>
                    </label>
                    <Dropdown
                        id="class-category"
                        label="카테고리"
                        options={categoryOptions}
                        value={categoryId}
                        onChange={setCategoryId}
                        placeholder="카테고리 선택"
                        disabled={isCoreLocked}
                        className="w-full max-w-xl"
                    />
                </div>

                {/* 클래스 한 줄 소개 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <label
                        htmlFor="class-summary"
                        className="text-sm font-medium text-gray-900 md:pt-2.5"
                    >
                        클래스 한 줄 소개 <span className="text-point">*</span>
                    </label>
                    <div className="max-w-xl">
                        <textarea
                            id="class-summary"
                            rows={3}
                            value={summary}
                            disabled={isAllBlocked}
                            maxLength={MAX_SUMMARY_LENGTH}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="클래스의 핵심 매력을 한 줄로 소개해 주세요 (10~250자)"
                            className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        <div className="mt-1 flex justify-between text-xs text-gray-400">
                            <span>10자 이상 ~ 최대 250자</span>
                            <span>
                                {summary.length} / {MAX_SUMMARY_LENGTH}자
                            </span>
                        </div>
                    </div>
                </div>

                {/* 가격 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <label
                        htmlFor="class-price"
                        className="text-sm font-medium text-gray-900 md:pt-2.5"
                    >
                        가격 <span className="text-point">*</span>
                    </label>
                    <div>
                        <div className="flex items-center gap-2">
                            <input
                                id="class-price"
                                type="text"
                                inputMode="numeric"
                                value={numericPrice.toLocaleString()}
                                disabled={isPriceLocked}
                                onChange={handlePriceChange}
                                className="h-11 w-44 rounded-lg border border-gray-300 bg-white px-3.5 text-right text-sm font-medium text-gray-900 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            />
                            <span className="text-sm text-gray-700">원</span>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400">1인 기준 (0원 ~ 1,000,000원)</p>
                    </div>
                </div>

                {/* 할인율 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <label
                        htmlFor="class-discount"
                        className="text-sm font-medium text-gray-900 md:pt-2.5"
                    >
                        할인율
                    </label>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                id="class-discount"
                                type="text"
                                inputMode="numeric"
                                value={String(numericDiscountRate)}
                                disabled={isPriceLocked}
                                onChange={handleDiscountRateChange}
                                className="h-11 w-24 rounded-lg border border-gray-300 bg-white px-3.5 text-right text-sm font-medium text-gray-900 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            />
                            <span className="text-sm text-gray-700">%</span>
                            <span className="ml-2 text-sm font-bold text-point">
                                최종 판매가 {finalDisplayPrice.toLocaleString()}원
                            </span>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-400">
                            선택 입력 · 0이면 할인 없음 · 0~100 사이 숫자 · 원 단위 버림 (자동 계산)
                        </p>
                    </div>
                </div>

                {/* 배너 이미지 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <span className="text-sm font-medium text-gray-900 md:pt-2">
                        배너 이미지 <span className="text-point">*</span>
                    </span>
                    <div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                {displayedBannerSrc ? (
                                    <img
                                        src={displayedBannerSrc}
                                        alt="배너 미리보기"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon size={28} className="text-gray-300" />
                                )}
                            </div>

                            <div>
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                                    disabled={isAllBlocked}
                                    onChange={handleBannerChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    disabled={isAllBlocked}
                                    onClick={() => bannerInputRef.current?.click()}
                                    className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    이미지 선택
                                </button>
                                <p className="mt-2 text-xs text-gray-400">
                                    JPG · PNG · 5MB 이하 · 가로 1000px 이상 (권장 1200px 이상)
                                </p>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                            클래스 상세 상단과 목록 썸네일에 사용됩니다.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── 3. 상세 정보 섹션 ─────────────────────────────── */}
            <section className="mt-10">
                <h2 className="border-b border-gray-900 pb-2.5 text-base font-bold text-gray-900">
                    상세 정보
                </h2>

                {/* 클래스 상세 소개 */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <span className="text-sm font-medium text-gray-900 md:pt-2.5">
                        클래스 상세 소개 <span className="text-point">*</span>
                    </span>
                    <div>
                        <TiptapEditor
                            value={description}
                            onChange={setDescription}
                            limit={MAX_DESCRIPTION_LENGTH}
                            disabled={isAllBlocked}
                            label="클래스 상세 소개"
                            placeholder="클래스 상세에 보여질 소개 내용을 입력하세요..."
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            클래스 상세의 &apos;강의 소개&apos; 탭에 그대로 보여집니다.
                        </p>
                    </div>
                </div>

                {/* 커리큘럼 (재사용 분리 컴포넌트) */}
                <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                    <span className="text-sm font-medium text-gray-900 md:pt-2.5">
                        커리큘럼 <span className="text-point">*</span>
                    </span>
                    <CurriculumEditor
                        ref={curriculumRef}
                        classId={isEditMode ? classId : undefined}
                        disabled={isAllBlocked}
                        onLoadError={(msg) => {
                            setCurriculumLoadError(msg);
                            if (msg) {
                                openAlert(msg, '커리큘럼 조회 실패');
                            }
                        }}
                    />
                </div>
            </section>

            {/* ── 4. 오프라인 수업 정보 섹션 (온라인 선택 시 미표시) ── */}
            {classType === 'OFFLINE' && (
                <section className="mt-10">
                    <h2 className="border-b border-gray-900 pb-2.5 text-base font-bold text-gray-900">
                        오프라인 수업 정보
                    </h2>

                    <div className="grid gap-2 border-b border-gray-100 py-5 md:grid-cols-[140px_1fr] md:items-start">
                        <label
                            htmlFor="offline-main-address"
                            className="text-sm font-medium text-gray-900 md:pt-2.5"
                        >
                            수업 장소 <span className="text-point">*</span>
                        </label>
                        <div className="max-w-xl space-y-2.5">
                            <div className="flex gap-2">
                                <input
                                    id="offline-main-address"
                                    type="text"
                                    readOnly
                                    value={mainAddress}
                                    disabled={isAllBlocked}
                                    onClick={!isAllBlocked ? handleOpenPostcode : undefined}
                                    placeholder="주소 검색 버튼을 눌러 주소를 선택하세요"
                                    className="h-11 flex-1 cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:text-gray-500"
                                />
                                <button
                                    type="button"
                                    disabled={isAllBlocked}
                                    onClick={handleOpenPostcode}
                                    className="h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    주소 검색
                                </button>
                            </div>

                            <input
                                id="offline-detail-address"
                                type="text"
                                value={detailAddress}
                                disabled={isAllBlocked}
                                onChange={(e) => setDetailAddress(e.target.value)}
                                placeholder="상세 주소 (선택)"
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            />

                            <p className="text-xs text-gray-400">
                                &apos;주소 검색&apos;은 카카오 우편번호 서비스로 도로명 주소 선택 → 지역명이 자동 세팅됩니다. 수업 일정·회차별 정원은 등록 후 회차 관리에서 생성합니다.
                            </p>

                            {/* 메인 주소가 설정되면 상세 주소칸 하단에 카카오맵 표시 */}
                            {mainAddress && <ClassLocationMap address={mainAddress} />}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 하단 취소 / 저장(수정 완료) 버튼 ─────────────────── */}
            <div className="mt-10 flex justify-end gap-2.5">
                <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setConfirmType('CANCEL')}
                    className="h-11 w-28 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    취소
                </button>
                <button
                    type="button"
                    disabled={
                        isSubmitting ||
                        isAllBlocked ||
                        (isEditMode && (Boolean(loadError) || Boolean(curriculumLoadError)))
                    }
                    onClick={handleSaveButtonClick}
                    className="h-11 w-32 rounded-lg bg-brand text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting
                        ? '처리 중...'
                        : isEditMode
                          ? '수정 완료'
                          : '저장'}
                </button>
            </div>

            {/* 1. 취소 확인 모달 */}
            {confirmType === 'CANCEL' && (
                <ConfirmModal
                    message={
                        isEditMode
                            ? '입력하신 내용이 저장되지 않습니다. 클래스 수정을 취소하시겠습니까?'
                            : '입력하신 내용이 저장되지 않습니다. 클래스 생성을 취소하시겠습니까?'
                    }
                    cancelLabel="취소"
                    confirmLabel="확인"
                    onCancel={() => setConfirmType(null)}
                    onConfirm={handleCancelConfirm}
                />
            )}

            {/* 2. 저장 / 수정 완료 확인 모달 */}
            {confirmType === 'SAVE' && (
                <ConfirmModal
                    title={
                        isEditMode
                            ? undefined
                            : '입력하신 클래스 정보를 저장 하시겠습니까?'
                    }
                    message={
                        isEditMode
                            ? '입력하신 클래스 정보로 수정 하시겠습니까?'
                            : '관리자에게 클래스 등록 요청은 전달되지 않습니다.'
                    }
                    cancelLabel="취소"
                    confirmLabel="확인"
                    onCancel={() => setConfirmType(null)}
                    onConfirm={handleConfirmSubmit}
                />
            )}

            {/* 3. 검증 및 API 오류 알림 모달 */}
            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                onClose={() => setAlertState((prev) => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

export default InstructorClassFormPage;
