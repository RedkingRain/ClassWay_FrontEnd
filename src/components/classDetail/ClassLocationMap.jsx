import { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

// DB에 좌표가 없어서 주소를 좌표로 바꿔 마커를 찍음
export default function ClassLocationMap({ address }) {
    const mapRef = useRef(null);
    // 좌표를 찾아야 길찾기 주소를 만들 수 있어서 상태로 기억
    const [routeUrl, setRouteUrl] = useState('');

    // 카카오 지도는 React 태그가 아니라 div 안에 직접 그려 넣는 방식이라 화면이 그려진 뒤 실행
    useEffect(() => {
        const kakao = window.kakao;
        if (!kakao || !address) {
            return;
        }
        kakao.maps.load(() => {
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, (result, status) => {
                if (status !== kakao.maps.services.Status.OK) {
                    return;
                }
                const lat = result[0].y;
                const lng = result[0].x;
                const position = new kakao.maps.LatLng(lat, lng);
                // 페이지를 휠로 내리다가 지도가 확대되지 않게 휠 확대는 막고 버튼으로만 확대
                const map = new kakao.maps.Map(mapRef.current, { center: position, level: 1, scrollwheel: false });
                new kakao.maps.Marker({ map, position });
                map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

                setRouteUrl(`https://map.kakao.com/link/to/수업 장소,${lat},${lng}`);
            });
        });
    }, [address]);

    return (
        <div>
            {/* 지도를 못 그리면 회색 상자로 남음 */}
            <div ref={mapRef} className="mt-4 aspect-[16/7] w-full rounded-xl bg-gray-100" />
            {routeUrl && (
                <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <Navigation size={16} />
                    카카오맵에서 길찾기
                </a>
            )}
        </div>
    );
}