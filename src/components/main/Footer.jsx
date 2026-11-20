import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="bg-brand-dark text-gray-400">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <nav aria-label="고객지원 및 정책">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-200">
                        <li><Link to="/notice" className="hover:text-white">공지사항</Link></li>
                        <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                        <li><Link to="/support" className="hover:text-white">고객센터</Link></li>
                        <li><Link to="/terms" className="hover:text-white">이용약관</Link></li>
                        <li><Link to="/privacy" className="hover:text-white">개인정보처리방침</Link></li>
                    </ul>
                </nav>

                <address className="mt-6 space-y-1 text-xs not-italic leading-relaxed">
                    <p>CLASSWAY | 대표: 김성목 김예빈 송세나</p>
                    <p>사업자등록번호: 000-00-00000 | 그린컴퓨터디자인학원</p>
                </address>
            </div>
        </footer>
    );
}

export default Footer;