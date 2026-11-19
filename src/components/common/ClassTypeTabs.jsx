// value는 백엔드 classType 값, 순서는 와이어프레임 기준
const CLASS_TYPES = [
    { value: 'ALL', label: '전체' },
    { value: 'OFFLINE', label: '오프라인' },
    { value: 'ONLINE', label: '온라인' },
];

// 수업 형태 탭 (메인 전체 클래스 MAIN-003, 클래스 목록 MAIN-002에서 같이 사용)
// 패널을 바꾸는 탭이 아니라 목록을 거르는 버튼이라 tablist 대신 aria-pressed를 씀
function ClassTypeTabs({ value, onChange }) {
    return (
        <div className="flex gap-2" role="group" aria-label="수업 형태">
            {CLASS_TYPES.map((item) => {
                const isActive = item.value === value;
                return (
                    <button
                        key={item.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onChange(item.value)}
                        className={
                            isActive
                                ? 'h-9 rounded-full bg-brand px-4 text-sm font-medium text-white'
                                : 'h-9 rounded-full border border-gray-300 px-4 text-sm text-gray-700 transition hover:bg-brand-light'
                        }
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

export default ClassTypeTabs;
