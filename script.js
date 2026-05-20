// ==========================================
// 1. 보안 가동 (우클릭, 드래그, 주요 디버깅 단축키 전면 통제)
// ==========================================
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', function(e) {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
});

// ==========================================
// 2. 난독 데이터(Base64) 해독 및 정밀 Firebase 기동 루프
// ==========================================
function decodeData(str) { return decodeURIComponent(escape(atob(str))); }

const secureConfig = {
    apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"),
    authDomain: atob("c3Rhci1ib2NrLmZpcmViYXNlYXBwLmNvbQ=="),
    databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"), 
    projectId: atob("c3Rhci1ib2Nr"),
    storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNlc3RvcmFnZS5hcHA="),
    messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
    appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWJmYmQzY2ExNDQ="),
    measurementId: atob("Ry0zRU03OTQ3OUpU")
};

const secureAdmin = {
    id: decodeData("7JWE7Iuc"), // 아시
    pw: atob("MjYwNDE2")        // 260416
};

firebase.initializeApp(secureConfig);
const database = firebase.database();

let isAdmin = false;
let currentPage = 1;
const postsPerPage = 6;
let allPosts = [];
let editTargetKey = null; 

// ==========================================
// 3. 라이프 사이클 스케줄러
// ==========================================
window.addEventListener('load', function() {
    setTimeout(function() {
        const loader = document.getElementById('loading-screen');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 800);
    }, 1200);
    listenPosts();
});

// ==========================================
// 4. 보안 인증 제어 허브
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
    cancelEdit();
    alert('로그아웃 되었습니다.');
    updateUI();
}

function updateUI() {
    const writeSection = document.getElementById('write-section');
    const loginBtn = document.getElementById('login-btn');
    const adminMenu = document.getElementById('admin-menu');

    if (isAdmin) {
        writeSection.style.display = 'block';
        loginBtn.style.display = 'none';
        adminMenu.style.display = 'flex'; 
    } else {
        writeSection.style.display = 'none';
        loginBtn.style.display = 'inline-block';
        adminMenu.style.display = 'none';
    }
    renderUI();
}

// ==========================================
// 5. 핵심 데이터베이스 실시간 제어 로직
// ==========================================
function listenPosts() {
    database.ref('posts').on('value', (snapshot) => {
        const postsData = snapshot.val();
        allPosts = [];
        if (postsData) {
            Object.keys(postsData).forEach((key) => {
                allPosts.push({ id: key, ...postsData[key] });
            });
            allPosts.reverse(); 
        }
        renderUI();
    });
}

function renderUI() {
    const container = document.getElementById('posts-container');
    const paginationContainer = document.getElementById('pagination-container');
    
    container.innerHTML = '';
    paginationContainer.innerHTML = '';

    if (allPosts.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#8781a3; margin-top:40px; font-size:0.9rem; letter-spacing:1px;">아직 채워지지 않은 노을빛 바다입니다.</p>';
        return;
    }

    const totalPages = Math.ceil(allPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const currentItems = allPosts.slice(startIndex, endIndex);

    currentItems.forEach((post) => {
        const card = document.createElement('div');
        card.className = 'post-card';
        
        // 🛠️ 카드 자체를 클릭하면 팝업 상세 모달이 뜨도록 이벤트 연결
        card.onclick = () => openDetailModal(post.id);
        
        let mgmtButtonsHtml = '';
        if (isAdmin) {
            // event.stopPropagation()을 걸어주어 수정/소멸 버튼을 누를 땐 팝업이 뜨지 않게 방어합니다.
            mgmtButtonsHtml = `
                <div class="card-mgmt-btns">
                    <button class="mgmt-btn" onclick="event.stopPropagation(); prepareEdit('${post.id}')">수정</button>
                    <button class="mgmt-btn danger-btn" onclick="event.stopPropagation(); deletePost('${post.id}')">소멸</button>
                </div>
            `;
        }

        card.innerHTML = `
            <h3>${escapeHtml(post.title)}</h3>
            <div class="post-content-area">${escapeHtml(post.content)}</div>
            <div class="post-footer">
                <span class="date">${post.date}</span>
                ${mgmtButtonsHtml}
            </div>
        `;
        container.appendChild(card);
    });

    if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('div');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                currentPage = i;
                window.scrollTo({ top: 0, behavior: 'smooth' });
                renderUI();
            };
            paginationContainer.appendChild(btn);
        }
    }
}

// 📝 [기능 추가] 글 자세히 보기 팝업 제어 함수
function openDetailModal(key) {
    const post = allPosts.find(p => p.id === key);
    if (!post) return;

    document.getElementById('detail-title').innerText = post.title;
    document.getElementById('detail-date').innerText = post.date;
    document.getElementById('detail-text').innerText = post.content;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// 글 저장 및 수정 분기
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

    if (editTargetKey) {
        database.ref('posts/' + editTargetKey).update(postData)
            .then(() => {
                alert('기록이 수정되어 바다에 다시 새겨졌습니다.');
                cancelEdit();
            }).catch(err => alert("수정 오류: " + err.message));
    } else {
        database.ref('posts').push(postData)
            .then(() => {
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                currentPage = 1;
                alert('바다에 새로운 기록이 성공적으로 안착했습니다.');
            }).catch(err => alert("기록 오류: " + err.message));
    }
}

function prepareEdit(key) {
    const post = allPosts.find(p => p.id === key);
    if (!post) return;

    editTargetKey = key;
    document.getElementById('write-title').innerText = "기록 수정하기";
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-content').value = post.content;
    document.getElementById('submit-post-btn').innerText = "수정하기";
    document.getElementById('cancel-edit-btn').style.display = "inline-block";
    document.getElementById('write-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editTargetKey = null;
    document.getElementById('write-title').innerText = "새로운 기록 남기기";
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('submit-post-btn').innerText = "기록하기";
    document.getElementById('cancel-edit-btn').style.display = "none";
}

function deletePost(key) {
    if (!isAdmin) return;
    if (confirm('이 기록을 완전히 소멸시키겠습니까?')) {
        if(editTargetKey === key) cancelEdit();
        database.ref('posts/' + key).remove().then(() => {
            const totalPagesAfterDelete = Math.ceil((allPosts.length - 1) / postsPerPage);
            if (currentPage > totalPagesAfterDelete && currentPage > 1) {
                currentPage = totalPagesAfterDelete;
            }
        }).catch(err => alert("소멸 처리 오류: " + err.message));
    }
}

function clearDatabase() {
    if (!isAdmin) return;
    if (confirm('🚨 [치명적 대량 소멸 경고]\n수평선 너머 모든 글이 흔적도 없이 사라집니다. 초기화할까요?')) {
        if (confirm('이 작업은 절대 되돌릴 수 없습니다. 정말 모든 바다의 글을 파괴할까요?')) {
            database.ref('posts').remove()
                .then(() => {
                    cancelEdit();
                    currentPage = 1;
                    alert('바다가 완전히 정화되어 공백의 수평선 상태가 되었습니다.');
                })
                .catch((error) => alert('초기화 실패: ' + error.message));
        }
    }
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
