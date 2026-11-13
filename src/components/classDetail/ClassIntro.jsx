import DOMPurify from 'dompurify';
import { MapPin } from 'lucide-react';
import { formatDuration } from '../../utils/format.js';

// detail: 상세 API 응답 data
function ClassIntro({ detail }) {
    const { description, classType, address, lectureCount, totalDurationMinutes } = detail;

    const isOnline = classType === 'ONLINE';
    const totalText = formatDuration(totalDurationMinutes).replace('약 ', '');

    //    강사가 Tiptap으로 쓴 HTML에서 위험한 코드(script, onerror 등)만 제거
    //    문단·굵게·목록·이미지 같은 서식은 그대로 남음
    const safeHtml = DOMPurify.sanitize(description ?? '');

    // 온라인 수강 방법 박스 (수강 기기는 모든 클래스 공통이라 고정 문구)
    const onlineInfo = [
        { label: '강의 구성', value: `VOD ${lectureCount}강 · 총 ${totalText}` },
        { label: '수강 기기', value: 'PC · 모바일 · 태블릿' },
    ];

    return (
        <div>
            {/* 이런 걸 배웁니다 */}
            <h3 className="text-lg font-semibold text-gray-900">이런 걸 배웁니다</h3>
            {safeHtml ? (
                <div
                    // 강사가 쓴 HTML 태그엔 className을 못 붙이니까, 바깥에서 "안쪽 태그는 이렇게" 규칙을 줌
                    className="mt-3 leading-relaxed text-gray-700
            [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_em]:italic
            [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900
            [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_h3]:text-gray-900
            [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5
            [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
            [&_li]:mb-1
            [&_a]:text-brand [&_a]:underline
            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500
            [&_img]:my-4 [&_img]:w-full [&_img]:rounded-xl"
                    // 정화한 HTML만 넣기 (원본 description을 직접 넣으면 절대 안 됨)
                    dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
            ) : (
                <p className="mt-3 text-gray-400">등록된 소개가 없습니다.</p>
            )}

            {isOnline ? (
                // ───── 온라인: 수강 방법 ─────
                <div className="mt-12">
                    <h3 className="text-lg font-semibold text-gray-900">수강 방법</h3>
                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {onlineInfo.map((item) => (
                            <div key={item.label} className="rounded-xl border border-gray-200 px-5 py-4">
                                <dt className="text-xs text-gray-500">{item.label}</dt>
                                <dd className="mt-1 font-medium text-gray-900">{item.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            ) : (
                // ───── 오프라인: 수업 장소 ─────
                <div className="mt-12">
                    <h3 className="text-lg font-semibold text-gray-900">수업 장소</h3>
                    <p className="mt-2 flex items-center gap-1.5 text-gray-700">
                        <MapPin size={16} className="shrink-0 text-gray-500" />
                        {address}
                    </p>
                    {/* 지도 API(네이버·카카오·구글) 선정 후 교체 */}
                    <div className="mt-4 flex aspect-[16/7] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                        지도 영역 (지도 API 선정 후)
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassIntro;