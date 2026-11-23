import { Link } from 'react-router-dom';
import { NOTICE_URL, FAQ_URL } from '../../config/supportLinks.js';

function Footer() {
    return (
        <footer className="bg-brand-dark text-gray-400">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <nav aria-label="고객지원 및 정책">
                    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-200">
                        {/* 공지사항, FAQ는 노션 공개 페이지라 새 창으로 엶 */}
                        <li><a href={NOTICE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">공지사항</a></li>
                        <li><a href={FAQ_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">FAQ</a></li>
                        <li><Link to="/support/inquiry" className="hover:text-white">고객센터</Link></li>
                        <li><Link to="/terms?tab=service" className="hover:text-white">이용약관</Link></li>
                        <li><Link to="/terms?tab=privacy" className="hover:text-white">개인정보처리방침</Link></li>
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