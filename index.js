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

    function startClock() {
        const el = document.getElementById('phone-time');
        if (el) el.textContent = getTime();
        setInterval(() => {
            const el = document.getElementById('phone-time');
            if (el) el.textContent = getTime();
        }, 30000);
    }

    // ── สร้าง HTML โทรศัพท์ ────────────────────────────────────
    function buildPhoneHTML() {
        return `
        <button id="phone-toggle-btn" title="Open Phone">💗</button>

        <div id="phone-overlay">
            <div id="phone-frame">
                <div id="phone-notch"></div>
                <div id="phone-statusbar">
                    <span class="time" id="phone-time">00:00</span>
                    <div class="icons"><span>WiFi</span><span>🔋</span></div>
                </div>
                <div id="phone-screen">
                    <div id="phone-home">
                        <div class="app-icon app-settings"  data-app="settings">
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
                </div>

                <!-- navbar: ซ้าย(ว่าง) | กลาง(ปิดจอ) | ขวา(home) -->
                <div id="phone-navbar">
                    <button id="btn-menu">　</button>
                    <button id="btn-sleep" title="ปิดจอ">⏻</button>
                    <button id="btn-back"  title="Home">↩</button>
                </div>
            </div>
        </div>
        `;
    }

    // ── inject HTML ────────────────────────────────────────────
    function injectPhone() {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = buildPhoneHTML();
        document.body.appendChild(wrapper);
    }

    // ── ลากปุ่มหัวใจได้ (mouse + touch) ──────────────────────
    function setupDraggable() {
        const btn = document.getElementById('phone-toggle-btn');
        let dragging = false;
        let startX, startY, startLeft, startTop;
        let moved = false;

        function onStart(e) {
            dragging = true;
            moved = false;
            btn.classList.add('dragging');

            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const rect = btn.getBoundingClientRect();

            startX    = clientX;
            startY    = clientY;
            startLeft = rect.left;
            startTop  = rect.top;

            e.preventDefault();
        }

        function onMove(e) {
            if (!dragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            // ถ้าขยับเกิน 5px ถือว่าลาก
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;

            // คำนวณตำแหน่งใหม่ ไม่ให้หลุดนอกจอ
            const newLeft = Math.min(Math.max(startLeft + dx, 0), window.innerWidth  - btn.offsetWidth);
            const newTop  = Math.min(Math.max(startTop  + dy, 0), window.innerHeight - btn.offsetHeight);

            btn.style.left      = newLeft + 'px';
            btn.style.top       = newTop  + 'px';
            btn.style.transform = 'none'; // เอา translateY(-50%) ออกตอนลาก
        }

        function onEnd() {
            if (!dragging) return;
            dragging = false;
            btn.classList.remove('dragging');
        }

        // mouse events
        btn.addEventListener('mousedown',  onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);

        // touch events
        btn.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove',  onMove, { passive: false });
        document.addEventListener('touchend',   onEnd);

        // คลิกเปิดโทรศัพท์ (เฉพาะตอนไม่ได้ลาก)
        btn.addEventListener('click', () => {
            if (moved) return; // ถ้าลากอยู่ไม่เปิด
            const overlay = document.getElementById('phone-overlay');
            overlay.classList.add('active');
        });
    }

    // ── ปุ่ม navbar ───────────────────────────────────────────
    function setupNavbar() {
        const overlay = document.getElementById('phone-overlay');

        // ปุ่มกลาง = ปิดจอ (ปิด overlay)
        document.getElementById('btn-sleep').addEventListener('click', () => {
            overlay.classList.remove('active');
        });

        // ปุ่มขวา = กลับ home
        document.getElementById('btn-back').addEventListener('click', () => {
            showHome();
        });

        // กด overlay ด้านนอกโทรศัพท์ = ปิด
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    }

    // ── Home Screen ───────────────────────────────────────────
    function showHome() {
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        document.getElementById('phone-home').style.display = 'grid';
    }

    // ── App Icons ─────────────────────────────────────────────
    function setupAppIcons() {
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', () => openApp(icon.dataset.app));
        });
    }

    function openApp(appName) {
        document.getElementById('phone-home').style.display = 'none';
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        switch (appName) {
            case 'chat':     renderChatApp();    break;
            case 'camera':   renderCameraApp();  break;
            case 'lazzy':    renderLazzyApp();   break;
            default:         renderComingSoon(appName);
        }
    }

    // ── App: Chat ─────────────────────────────────────────────
    function renderChatApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#1c1c1e;display:flex;flex-direction:column;';
        page.innerHTML = `
            <div style="padding:12px 16px;background:#2c2c2e;color:#fff;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #3a3a3c;">
                💬 Chat
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#636366;font-size:13px;font-family:-apple-system,sans-serif;">
                <span style="font-size:40px">💬</span>
                <span>ยังไม่มีการสนทนา</span>
                <span style="font-size:11px;color:#48484a">กด + เพื่อเพิ่มผู้ติดต่อ</span>
            </div>
            <div style="padding:16px;border-top:1px solid #2c2c2e;">
                <button style="width:100%;padding:12px;background:linear-gradient(135deg,#30d158,#25a244);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;">
                    + เพิ่มผู้ติดต่อ
                </button>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Camera Security ──────────────────────────────────
    function renderCameraApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#000;display:flex;flex-direction:column;';
        page.innerHTML = `
            <div style="padding:12px 16px;background:#1c1c1e;color:#fff;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #3a3a3c;">
                📹 Camera Security
            </div>
            <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#111;padding:2px;">
                ${[1,2,3,4].map(n => `
                <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:#333;font-size:10px;font-family:-apple-system,sans-serif;position:relative;">
                    <span style="font-size:20px">📹</span>
                    <span>CAM 0${n}</span>
                    <span style="position:absolute;top:6px;right:6px;width:6px;height:6px;background:${n===3?'#ff453a':'#30d158'};border-radius:50%;"></span>
                </div>`).join('')}
            </div>
            <div style="padding:10px 16px;background:#1c1c1e;color:#636366;font-size:10px;font-family:-apple-system,sans-serif;border-top:1px solid #2c2c2e;display:flex;justify-content:space-between;">
                <span>🔴 CAM 03 — ตรวจพบการเคลื่อนไหว</span>
                <span style="color:#30d158">LIVE</span>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Lazzy ────────────────────────────────────────────
    function renderLazzyApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#0d0d0d;display:flex;flex-direction:column;';
        page.innerHTML = `
            <div style="padding:12px 16px;background:#1a1040;color:#c084fc;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #2d1f5e;">
                👻 Lazzy — Ghost Database
            </div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#48484a;font-size:13px;font-family:-apple-system,sans-serif;">
                <span style="font-size:40px">👻</span>
                <span style="color:#c084fc">ฐานข้อมูลผี</span>
                <span style="font-size:11px">ยังไม่มีข้อมูล</span>
            </div>
        `;
        screen.appendChild(page);
    }

    // ── App: Coming Soon ──────────────────────────────────────
    function renderComingSoon(name) {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#1c1c1e;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#636366;font-family:-apple-system,sans-serif;';
        page.innerHTML = `
            <span style="font-size:48px">🚧</span>
            <span style="color:#fff;font-size:16px;font-weight:600">${name}</span>
            <span style="font-size:12px">กำลังสร้าง...</span>
        `;
        screen.appendChild(page);
    }

    // ── Extension Panel ใน SillyTavern Settings ───────────────
    function setupExtensionPanel() {
        // ST จะสร้าง panel ให้ถ้าเราใส่ html ใน getExtensionPrompt
        // วิธีง่ายสุดคือ inject เข้าไปใน extensions panel โดยตรง
        const checkPanel = setInterval(() => {
            // หา container ของ extensions ใน ST
            const container = document.querySelector('#extensions_settings');
            if (!container) return;
            clearInterval(checkPanel);

            // สร้าง section ของเรา
            const section = document.createElement('div');
            section.id = 'phone-ui-settings';
            section.innerHTML = `
                <div style="color:#fff;font-size:15px;font-weight:700;font-family:-apple-system,sans-serif;margin-bottom:4px;display:flex;align-items:center;gap:8px;">
                    💗 Phone UI
                </div>
                <div style="color:#636366;font-size:11px;font-family:-apple-system,sans-serif;margin-bottom:12px;">
                    จอโทรศัพท์จำลองสำหรับ SillyTavern
                </div>

                <!-- toggle เปิด/ปิด -->
                <div class="phone-ui-toggle-row">
                    <div>
                        <label>เปิดใช้งาน Phone UI</label>
                        <small>แสดงปุ่มหัวใจข้างจอ</small>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="phone-ui-enabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <!-- เลือก mode -->
                <div class="mode-selector">
                    <div class="mode-selector-title">โหมด</div>

                    <button class="mode-btn active" id="mode-normal">
                        <span class="mode-icon">📱</span>
                        <div class="mode-text">
                            <strong>Normal</strong>
                            <span>โทรศัพท์ทั่วไป</span>
                        </div>
                    </button>

                    <button class="mode-btn" id="mode-horror">
                        <span class="mode-icon">👻</span>
                        <div class="mode-text">
                            <strong>Horror RPG</strong>
                            <span>โหมดล่าผี — เชื่อมกับระบบเกม</span>
                        </div>
                    </button>
                </div>
            `;
            container.prepend(section);

            // toggle เปิด/ปิดปุ่มหัวใจ
            document.getElementById('phone-ui-enabled').addEventListener('change', (e) => {
                const btn = document.getElementById('phone-toggle-btn');
                btn.style.display = e.target.checked ? 'flex' : 'none';
            });

            // สลับ mode (UI เท่านั้น ยังไม่มีระบบจริง)
            document.getElementById('mode-normal').addEventListener('click', () => {
                document.getElementById('mode-normal').classList.add('active');
                document.getElementById('mode-horror').classList.remove('active');
            });

            document.getElementById('mode-horror').addEventListener('click', () => {
                document.getElementById('mode-horror').classList.add('active');
                document.getElementById('mode-normal').classList.remove('active');
            });
        }, 500);
    }

    // ── เริ่มทำงาน ────────────────────────────────────────────
    function init() {
        injectPhone();
        startClock();
        setupDraggable();
        setupNavbar();
        setupAppIcons();
        setupExtensionPanel();
        console.log('[Phone UI] loaded ✅');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
