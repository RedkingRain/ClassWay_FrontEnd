function Footer() {
    return (
        <footer className="bg-[#112117] text-gray-400">
            <div className="mx-auto max-w-6xl px-4 py-10">
                {/* 1. 고객지원·정책 링크 */}
                <nav aria-label="고객지원 및 정책">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-200">
                        <li><a href="/notice" className="hover:text-white">공지사항</a></li>
                        <li><a href="/faq" className="hover:text-white">FAQ</a></li>
                        <li><a href="/support" className="hover:text-white">고객센터</a></li>
                        <li><a href="/terms" className="hover:text-white">이용약관</a></li>
                        <li><a href="/privacy" className="hover:text-white">개인정보처리방침</a></li>
                    </ul>
                </nav>

                {/* 2. 사업자 정보 */}
                <address className="mt-6 space-y-1 text-xs not-italic leading-relaxed">
                    <p>CLASSWAY | 대표: 김성목 김예빈 송세나</p>
                    <p>사업자등록번호: 000-00-00000 | 그린컴퓨터디자인학원</p>
                </address>
            </div>
        </footer>
    );
}

export default Footer;