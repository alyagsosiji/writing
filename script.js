(function() {
    "use strict";

    // =====================================
    // 🛡️ [보안 강화 및 인프라] 파이어베이스 연결 설정 정보
    // =====================================
    const secureConfig = {
        apiKey: atob("QUl6YVN5QzducVFxRUpjRnBfamR5NHdWRzMzV1lYSWo1eFdKdVYw"), 
        authDomain: "star-bock.firebaseapp.com",
        databaseURL: atob("aHR0cHM6Ly9zdGFyLWJvY2stZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29t"),
        projectId: atob("c3Rhci1ib2Nr"),
        storageBucket: atob("c3Rhci1ib2NrLmZpcmViYXNldG9yYWdlLmFwcA=="),
        messagingSenderId: atob("MzUxNTA3Nzg0NzE3"),
        appId: atob("MTozNTE1MDc3ODQ3MTc6d2ViOmUyMmJiNTcxOGMwZWZiZDNjYTE0NA=="),
        measurementId: atob("Ry0zRU03OTQ3OUpU")
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(secureConfig);
    }
    const db = firebase.database();

    // =====================================
    // 🛡️ 사이트 보안 시스템 (우클릭, 드래그, 개발자도구 완벽 차단)
    // =====================================
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    document.addEventListener('selectstart', e => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
    });
    document.addEventListener('dragstart', e => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') e.preventDefault();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || e.keyCode === 123) e.preventDefault(); 
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) e.preventDefault(); 
        if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) e.preventDefault(); 
        if ((e.ctrlKey && e.keyCode === 85) || (e.metaKey && e.altKey && e.keyCode === 85)) e.preventDefault(); 
    });

    // =====================================
    // 핵심 변수 및 기본 로직
    // =====================================
    const LOVE_MESSAGES = [
        "사랑해. 하은아.",
        "언제나 곁에 있어줘.",
        "우리의 이야기가 언제나 행복하기를.",
        "언제나 웃어줘, 그럼 나도 웃을테니.",
        "밤하늘의 별처럼 언제나 밝게 빛나기를.",
        "나에게 넌 언제나 밝게 빛나는 밤하늘의 별이야."
    ];

    const THEME_KEY = "starry_library_theme";
    const VOLUME_KEY = "starry_library_volume";
    const CURRENT_USER_KEY = "starry_library_active_user";

    const ADMIN_ID = "아시";
    const ADMIN_PW_HASH = "oitqwd"; 

    let titleClickCount = 0;
    let footerClickCount = 0;
    
    let audio = null;
    let volumeSlider = null;
    
    let currentPage = 1;
    const POSTS_PER_PAGE = 5;
    let allPosts = []; 
    
    let currentUser = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUser === "null" || currentUser === "undefined") {
        currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
    }
    
    let isSignupMode = false;
    let currentUserBanRef = null;
    let myPresenceRef = null;

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    function isValidUsername(str) {
        const regex = /^[a-zA-Z0-9가-힣]{2,15}$/;
        return regex.test(str);
    }

    window.addEventListener("DOMContentLoaded", () => {
        audio = document.getElementById("bgm-audio");
        volumeSlider = document.getElementById("volume-slider");

        const savedTheme = localStorage.getItem(THEME_KEY) || "night";
        changeTheme(savedTheme);
        
        updateAuthUI();
        initAudioSettings();
        listenToLivePosts();
        listenToPresence();

        setTimeout(() => {
            const screen = document.getElementById("maintenance-screen");
            if (screen) screen.classList.add("fade-out");
        }, 1200);
    });

    window.addEventListener("scroll", () => {
        const topBtn = document.getElementById("back-to-top");
        if (window.scrollY > 400) topBtn.classList.add("visible");
        else topBtn.classList.remove("visible");
    });

    // =====================================
    // 📢 실시간 은하수 데이터 스트리밍 채널
    // =====================================
    function listenToLivePosts() {
        db.ref('posts').on('value', (snapshot) => {
            const data = snapshot.val();
            allPosts = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    allPosts.push({ firebaseKey: key, ...data[key] });
                });
            }
            renderTimeline();
        });
    }

    // 👑 실시간 강제 추방 감시 코어
    function listenToCurrentUserBanStatus() {
        if (currentUserBanRef) { currentUserBanRef.off(); }
        if (!currentUser || currentUser === ADMIN_ID) return;

        currentUserBanRef = db.ref(`users/${currentUser}`);
        currentUserBanRef.on('value', (snapshot) => {
            if (!snapshot.exists() && currentUser) {
                currentUser = null;
                localStorage.removeItem(CURRENT_USER_KEY);
                updateAuthUI();
                updatePresenceInfo();
                alert("🚨 서재 규약 준수 위반 혹은 관리자 심사에 의해 강제 추방 및 계정 정화 처리가 집행되었습니다.");
                if (currentUserBanRef) currentUserBanRef.off();
            }
        });
    }

    // 👁️ 실시간 웹소켓 인원 체크 스트리밍 엔진
    function listenToPresence() {
        db.ref('.info/connected').on('value', (snapshot) => {
            if (snapshot.val() === true) {
                if (myPresenceRef) myPresenceRef.remove();
                myPresenceRef = db.ref('presence').push();
                myPresenceRef.onDisconnect().remove();
                updatePresenceInfo();
            }
        });

        db.ref('presence').on('value', (snapshot) => {
            const count = snapshot.numChildren() || 1;
            const countElem = document.getElementById("live-user-count");
            if (countElem) countElem.innerText = count;
        });
    }

    function updatePresenceInfo() {
        if (myPresenceRef) {
            myPresenceRef.set({
                username: currentUser || "익명 별빛",
                ts: Date.now()
            });
        }
    }

    // =====================================
    // 회원가입 및 로그인 모듈
    // =====================================
    function updateAuthUI() {
        const greeting = document.getElementById("user-greeting");
        const loginBtn = document.getElementById("login-btn");
        const logoutBtn = document.getElementById("logout-btn");

        if (currentUser) {
            greeting.style.display = "inline";
            if (currentUser === ADMIN_ID) {
                greeting.innerHTML = `<i class="fa-solid fa-crown" style="color: gold; margin-right:5px;"></i>${currentUser} 관리자님`;
                greeting.style.cursor = "pointer";
                greeting.onclick = openAdminModal;
            } else {
                greeting.innerText = `${currentUser} 님의 서재`;
                greeting.style.cursor = "default";
                greeting.onclick = null;
                listenToCurrentUserBanStatus();
            }
            loginBtn.style.display = "none";
            logoutBtn.style.display = "inline";
        } else {
            greeting.style.display = "none";
            loginBtn.style.display = "inline";
            logoutBtn.style.display = "none";
            if (currentUserBanRef) { currentUserBanRef.off(); currentUserBanRef = null; }
        }
    }

    window.openAuthModal = function() {
        document.getElementById("auth-username").value = "";
        document.getElementById("auth-password").value = "";
        document.getElementById("auth-modal").classList.add("active");
    };

    window.closeAuthModal = function() {
        document.getElementById("auth-modal").classList.remove("active");
        isSignupMode = false;
        resetAuthModalText();
    };

    window.toggleAuthMode = function() {
        isSignupMode = !isSignupMode;
        resetAuthModalText();
    };

    function resetAuthModalText() {
        const title = document.getElementById("auth-title");
        const actionBtn = document.getElementById("auth-action-btn");
        const switchText = document.getElementById("auth-switch-text");

        if (isSignupMode) {
            title.innerText = "서재에 별빛 만들기";
            actionBtn.innerText = "회원가입";
            switchText.innerHTML = "이미 계정이 있으신가요? <span>로그인</span>";
        } else {
            title.innerText = "별빛 서재 입장하기";
            actionBtn.innerText = "로그인";
            switchText.innerHTML = "서재가 처음이신가요? <span>회원가입</span>";
        }
    }

    window.handleAuth = function() {
        const usernameInput = document.getElementById("auth-username").value.trim();
        const passwordInput = document.getElementById("auth-password").value.trim();

        if (!usernameInput || !passwordInput) {
            showToast("닉네임(아이디)과 비밀번호를 모두 입력해주세요.");
            return;
        }

        if (isSignupMode) {
            if (!isValidUsername(usernameInput)) {
                showToast("닉네임은 특수문자 없이 한글, 영문, 숫자(2~15자)만 가능합니다.");
                return;
            }
            if (usernameInput === ADMIN_ID) {
                showToast("이 닉네임은 서재 관리자 전용이므로 가입할 수 없습니다.");
                return;
            }
            
            db.ref('users/' + usernameInput).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    showToast("이미 존재하는 닉네임입니다. 다른 닉네임을 사용해주세요.");
                } else {
                    db.ref('users/' + usernameInput).set(simpleHash(passwordInput)).then(() => {
                        showToast(`환영합니다! ${usernameInput}님, 이제 로그인할 수 있습니다.`);
                        toggleAuthMode();
                    });
                }
            });
        } else {
            if (usernameInput === ADMIN_ID) {
                if (simpleHash(passwordInput) === ADMIN_PW_HASH) {
                    currentUser = ADMIN_ID;
                    localStorage.setItem(CURRENT_USER_KEY, currentUser);
                    showToast("최고 관리자(Admin) 권한으로 접속했습니다. 👑");
                    updateAuthUI();
                    closeAuthModal();
                    updatePresenceInfo();
                } else {
                    showToast("관리자 비밀번호가 틀렸습니다.");
                }
            } else {
                db.ref('users/' + usernameInput).once('value', (snapshot) => {
                    const savedHash = snapshot.val();
                    if (savedHash && savedHash === simpleHash(passwordInput)) {
                        currentUser = usernameInput;
                        localStorage.setItem(CURRENT_USER_KEY, currentUser);
                        showToast(`${currentUser}님, 다시 만나서 반가워요.`);
                        updateAuthUI();
                        closeAuthModal();
                        updatePresenceInfo();
                    } else {
                        showToast("닉네임이 없거나 비밀번호가 틀렸습니다. 다시 확인해주세요.");
                    }
                });
            }
        }
    };

    window.logout = function() {
        currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
        updateAuthUI();
        updatePresenceInfo();
        showToast("안전하게 서재에서 나갔습니다.");
    };

    // =====================================
    // 👑 최고 관리자 전용 통제 패널 모듈
    // =====================================
    window.openAdminModal = function() {
        if (currentUser !== ADMIN_ID) return;
        document.getElementById("admin-users-modal").classList.add("active");
        renderAdminUsers();
    };

    function renderAdminUsers() {
        db.ref('users').once('value', (snapshot) => {
            const users = snapshot.val() || {};
            const listContainer = document.getElementById("admin-user-list");
            if (!listContainer) return;

            let html = Object.keys(users).map(username => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 6px;">
                    <span style="font-size: 0.85rem; color: #fff;"><i class="fa-solid fa-user" style="margin-right: 6px; color: #bcafd0;"></i>${escapeHTML(username)}</span>
                    <button onclick="kickUser('${username}')" style="background: #e74c3c; color: #fff; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.72rem; cursor: pointer;">추방</button>
                </div>
            `).join('');

            listContainer.innerHTML = html || '<p style="text-align: center; font-size: 0.8rem; opacity: 0.5; padding: 10px 0;">가입된 열람자가 없습니다.</p>';
        });
    }

    window.kickUser = function(username) {
        if (currentUser !== ADMIN_ID) return;
        if (username === ADMIN_ID) {
            showToast("최고 관리자 본인은 추방할 수 없습니다.");
            return;
        }
        if (!confirm(`'${username}' 열람자를 은하수 서재에서 영구 추방하시겠습니까?`)) return;

        db.ref('users/' + username).remove().then(() => {
            showToast(`'${username}' 열람자가 정화 처리되었습니다.`);
            renderAdminUsers();
        });
    };

    // =====================================
    // 테마 및 BGM 로직
    // =====================================
    window.toggleThemePanel = function() {
        const options = document.getElementById("theme-options");
        if(options.style.display === "flex") options.style.display = "none";
        else options.style.display = "flex";
    };

    window.changeTheme = function(themeName) {
        document.body.className = ""; 
        document.body.classList.add(`theme-${themeName}`);
        localStorage.setItem(THEME_KEY, themeName);
        document.getElementById("theme-options").style.display = "none";
    };

    let isMuted = false;
    let previousVolume = 0.4;

    function initAudioSettings() {
        if (!audio || !volumeSlider) return;
        const savedVolume = localStorage.getItem(VOLUME_KEY);
        if (savedVolume !== null) {
            audio.volume = parseFloat(savedVolume);
            volumeSlider.value = savedVolume;
        } else {
            audio.volume = 0.4;
            volumeSlider.value = "0.4";
        }
        volumeSlider.addEventListener("input", (e) => {
            audio.volume = e.target.value;
            localStorage.setItem(VOLUME_KEY, e.target.value);
            const muteIcon = document.getElementById("bgm-mute-icon");
            if(audio.volume == 0) muteIcon.className = "fa-solid fa-volume-xmark";
            else muteIcon.className = "fa-solid fa-volume-high";
        });
    }

    window.toggleBgm = function() {
        const bgmIcon = document.getElementById("bgm-icon");
        const bgmContainer = document.getElementById("bgm-container");
        if (audio.paused) {
            audio.play().then(() => {
                bgmIcon.classList.add("rotating");
                bgmContainer.classList.add("playing");
                showToast("서재에 잔잔한 선율이 흐르기 시작합니다.");
            }).catch(err => {
                showToast("화면을 한 번 터치하신 뒤 재생해 주세요!");
            });
        } else {
            audio.pause();
            bgmIcon.classList.remove("rotating");
            bgmContainer.classList.remove("playing");
            showToast("선율을 잠시 접어둡니다.");
        }
    };

    window.toggleMute = function() {
        const muteIcon = document.getElementById("bgm-mute-icon");
        if (isMuted || audio.volume == 0) {
            audio.volume = previousVolume || 0.4;
            volumeSlider.value = audio.volume;
            muteIcon.className = "fa-solid fa-volume-high";
            isMuted = false;
        } else {
            previousVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
            muteIcon.className = "fa-solid fa-volume-xmark";
            isMuted = true;
        }
    };

    window.updateWordCount = function() {
        const content = document.getElementById("post-content").value;
        const counter = document.getElementById("word-count-display");
        counter.innerText = `${content.length} 자의 소중한 마음`;
    };

    // =====================================
    // 기록장 데이터 관리 (+어드민 고정 기능)
    // =====================================
    window.addTimelinePost = function() {
        if (!currentUser) {
            showToast("기록을 남기려면 상단의 [로그인]을 먼저 진행해주세요.");
            return;
        }

        const titleInput = document.getElementById("post-title");
        const contentInput = document.getElementById("post-content");
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) {
            showToast("마음의 내용과 제목을 빠짐없이 채워주세요.");
            return;
        }

        const now = new Date();
        const dateString = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
        const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newPost = {
            id: Date.now(),
            title: title,
            content: content,
            date: dateString,
            time: timeString,
            author: currentUser, 
            stamped: false,
            pinned: false 
        };

        db.ref('posts').push(newPost).then(() => {
            titleInput.value = "";
            contentInput.value = "";
            updateWordCount();
            currentPage = 1;
            showToast("새로운 기억 조각이 은하수에 등록되었습니다.");
        });
    };

    window.deletePost = function(firebaseKey) {
        db.ref('posts/' + firebaseKey).once('value', (snap) => {
            const post = snap.val();
            if(!post) return;

            const isAdmin = (currentUser === ADMIN_ID);
            if (!currentUser || (!isAdmin && post.author !== currentUser)) {
                showToast("자신이 작성한 기록만 지울 수 있습니다.");
                return;
            }

            if(!confirm("이 소중한 기억의 책을 서재에서 정말로 지우시겠습니까?")) return;
            
            db.ref('posts/' + firebaseKey).remove().then(() => {
                showToast("서재의 기록 한 조각이 밤하늘로 흩어졌습니다.");
            });
        });
    };

    window.toggleStamp = function(firebaseKey) {
        db.ref('posts/' + firebaseKey).once('value', (snap) => {
            const post = snap.val();
            if(!post) return;

            const isAdmin = (currentUser === ADMIN_ID);
            if (!currentUser || (!isAdmin && post.author !== currentUser)) {
                showToast("자신이 작성한 기록만 단장할 수 있습니다.");
                return;
            }

            db.ref('posts/' + firebaseKey + '/stamped').set(!post.stamped).then(() => {
                showToast(!post.stamped ? "기록 카드에 별빛 책갈피를 꽂았습니다." : "별빛 책갈피를 해제했습니다.");
            });
        });
    };

    window.togglePin = function(firebaseKey) {
        if (currentUser !== ADMIN_ID) {
            showToast("최고 관리자(Admin)만 사용할 수 있는 기능입니다.");
            return;
        }

        db.ref('posts/' + firebaseKey).once('value', (snap) => {
            const post = snap.val();
            if (post) {
                db.ref('posts/' + firebaseKey + '/pinned').set(!post.pinned).then(() => {
                    showToast(!post.pinned ? "해당 기록을 서재 최상단에 고정했습니다." : "기록 고정을 해제했습니다.");
                });
            }
        });
    };

    // 💬 실시간 꼬리평(댓글) 쓰기 통신 모듈
    window.addComment = function(firebaseKey) {
        if (!currentUser) {
            showToast("꼬리평을 작성하시려면 먼저 입장(로그인)해 주세요.");
            return;
        }
        const input = document.getElementById(`comment-input-${firebaseKey}`);
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const newComment = {
            author: currentUser,
            text: text,
            timestamp: Date.now()
        };

        db.ref(`posts/${firebaseKey}/comments`).push(newComment).then(() => {
            input.value = "";
            showToast("꼬리평이 소중하게 등록되었습니다.");
        });
    };

    // 💬 실시간 꼬리평(댓글) 파기 모듈
    window.deleteComment = function(firebaseKey, commentKey) {
        db.ref(`posts/${firebaseKey}/comments/${commentKey}`).once('value', (snap) => {
            const comment = snap.val();
            if (!comment) return;
            if (currentUser !== ADMIN_ID && currentUser !== comment.author) {
                showToast("삭제 권한이 없습니다.");
                return;
            }
            if (confirm("이 따뜻한 꼬리평을 성운 뒤편으로 삭제 처리합니까?")) {
                db.ref(`posts/${firebaseKey}/comments/${commentKey}`).remove().then(() => {
                    showToast("꼬리평 삭제 완료.");
                });
            }
        });
    };

    window.changePage = function(direction) {
        const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
        currentPage += direction;
        
        if (currentPage < 1) currentPage = 1;
        if (currentPage > totalPages) currentPage = totalPages;
        
        renderTimeline();
        
        const timelineHeader = document.getElementById("timeline-header");
        if (timelineHeader) timelineHeader.scrollIntoView({ behavior: "smooth" });
    };

    function renderTimeline() {
        const container = document.getElementById("timeline-container");
        if (!container) return;

        let posts = [...allPosts];

        if (posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    아직 채워진 밤하늘의 조각이 없습니다.<br>로그인 후 첫 별빛의 책을 남겨 채워보세요.
                </div>
            `;
            return;
        }

        posts.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.id - a.id;
        });

        const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
        if (currentPage > totalPages) currentPage = totalPages; 
        if (currentPage < 1) currentPage = 1;
        
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

        const isAdmin = (currentUser === ADMIN_ID);

        let html = paginatedPosts.map(post => {
            let safeAuthor = post.author;
            if (!safeAuthor || safeAuthor === "null" || safeAuthor === "undefined") {
                safeAuthor = "익명";
            }

            const authorClass = (safeAuthor === ADMIN_ID) ? 'card-author author-admin' : 'card-author';
            const authorIcon = (safeAuthor === ADMIN_ID) ? '<i class="fa-solid fa-crown"></i>' : '<i class="fa-solid fa-pen-nib"></i>';
            const authorName = escapeHTML(safeAuthor);

            const pinBadge = post.pinned ? `<span class="card-pin-badge"><i class="fa-solid fa-thumbtack"></i> 서재 고정됨</span>` : '';
            const pinBtnHtml = isAdmin ? `
                <button class="action-btn ${post.pinned ? 'pin-active' : ''}" onclick="togglePin('${post.firebaseKey}')" title="상단 고정">
                    <i class="fa-solid fa-thumbtack"></i> ${post.pinned ? '고정해제' : '상단고정'}
                </button>
            ` : '';

            // 꼬리평(댓글) 렌더링 스트림 빌드업
            let commentsHtml = "";
            if (post.comments) {
                commentsHtml = Object.keys(post.comments).map(ckey => {
                    const comment = post.comments[ckey];
                    const isCommentOwnerOrAdmin = (currentUser === ADMIN_ID || currentUser === comment.author);
                    const deleteBtn = isCommentOwnerOrAdmin ? `<span onclick="deleteComment('${post.firebaseKey}', '${ckey}')" style="color: rgba(255,255,255,0.3); cursor: pointer; margin-left: auto; font-size: 0.72rem;">삭제</span>` : '';
                    return `
                        <div class="library-comment-item">
                            <strong class="${comment.author === ADMIN_ID ? 'comment-admin-name' : ''}">${escapeHTML(comment.author)}:</strong>
                            <span style="word-break: break-all;">${escapeHTML(comment.text)}</span>
                            ${deleteBtn}
                        </div>
                    `;
                }).join('');
            }

            return `
            <div class="timeline-item">
                <div class="timeline-node"></div>
                <div class="timeline-card">
                    <div class="card-meta">
                        <span><i class="fa-solid fa-clock"></i> 작성일: ${post.date} ${post.time}</span>
                        <div>
                            ${pinBadge}
                            <span class="card-pin-badge" style="border-color: rgba(255,255,255,0.15);"><i class="fa-solid fa-moon"></i> 영원의 조각</span>
                        </div>
                    </div>
                    
                    <div class="${authorClass}">${authorIcon} 기록자 : ${authorName}</div>
                    
                    <h3 class="card-title">${escapeHTML(post.title)}</h3>
                    <div class="card-body">${escapeHTML(post.content)}</div>
                    
                    <div class="library-comments-wrapper">
                        <div id="comments-list-${post.firebaseKey}" class="library-comments-list">
                            ${commentsHtml || '<p style="font-size: 0.75rem; opacity: 0.4; text-align: left; margin: 0;">남겨진 꼬리평이 없습니다.</p>'}
                        </div>
                        <div class="library-comment-form">
                            <input type="text" id="comment-input-${post.firebaseKey}" placeholder="따뜻한 한 줄 평론을 남겨보세요... (최대 100자)" maxlength="100" onkeydown="if(event.key==='Enter') addComment('${post.firebaseKey}')">
                            <button onclick="addComment('${post.firebaseKey}')">등록</button>
                        </div>
                    </div>
                    
                    <div class="card-actions-row">
                        ${pinBtnHtml}
                        <button class="action-btn ${post.stamped ? 'star-active' : ''}" onclick="toggleStamp('${post.firebaseKey}')" title="북마크 별빛 책갈피">
                            <i class="fa-${post.stamped ? 'solid' : 'regular'} fa-star"></i> 단장하기
                        </button>
                        <button class="action-btn" onclick="deletePost('${post.firebaseKey}')" title="기록 소멸시키기" style="color: rgba(255,255,255,0.35); margin-left: auto;">
                            <i class="fa-regular fa-trash-can"></i> 지우기
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        if (totalPages > 1) {
            html += `
                <div class="pagination-container">
                    <button class="page-btn" onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''}>이전 페이지</button>
                    <span class="page-info">${currentPage} / ${totalPages}</span>
                    <button class="page-btn" onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''}>다음 페이지</button>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function showToast(message) {
        const container = document.getElementById("toast-container");
        if (!container) return;
        const toast = document.createElement("div");
        toast.className = "toast-box";
        toast.innerText = message;
        container.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 3200);
    }

    const titleTrigger = document.getElementById("secret-title-trigger");
    if (titleTrigger) {
        titleTrigger.addEventListener("click", () => {
            titleClickCount++;
            if (titleClickCount % 3 === 0) {
                const randomMsg = LOVE_MESSAGES[Math.floor(Math.random() * LOVE_MESSAGES.length)];
                showToast(`✨ 서재의 밀어 : "${randomMsg}"`);
            }
        });
    }

    const footerTrigger = document.getElementById("secret-footer-trigger");
    if (footerTrigger) {
        footerTrigger.addEventListener("click", () => {
            footerClickCount++;
            if (footerClickCount % 4 === 0) {
                showToast("🔮 밤하늘의 영원한 별빛이 당신의 책들을 언제나 지켜보고 있습니다.");
            }
        });
    }

    window.scrollToTop = function() { window.scrollTo({ top: 0, behavior: "smooth" }); };
    window.scrollToEditor = function() {
        const editorSec = document.getElementById("editor-section");
        if (editorSec) { editorSec.scrollIntoView({ behavior: "smooth" }); }
    };
})();
