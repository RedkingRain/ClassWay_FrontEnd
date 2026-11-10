import { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toDateKey, formatDateWithDay } from '../../utils/format.js';

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 공통 날짜 선택 (예약·관리자·강사 페이지 공용)
 *
 * value            고른 날짜 "2026-11-14" (없으면 null)
 * onChange         날짜 골랐을 때 실행 (dateKey를 받음)
 * isDateDisabled   (dateKey) => true면 그 날 선택 불가. 안 넘기면 모든 날 선택 가능
 * placeholder      아직 안 골랐을 때 글자
 * emphasizeEnabled 선택 가능한 날을 굵은 초록으로 강조 (예약 화면용)
 * showLegend       아래에 "예약 가능 / 선택 / 예약 불가" 안내 (예약 화면용)
 *
 * 사용 예)
 *  예약:   <DatePicker value={date} onChange={setDate} isDateDisabled={(d) => !가능날짜.includes(d)} emphasizeEnabled showLegend />
 *  관리자: <DatePicker value={start} onChange={setStart} isDateDisabled={(d) => d < toDateKey(new Date())} placeholder="시작일" />
 */
function DatePicker({
                        value,
                        onChange,
                        isDateDisabled = () => false,
                        placeholder = '날짜 선택하기',
                        emphasizeEnabled = false,
                        showLegend = false,
                    }) {
    // 달력이 펼쳐졌는지
    const [isOpen, setIsOpen] = useState(false);

    // 보고 있는 년·월 (고른 날짜가 있으면 그 달, 없으면 이번 달)
    const startKey = value ?? toDateKey(new Date());
    const [viewYear, setViewYear] = useState(Number(startKey.slice(0, 4)));
    const [viewMonth, setViewMonth] = useState(Number(startKey.slice(5, 7)) - 1); // 0~11

    // 이 달 1일의 요일 + 이 달의 마지막 날
    const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [
        ...Array(firstWeekDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    // 이전/다음 달 이동 (12월 → 다음 해 1월 자동 처리)
    function moveMonth(diff) {
        const next = new Date(viewYear, viewMonth + diff, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    }

    function handleSelect(dateKey) {
        onChange(dateKey); // 쓰는 쪽(부모)에 알려줌
        setIsOpen(false); // 고르면 닫기
    }

    return (
        <div>
            {/* 날짜 선택 버튼 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                className={`flex h-11 w-full items-center justify-between rounded-lg border px-4 text-sm transition hover:border-brand ${
                    isOpen ? 'border-brand' : 'border-gray-300'
                }`}
            >
        <span className={`flex items-center gap-2 ${value ? 'text-gray-900' : 'text-gray-400'}`}>
          <CalendarDays size={16} className="text-gray-500" />
            {value ? formatDateWithDay(value) : placeholder}
        </span>
                <ChevronDown size={16} className={`text-gray-500 transition ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* 펼쳐진 달력 */}
            {isOpen && (
                <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4">
                    {/* 년·월 + 이전/다음 */}
                    <div className="flex items-center justify-between">
                        <button type="button" onClick={() => moveMonth(-1)} aria-label="이전 달" className="rounded p-1 hover:bg-gray-100">
                            <ChevronLeft size={18} />
                        </button>
                        <p className="font-semibold text-gray-900">{viewYear}년 {viewMonth + 1}월</p>
                        <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달" className="rounded p-1 hover:bg-gray-100">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* 요일 */}
                    <div className="mt-3 grid grid-cols-7 text-center text-xs text-gray-400">
                        {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
                    </div>

                    {/* 날짜 칸 */}
                    <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-sm">
                        {cells.map((day, index) => {
                            if (day === null) return <span key={`empty-${index}`} />;

                            const dateKey = toDateKey(new Date(viewYear, viewMonth, day));
                            const isDisabled = isDateDisabled(dateKey);
                            const isSelected = dateKey === value;

                            let dayClass = 'text-gray-800 hover:bg-gray-100'; // 기본 (선택 가능)
                            if (isSelected) dayClass = 'bg-brand font-semibold text-white';
                            else if (isDisabled) dayClass = 'text-gray-300';
                            else if (emphasizeEnabled) dayClass = 'font-semibold text-brand hover:bg-brand-light';

                            return (
                                <button
                                    key={dateKey}
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => handleSelect(dateKey)}
                                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${dayClass}`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* 안내 (예약 화면용) */}
                    {showLegend && (
                        <p className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                            <span><b className="font-semibold text-brand">9</b> 예약 가능</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-brand" /> 선택</span>
                            <span><span className="text-gray-300">9</span> 예약 불가</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default DatePicker;