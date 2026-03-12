// ================================================================
// SillyTavern Phone UI Extension
// ================================================================

(function () {

    // ── เวลาจริง ──────────────────────────────────────────────
    function getTime() {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    // ── อัพเดทเวลาทุก 30 วินาที ───────────────────────────────
    function startClock() {
        const el = document.getElementById('phone-time');
        if (el) el.textContent = getTime();
        setInterval(() => {
            const el = document.getElementById('phone-time');
            if (el) el.textContent = getTime();
        }, 30000);
    }

    // ── สร้าง HTML ทั้งหมด ─────────────────────────────────────
    function buildPhoneHTML() {
        return `
        <!-- ปุ่มหัวใจข้างจอ -->
        <button id="phone-toggle-btn" title="Open Phone">💗</button>

        <!-- overlay + โทรศัพท์ -->
        <div id="phone-overlay">
            <div id="phone-frame">

                <!-- notch -->
                <div id="phone-notch"></div>

                <!-- status bar -->
                <div id="phone-statusbar">
                    <span class="time" id="phone-time">00:00</span>
                    <div class="icons">
                        <span>▲</span>
                        <span>WiFi</span>
                        <span>🔋</span>
                    </div>
                </div>

                <!-- หน้าจอหลัก -->
                <div id="phone-screen">

                    <!-- Home Screen -->
                    <div id="phone-home">

                        <div class="app-icon app-settings" data-app="settings">
                            <div class="icon-img">⚙️</div>
                            <span class="icon-label">Settings</span>
                        </div>

                        <div class="app-icon app-chat" data-app="chat">
                            <div class="icon-img">💬</div>
                            <span class="icon-label">Chat</span>
                        </div>

                        <div class="app-icon app-photos" data-app="photos">
                            <div class="icon-img">🖼️</div>
                            <span class="icon-label">Photos</span>
                        </div>

                        <div class="app-icon app-lazzy" data-app="lazzy">
                            <div class="icon-img">👻</div>
                            <span class="icon-label">Lazzy</span>
                        </div>

                        <div class="app-icon app-instagram" data-app="instagram">
                            <div class="icon-img">📸</div>
                            <span class="icon-label">Instagram</span>
                        </div>

                        <div class="app-icon app-twitter" data-app="twitter">
                            <div class="icon-img">🐦</div>
                            <span class="icon-label">Twitter</span>
                        </div>

                        <div class="app-icon app-youtube" data-app="youtube">
                            <div class="icon-img">▶️</div>
                            <span class="icon-label">Youtube</span>
                        </div>

                        <div class="app-icon app-music" data-app="music">
                            <div class="icon-img">🎵</div>
                            <span class="icon-label">Music</span>
                        </div>

                        <div class="app-icon app-phone" data-app="phonecall">
                            <div class="icon-img">📞</div>
                            <span class="icon-label">Phone</span>
                        </div>

                        <div class="app-icon app-camera" data-app="camera">
                            <div class="icon-img">📹</div>
                            <span class="icon-label">Camera</span>
                        </div>

                    </div>
                    <!-- จบ Home Screen -->

                </div>
                <!-- จบ phone-screen -->

                <!-- navbar ด้านล่าง -->
                <div id="phone-navbar">
                    <button id="btn-menu" title="Menu">☰</button>
                    <button id="btn-home" title="Home">⬆</button>
                    <button id="btn-back" title="Back">↩</button>
                </div>

            </div>
        </div>
        `;
    }

    // ── inject HTML เข้าหน้าเว็บ ───────────────────────────────
    function injectPhone() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildPhoneHTML();
        document.body.appendChild(wrapper);
    }

    // ── เปิด/ปิด overlay ───────────────────────────────────────
    function setupToggle() {
        const btn     = document.getElementById('phone-toggle-btn');
        const overlay = document.getElementById('phone-overlay');

        // กดปุ่มหัวใจ → เปิดโทรศัพท์
        btn.addEventListener('click', () => {
            overlay.classList.add('active');
        });

        // กด overlay ด้านนอกโทรศัพท์ → ปิด
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });

        // ปุ่ม Home → กลับ home screen
        document.getElementById('btn-home').addEventListener('click', () => {
            showHome();
        });

        // ปุ่ม Back → ปิดโทรศัพท์ก่อน (จะขยายทีหลัง)
        document.getElementById('btn-back').addEventListener('click', () => {
            overlay.classList.remove('active');
        });
    }

    // ── แสดง Home Screen ──────────────────────────────────────
    function showHome() {
        const screen = document.getElementById('phone-screen');
        // ลบทุก app ที่เปิดอยู่ เหลือแค่ home
        screen.querySelectorAll('.app-page').forEach(p => p.remove());
        document.getElementById('phone-home').style.display = 'grid';
    }

    // ── กดเปิด App ────────────────────────────────────────────
    function setupAppIcons() {
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                const appName = icon.dataset.app;
                openApp(appName);
            });
        });
    }

    // ── router เปิดแต่ละ App ──────────────────────────────────
    function openApp(appName) {
        // ซ่อน home ก่อน
        document.getElementById('phone-home').style.display = 'none';

        // ลบหน้าเก่า
        document.querySelectorAll('.app-page').forEach(p => p.remove());

        // เลือกหน้าที่จะเปิด
        switch (appName) {
            case 'chat':
                renderChatApp();
                break;
            case 'camera':
                renderCameraApp();
                break;
            case 'lazzy':
                renderLazzyApp();
                break;
            default:
                renderComingSoon(appName);
        }
    }

    // ── App: Chat ─────────────────────────────────────────────
    function renderChatApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = `
            width:100%; height:100%;
            background:#1c1c1e;
            display:flex; flex-direction:column;
        `;
        page.innerHTML = `
            <div style="
                padding: 12px 16px;
                background: #2c2c2e;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                font-family: -apple-system, sans-serif;
                border-bottom: 1px solid #3a3a3c;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                💬 Chat
            </div>

            <!-- รายชื่อผู้ติดต่อ (จะขยายทีหลัง) -->
            <div style="
                flex:1;
                display:flex;
                align-items:center;
                justify-content:center;
                color:#636366;
                font-size:13px;
                font-family:-apple-system,sans-serif;
                flex-direction:column;
                gap:8px;
            ">
                <span style="font-size:40px">💬</span>
                <span>ยังไม่มีการสนทนา</span>
                <span style="font-size:11px;color:#48484a">กด + เพื่อเพิ่มผู้ติดต่อ</span>
            </div>

            <!-- ปุ่ม + เพิ่มคน -->
            <div style="padding:16px; border-top:1px solid #2c2c2e;">
                <button style="
                    width:100%;
                    padding:12px;
                    background:linear-gradient(135deg,#30d158,#25a244);
                    border:none;
                    border-radius:12px;
                    color:#fff;
                    font-size:14px;
                    font-weight:600;
                    cursor:pointer;
                    font-family:-apple-system,sans-serif;
                ">+ เพิ่มผู้ติดต่อ</button>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Camera Security ──────────────────────────────────
    function renderCameraApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = `
            width:100%; height:100%;
            background:#000;
            display:flex; flex-direction:column;
        `;
        page.innerHTML = `
            <div style="
                padding: 12px 16px;
                background: #1c1c1e;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                font-family: -apple-system, sans-serif;
                border-bottom: 1px solid #3a3a3c;
            ">
                📹 Camera Security
            </div>

            <!-- feed กล้อง -->
            <div style="
                flex:1;
                display:grid;
                grid-template-columns: 1fr 1fr;
                gap:2px;
                background:#111;
                padding:2px;
            ">
                <div style="
                    background:#0a0a0a;
                    border:1px solid #2a2a2a;
                    border-radius:4px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-direction:column;
                    gap:4px;
                    color:#333;
                    font-size:10px;
                    font-family:-apple-system,sans-serif;
                    position:relative;
                ">
                    <span style="font-size:20px">📹</span>
                    <span>CAM 01</span>
                    <span style="
                        position:absolute;top:6px;right:6px;
                        width:6px;height:6px;
                        background:#30d158;
                        border-radius:50%;
                    "></span>
                </div>
                <div style="
                    background:#0a0a0a;
                    border:1px solid #2a2a2a;
                    border-radius:4px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-direction:column;
                    gap:4px;
                    color:#333;
                    font-size:10px;
                    font-family:-apple-system,sans-serif;
                    position:relative;
                ">
                    <span style="font-size:20px">📹</span>
                    <span>CAM 02</span>
                    <span style="
                        position:absolute;top:6px;right:6px;
                        width:6px;height:6px;
                        background:#30d158;
                        border-radius:50%;
                    "></span>
                </div>
                <div style="
                    background:#0a0a0a;
                    border:1px solid #2a2a2a;
                    border-radius:4px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-direction:column;
                    gap:4px;
                    color:#333;
                    font-size:10px;
                    font-family:-apple-system,sans-serif;
                    position:relative;
                ">
                    <span style="font-size:20px">📹</span>
                    <span>CAM 03</span>
                    <span style="
                        position:absolute;top:6px;right:6px;
                        width:6px;height:6px;
                        background:#ff453a;
                        border-radius:50%;
                    "></span>
                </div>
                <div style="
                    background:#0a0a0a;
                    border:1px solid #2a2a2a;
                    border-radius:4px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    flex-direction:column;
                    gap:4px;
                    color:#333;
                    font-size:10px;
                    font-family:-apple-system,sans-serif;
                    position:relative;
                ">
                    <span style="font-size:20px">📹</span>
                    <span>CAM 04</span>
                    <span style="
                        position:absolute;top:6px;right:6px;
                        width:6px;height:6px;
                        background:#30d158;
                        border-radius:50%;
                    "></span>
                </div>
            </div>

            <!-- status bar กล้อง -->
            <div style="
                padding:10px 16px;
                background:#1c1c1e;
                color:#636366;
                font-size:10px;
                font-family:-apple-system,sans-serif;
                border-top:1px solid #2c2c2e;
                display:flex;
                justify-content:space-between;
            ">
                <span>🔴 CAM 03 — ตรวจพบการเคลื่อนไหว</span>
                <span style="color:#30d158">LIVE</span>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Lazzy (ฐานข้อมูลผี) ─────────────────────────────
    function renderLazzyApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = `
            width:100%; height:100%;
            background:#0d0d0d;
            display:flex; flex-direction:column;
        `;
        page.innerHTML = `
            <div style="
                padding: 12px 16px;
                background: #1a1040;
                color: #c084fc;
                font-size: 16px;
                font-weight: 600;
                font-family: -apple-system, sans-serif;
                border-bottom: 1px solid #2d1f5e;
                display:flex;
                align-items:center;
                gap:8px;
            ">
                👻 Lazzy — Ghost Database
            </div>
            <div style="
                flex:1;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-direction:column;
                gap:8px;
                color:#48484a;
                font-size:13px;
                font-family:-apple-system,sans-serif;
            ">
                <span style="font-size:40px">👻</span>
                <span style="color:#c084fc">ฐานข้อมูลผี</span>
                <span style="font-size:11px">จะเพิ่มข้อมูลผีทีหลัง</span>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Coming Soon ──────────────────────────────────────
    function renderComingSoon(name) {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = `
            width:100%; height:100%;
            background:#1c1c1e;
            display:flex;
            align-items:center;
            justify-content:center;
            flex-direction:column;
            gap:10px;
            color:#636366;
            font-family:-apple-system,sans-serif;
        `;
        page.innerHTML = `
            <span style="font-size:48px">🚧</span>
            <span style="color:#fff;font-size:16px;font-weight:600">${name}</span>
            <span style="font-size:12px">coming soon</span>
        `;
        screen.appendChild(page);
    }

    // ── เริ่มทำงานทุกอย่าง ────────────────────────────────────
    function init() {
        injectPhone();
        startClock();
        setupToggle();
        setupAppIcons();
        console.log('[Phone UI] loaded ✅');
    }

    // รอให้ SillyTavern โหลดเสร็จก่อนค่อย init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
