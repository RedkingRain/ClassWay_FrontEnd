import { useState } from 'react';
import ClassCurriculum from './ClassCurriculum.jsx';
import ClassIntro from './ClassIntro.jsx';
import ClassReviewList from './ClassReviewList.jsx';

// detail: 상세 API 응답 data
function ClassDetailTabs({ detail }) {
    // 지금 선택된 탭 기억 (처음엔 강의 소개)
    const [activeTab, setActiveTab] = useState('intro');

    // 탭 목록 — key: 코드에서 구분하는 이름 / label: 화면 글자
    const tabs = [
        { key: 'intro', label: '강의 소개' },
        { key: 'curriculum', label: '커리큘럼' },
        { key: 'reviews', label: `수강평 ${detail.reviewCount.toLocaleString()}` },
        { key: 'qna', label: 'Q&A' },
    ];

    return (
        <section className="mt-10">
            {/* 탭 버튼 줄 */}
            <div role="tablist" className="grid grid-cols-4 border-b border-gray-200">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(tab.key)}
                            className={`-mb-px border-b-2 py-3 text-sm ${
                                isActive
                                    ? 'border-brand font-semibold text-brand'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* 탭 내용 — 선택된 탭 하나만 보여줌 */}
            <div className="py-8">
                {activeTab === 'intro' && <ClassIntro detail={detail} />}
                {activeTab === 'curriculum' && (
                    <ClassCurriculum classType={detail.classType} chapters={detail.chapters} />
                )}
                {activeTab === 'reviews' && (
                    <ClassReviewList
                        classId={detail.classId}
                        reviewCount={detail.reviewCount}
                        avgRating={detail.avgRating}
                    />
                )}
                {activeTab === 'qna' && <p className="text-gray-400">Q&A 준비 중</p>}
            </div>
        </section>
    );
}

export default ClassDetailTabs;