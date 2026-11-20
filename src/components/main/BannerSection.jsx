import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useApiData } from '../../utils/api.js';
import { isExternalLink, isSafeInternalLink } from '../../utils/link.js';
import defaultBannerImage from '../../assets/classway-default-banner.png';

const AUTO_DELAY = 4000; // 자동 넘김 간격 (4초)

// 배너 1장: 주소 모양에 따라 같은 창 / 새 창 / 링크 없이 이미지만
function BannerSlide({ banner }) {
    const image = <img src={banner.imageUrl} alt={banner.title} className="h-full w-full object-cover" />;

    if (isSafeInternalLink(banner.linkUrl)) {
        return (
            // 사이트 안에서 새로고침 없이 이동하기 위해 Link사용
            <Link to={banner.linkUrl} className="block h-full">
                {image}
            </Link>
        );
    }
    if (isExternalLink(banner.linkUrl)) {
        return (
            // 외부 주소 혹은 새 창으로 이동하기 때문에 a href 사용
            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
                {image}
            </a>
        );
    }
    return image;
}

// 배너가 0개이거나 못 받았을 때 보여줄 서비스 소개 이미지
function DefaultBanner() {
    return (
        <img
            src={defaultBannerImage}
            alt="원데이 클래스부터 온라인 강의까지, 배우고 싶은 걸 한곳에서 찾아보세요. 취미도 커리어도, 클래스 하나로 시작"
            className="aspect-[1120/340] w-full rounded-2xl object-cover"
        />
    );
}

// 메인 홍보 배너 (MAIN-004)
function BannerSection() {
    // 배너 목록 (GET /banners)
    const { state, data } = useApiData('/banners');
    const banners = data ?? [];
    const total = banners.length;

    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false); // 버튼으로 멈춤
    const [isHovered, setIsHovered] = useState(false); // 마우스를 올려서 잠깐 멈춤
    const [isFocused, setIsFocused] = useState(false); // 키보드로 배너 안에 들어와서 잠깐 멈춤

    useEffect(() => {
        if (isPaused || isHovered || isFocused || total <= 1) return;

        const timer = setInterval(() => {
            setCurrent((current + 1) % total);
        }, AUTO_DELAY);

        // current가 바뀔 때마다 새로 시작 -> 버튼으로 넘긴 직후 바로 또 넘어가지 않게
        return () => clearInterval(timer);
    }, [current, isPaused, isHovered, isFocused, total]);

    // 불러오는 중은 같은 크기의 빈 상자(도착해도 아래가 밀리지 않게), 실패나 0개는 기본 배너
    if (state === 'loading' || total === 0) {
        return (
            <section aria-label="홍보 배너" className="mx-auto max-w-6xl px-4 pt-6">
                {state === 'loading' ? (
                    <div className="aspect-[1120/340] rounded-2xl bg-gray-100" />
                ) : (
                    <DefaultBanner />
                )}
            </section>
        );
    }

    function goPrev() {
        setCurrent((current - 1 + total) % total);
    }

    function goNext() {
        setCurrent((current + 1) % total);
    }

    return (
        <section aria-label="홍보 배너" className="mx-auto max-w-6xl px-4 pt-6">
            <div
                className="relative aspect-[1120/340] overflow-hidden rounded-2xl bg-gray-100"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                // :focus-visible = 키보드로 들어온 경우만 (마우스로 버튼을 누른 뒤에는 멈추지 않게)
                onFocus={(event) => setIsFocused(event.target.matches(':focus-visible'))}
                onBlur={() => setIsFocused(false)}
            >
                {/* 배너를 한 줄로 놓고 통째로 밀어서, 지금 배너만 창에 보이게 */}
                <ul
                    className="flex h-full transition-transform duration-500 motion-reduce:transition-none"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                >
                    {banners.map((banner, index) => (
                        // inert: 화면 밖 배너는 Tab 키, 화면 읽기 프로그램이 건너뛰게
                        <li key={banner.bannerId} inert={index !== current} className="h-full w-full shrink-0">
                            <BannerSlide banner={banner} />
                        </li>
                    ))}
                </ul>

                {total > 1 && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-white">
                        <button
                            type="button"
                            onClick={goPrev}
                            aria-label="이전 배너"
                            className="rounded-full p-1 hover:bg-white/20"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-1 text-xs">
                            <span className="font-semibold">{current + 1}</span>
                            <span className="text-white/70"> / {total}</span>
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsPaused(!isPaused)}
                            aria-label={isPaused ? '자동 넘김 재생' : '자동 넘김 멈춤'}
                            className="rounded-full p-1 hover:bg-white/20"
                        >
                            {isPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            aria-label="다음 배너"
                            className="rounded-full p-1 hover:bg-white/20"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

export default BannerSection;