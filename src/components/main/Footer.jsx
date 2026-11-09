function Footer() {
    return (
        <footer>
            {/* 1. 고객지원,정책 링크 */}
            <nav aria-label="main navigation">
                <ul>
                    <li><a href="/notice">공지사항</a></li>
                    <li><a href="/faq">FAQ</a></li>
                    <li><a href="/support">고객센터</a></li>
                    <li><a href="/terms">이용약관</a></li>
                    <li><a href="/privacy">개인정보처리방침</a></li>
                </ul>
            </nav>

            {/* 2. 사업자 정보 */}
            <address>
                <p>CLASSWAY 대표 김성목 김예빈 송세나</p>
                <p>사업자등록번호 000-00-00000 그린컴퓨터디자인학원</p>
            </address>
        </footer>
    );
}

export default Footer;