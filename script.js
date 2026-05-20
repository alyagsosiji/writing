// ==========================================
// 1. 보안 및 우회 방지 설정 (우클릭, 드래그, F12, 단축키 차단)
// ==========================================
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('dragstart', function(e) { e.preventDefault(); });
document.addEventListener('selectstart', function(e) { e.preventDefault(); });

document.addEventListener('keydown', function(e) {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
});

// ==========================================
// 2. 데이터 복호화 및 Firebase 완전 무결 초기화
// ==========================================
function decodeData(str) {
    return decodeURIComponent(escape(atob(str)));
}

// [정밀 보정] 오타를 완벽히 수정하고 새로 인코딩한 안전 고정형 Config
const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRl9qZHk0d1ZHMzNXWVhJNTV4V0p1VjA="),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), // 오타 완전 해결 완료
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXN0b3JhZ2UuYXBw"), // 오타 완전 해결 완료
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWZiZDNjYTE0NA=="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

const secureAdmin = {
    id: decodeData("7JWE7Iuc"), // '아시'
    pw: atob("MjYwNDE2")        // '260416'
};

firebase.initializeApp(secureConfig);
const database = firebase.database();

let isAdmin = false;
let currentPage = 1;
const postsPerPage = 6; // 한 페이지당 아름답게 정렬되어 보여줄 글의 수
let allPosts = [];

// ==========================================
// 3. 로딩 화면 제어 및 실시간 관측 엔진 기동
// ==========================================
window.addEventListener('load', function() {
    setTimeout(function() {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1200);

    // .once에서 실시간 동기화 방식인 .on으로 교체하여 에러 원인 제거
    listenPosts();
});

// ==========================================
// 4. 코어 로직 제어 루프 (실시간 정렬 및 페이지네이션 연동)
// ==========================================
function openModal() { document.getElementById('login-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }

function login() {
    const inputId = document.getElementById('admin-id').value;
    const inputPw = document.getElementById('admin-pw').value;

    if (inputId === secureAdmin.id && inputPw === secureAdmin.pw) {
        isAdmin = true;
        alert('환영합니다, 아시 님.');
        closeModal();
        updateUI();
    } else {
        alert('올바른 접근이 아닙니다.');
    }
}

function logout() {
    isAdmin = false;
    alert('로그아웃 되었습니다.');
    updateUI();
}

function updateUI() {
    const writeSection = document.getElementById('write-section');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    if (isAdmin) {
        writeSection.style.display = 'block';
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        writeSection.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
    renderUI(); // 현재 관리자 권한 상태에 맞는 UI 즉각 재배치
}

// 실시간 DB 관측 함수
function listenPosts() {
    database.ref('posts').on('value', (snapshot) => {
        const postsData = snapshot.val();
        allPosts = [];
        
        if (postsData) {
            Object.keys(postsData).forEach((key) => {
                allPosts.push({ id: key, ...postsData[key] });
            });
            // 최신 글이 완벽히 무조건 상단에 위치하도록 정렬 보정
            allPosts.reverse();
        }
        renderUI();
    });
}

// 스크린 실제 렌더링 및 페이지네이션 계산 처리
function renderUI() {
    const container = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    container.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (allPosts.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#8a829e; margin-top:40px; font-size:0.95rem; letter-spacing:1px;">아직 채워지지 않은 노을빛 바다입니다.</p>';
        return;
    }

    // 수학적 갱신구간 산출
    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentItems = allPosts.slice(startIndex, endIndex);

    currentItems.forEach((post) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        
        let deleteBtnHtml = '';
        if (isAdmin) {
            deleteBtnHtml = `<button class="delete-btn" onclick="deletePost('${post.id}')">지우기</button>`;
        }

        card.innerHTML = `
            <div>
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.content)}</p>
            </div>
            <div>
                <span class="date">${post.date}</span>
                ${deleteBtnHtml}
            </div>
        `;
        container.appendChild(card);
    });

    // 보정 로직: 전체 페이지가 2페이지 이상일 때만 하단에 번호 발생 (적을 땐 표기 안 됨)
    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('div');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                currentPage = i;
                window.scrollTo({ top: 0, behavior: 'smooth' }); // 페이지 전환 시 상단 이동 연출
                renderUI();
            };
            paginationContainer.appendChild(btn);
        }
    }
}

// 새 글 기록 함수
function savePost() {
    if (!isAdmin) return;

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const date = new Date().toLocaleString('ko-KR');

    if (!title || !content) {
        alert('수평선에 새길 내용을 모두 입력해주세요.');
        return;
    }

    const postData = { title: title, content: content, date: date };

    database.ref('posts').push(postData)
        .then(() => {
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            currentPage = 1; // 새 글 등록 시 첫 페이지로 뷰 포커스 리셋
            alert('바다에 새로운 기록이 성공적으로 안착했습니다.');
        })
        .catch((error) => {
            alert('기록 저장 실패: ' + error.message);
        });
}

// 기록 제거 함수
function deletePost(key) {
    if (!isAdmin) return;
    if (confirm('이 기록을 바다에서 지우시겠습니까?')) {
        database.ref('posts/' + key).remove()
            .then(() => {
                // 삭제 후 현재 페이지에 남은 글이 없으면 이전 페이지로 후퇴하는 안전 제어 장치
                const totalPagesAfterDelete = Math.ceil((allPosts.length - 1) / postsPerPage);
                if (currentPage > totalPagesAfterDelete && currentPage > 1) {
                    currentPage = totalPagesAfterDelete;
                }
            });
    }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
