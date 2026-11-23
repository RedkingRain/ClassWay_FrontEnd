import { Link, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useApiData } from '../../utils/api.js';
import { formatDate } from '../../utils/format.js';
import Dropdown from '../common/Dropdown.jsx';

const TABS = [
    { key: 'service', type: 'SERVICE', label: '이용약관' },
    { key: 'privacy', type: 'PRIVACY', label: '개인정보 처리방침' },
    { key: 'refund', type: 'REFUND', label: '취소 · 환불 규정' },
];

// 약관, 정책 화면 (/terms?tab=service&version=12)
function TermsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // 주소에 없는 탭 이름이 와도 이용약관을 보여 줌
    const tab = TABS.find((item) => item.key === searchParams.get('tab')) ?? TABS[0];
    // 숫자만 허용해서 주소를 바꿔 다른 API를 부르지 못하게 함
    const versionParam = searchParams.get('version');
    const versionId = /^\d+$/.test(versionParam ?? '') ? versionParam : null;

    const versions = useApiData(`/terms/${tab.type}/versions`);
    const terms = useApiData(
        versionId ? `/terms/${tab.type}/versions/${versionId}` : `/terms/${tab.type}`
    );

    const versionList = versions.state === 'done' ? versions.data : [];
    const versionOptions = versionList.map((version, index) => ({
        value: String(version.id),
        label: `${formatDate(version.effectiveDate)} 시행${index === 0 ? ' (현재)' : ''}`,
    }));

    function handleVersionChange(id) {
        setSearchParams({ tab: tab.key, version: id });
    }
    return (
        <section>
            <h1 className="text-2xl font-semibold text-gray-900">약관 · 정책</h1>
            <p className="mt-2 text-sm text-gray-500">
                서비스 이용약관과 개인정보 처리방침, 취소 · 환불 규정입니다.
            </p>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
                <nav aria-label="약관 종류" className="flex gap-6 text-sm">
                    {TABS.map((item) => (
                        <Link
                            key={item.key}
                            to={`/terms?tab=${item.key}`}
                            aria-current={item.key === tab.key ? 'page' : undefined}
                            className={`-mb-px border-b-2 px-1 pb-3 ${
                                item.key === tab.key
                                    ? 'border-brand font-semibold text-brand'
                                    : 'border-transparent text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {versionOptions.length > 0 && (
                    <Dropdown
                        options={versionOptions}
                        value={versionId ?? versionOptions[0].value}
                        onChange={handleVersionChange}
                        label="시행일 선택"
                        placeholder="시행일 선택"
                        small
                        className="mb-1.5"
                    />
                )}
            </div>

            {terms.state === 'loading' && (
                <p className="py-20 text-center text-sm text-gray-400">약관을 불러오는 중입니다...</p>
            )}

            {terms.state === 'error' && (
                <p className="py-20 text-center text-sm text-gray-400">
                    등록된 약관이 없거나 불러오지 못했습니다.
                </p>
            )}

            {terms.state === 'done' && (
                <article className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900">{terms.data.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">시행일 {formatDate(terms.data.effectiveDate)}</p>
                    <div
                        // 관리자가 쓴 HTML 태그에는 className을 붙일 수 없어서 바깥에서 안쪽 태그 모양을 정함
                        className="mt-6 text-sm leading-relaxed text-gray-700
            [&_p]:mb-3
            [&_strong]:font-bold [&_strong]:text-gray-900
            [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900
            [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-semibold [&_h3]:text-gray-900
            [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5
            [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5
            [&_li]:mb-1
            [&_a]:text-brand [&_a]:underline
            [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse
            [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
            [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2"
                        // 원본을 그대로 넣으면 스크립트가 실행될 수 있어서 정화한 HTML만 넣음
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(terms.data.content ?? '') }}
                    />
                </article>
            )}
        </section>
    );
}

export default TermsPage;