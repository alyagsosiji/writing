// ==========================================
// 1. 보안 및 우회 방지 설정 (우클릭, 드래그, F12, 단축키 차단)
// ==========================================

// 마우스 우클릭 방지
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// 드래그 및 선택 방지 (JS 보조)
document.addEventListener('dragstart', function(e) { e.preventDefault(); });
document.addEventListener('selectstart', function(e) { e.preventDefault(); });

// 개발자 도구(F12) 및 소스보기 관련 단축키 완전 차단
document.addEventListener('keydown', function(e) {
    // F12 차단
    if (e.key === "F12") {
        e.preventDefault();
        return false;
    }
    // Ctrl + Shift + I / J / C (개발자 도구 단축키) 차단
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        return false;
    }
    // Ctrl + U (소스 보기) 차단
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
});

// ==========================================
// 2. 난독화(Base64) 데이터 복호화 및 Firebase 초기화
// ==========================================

// 한글 깨짐 방지 디코딩 함수
function decodeData(str) {
    return decodeURIComponent(escape(atob(str)));
}

// 암호화(Base64 인코딩) 처리된 Firebase Config 구조체
const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRl9qZHk0d1ZHMzNXWVhJNTV4V0p1VjA="),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlbW9iaWxlLmNvbQ=="), // 제공해주신 URL 기준
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNldG9yYWdlLmFwcA=="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWZiZDNjYTE0NA=="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

// 암호화된 관리자 계정 정보 (아이디: 아시 / 비번: 260416)
const secureAdmin = {
    id: decodeData("7JWE7Iuc"), // '아시' 의 Base64
    pw: atob("MjYwNDE2")        // '260416' 의 Base64
};

// Firebase 초기화
firebase.initializeApp(secureConfig);
const database = firebase.database();

// 관리자 로그인 상태 변수
let isAdmin = false;

// ==========================================
// 3. 초기 로딩 화면 제어 및 데이터 로드
// ==========================================
window.addEventListener('load', function() {
    // 연출을 위해 최소 1초간 로딩 화면을 보여준 뒤 제거합니다.
    setTimeout(function() {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1000);

    // 저장된 글 불러오기
    loadPosts();
});

// ==========================================
// 4. 기능 구현 (로그인, 글쓰기, 불러오기, 삭제)
// ==========================================

// 모달 제어
function openModal() { document.getElementById('login-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('login-modal').style.display = 'none'; }

// 로그인 처리
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

// 로그아웃 처리
function logout() {
    isAdmin = false;
    alert('로그아웃 되었습니다.');
    updateUI();
}

// 로그인 상태에 따른 UI 변형
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
    // 삭제 버튼 노출 여부 업데이트를 위해 리로드
    loadPosts();
}

// Firebase에 글 저장하기
function savePost() {
    if (!isAdmin) return;

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const date = new Date().toLocaleString('ko-KR');

    if (!title || !content) {
        alert('수평선에 새길 내용을 모두 입력해주세요.');
        return;
    }

    const postData = {
        title: title,
        content: content,
        date: date
    };

    // Firebase 데이터베이스 'posts' 노드에 Push
    database.ref('posts').push(postData)
        .then(() => {
            document.getElementById('post-title').value = '';
            document.getElementById('post-content').value = '';
            loadPosts();
        })
        .catch((error) => {
            alert('기록 저장 실패: ' + error.message);
        });
}

// Firebase에서 글 가져와서 화면에 뿌리기
function loadPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    database.ref('posts').once('value', (snapshot) => {
        const posts = snapshot.val();
        if (!posts) {
            container.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:30px;">아직 채워지지 않은 바다입니다.</p>';
            return;
        }

        // 최신글이 위로 오도록 역순 정렬 배치
        const keys = Object.keys(posts).reverse();
        keys.forEach((key) => {
            const post = posts[key];
            
            const card = document.createElement('div');
            card.className = 'post-card';
            
            let deleteBtnHtml = '';
            if (isAdmin) {
                deleteBtnHtml = `<button class="delete-btn" onclick="deletePost('${key}')">지우기</button>`;
            }

            card.innerHTML = `
                <h3>${escapeHtml(post.title)}</h3>
                <p>${escapeHtml(post.content)}</p>
                <span class="date">${post.date}</span>
                ${deleteBtnHtml}
            `;
            container.appendChild(card);
        });
    });
}

// 글 삭제 기능
function deletePost(key) {
    if (!isAdmin) return;
    if (confirm('이 기록을 바다에서 지우시겠습니까?')) {
        database.ref('posts/' + key).remove()
            .then(() => {
                loadPosts();
            });
    }
}

// XSS 공격 방지를 위한 HTML 이스케이프 함수
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
