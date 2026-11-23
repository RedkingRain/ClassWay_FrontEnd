import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

// 공용 드롭다운 (기본 select는 펼친 목록을 꾸밀 수 없어서 직접 그림)
// options: [{ value, label }], value: 고른 값 (안 골랐으면 ''), onChange(고른 value)
function Dropdown({ options, value, onChange, placeholder = '선택하세요', id, label, small = false, className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    function handleSelect(nextValue) {
        onChange(nextValue);
        setIsOpen(false);
    }

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                id={id}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label={label && `${label}, 지금 ${selected ? selected.label : '선택 안 함'}`}
                className={`flex w-full items-center justify-between gap-6 rounded-lg border bg-white pl-4 pr-3 text-left text-sm ${
                    small ? 'py-1.5' : 'py-2.5'
                } ${isOpen ? 'border-brand' : 'border-gray-300 hover:border-gray-400'} ${
                    selected ? 'text-gray-700' : 'text-gray-400'
                }`}
            >
                {selected ? selected.label : placeholder}
                <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`shrink-0 text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    {/* 목록 바깥을 누르면 닫히게 화면 전체에 투명한 판을 깔아 둠 */}
                    <button
                        type="button"
                        aria-label="목록 닫기"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-10 cursor-default"
                    />
                    <ul className="absolute right-0 z-20 mt-2 max-h-72 w-full min-w-max overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        aria-current={isSelected ? 'true' : undefined}
                                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                                            isSelected
                                                ? 'bg-gray-100 font-semibold text-gray-900'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Check
                                            size={16}
                                            aria-hidden="true"
                                            className={isSelected ? 'text-brand' : 'invisible'}
                                        />
                                        {option.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}

export default Dropdown;