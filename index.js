// ================================================================
// SillyTavern Phone UI Extension
// ================================================================

(function () {

    // ── DragHelper (inline) ───────────────────────────────────
    class DragHelper {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                boundary: document.body,
                clickThreshold: 5,
                dragClass: 'dragging',
                savePosition: true,
                storageKey: 'drag-position',
                touchTimeout: 200,
                dragHandle: null,
                ...options
            };
            this.isDragging = false;
            this.startX = 0; this.startY = 0;
            this.startElementX = 0; this.startElementY = 0;
            this.moved = false;
            this.startTime = 0;
            this.touchTimer = null;
            this._init();
        }

        _init() {
            this.element.style.position = 'fixed';   // ← fixed เพราะ phone-toggle-btn ต้องติดจอ
            this.element.style.cursor = 'grab';
            this.element.style.userSelect = 'none';
            this.element.style.webkitUserSelect = 'none';
            if (this.options.savePosition) this._loadPosition();
            this._bindEvents();
        }

        _bindEvents() {
            const t = this.options.dragHandle
                ? this.element.querySelector(this.options.dragHandle)
                : this.element;
            if (!t) return;
            this.eventTarget = t;

            t.addEventListener('mousedown',  this._handleStart.bind(this), { passive: false });
            t.addEventListener('touchstart', this._handleStart.bind(this), { passive: false });
            document.addEventListener('mousemove', this._handleMove.bind(this), { passive: false });
            document.addEventListener('touchmove', this._handleMove.bind(this), { passive: false });
            document.addEventListener('mouseup',   this._handleEnd.bind(this));
            document.addEventListener('touchend',  this._handleEnd.bind(this));
            t.addEventListener('dragstart', e => e.preventDefault());
        }

        _handleStart(e) {
            const ev = e.touches ? e.touches[0] : e;
            this.isDragging = true;
            this.moved = false;
            this.startX = ev.clientX;
            this.startY = ev.clientY;
            this.startTime = Date.now();
            const r = this.element.getBoundingClientRect();
            this.startElementX = r.left;
            this.startElementY = r.top;
            if (this.touchTimer) { clearTimeout(this.touchTimer); this.touchTimer = null; }

            if (e.type === 'mousedown') {
                e.preventDefault();
                this.element.classList.add(this.options.dragClass);
                this.element.style.cursor = 'grabbing';
            } else {
                this.touchTimer = setTimeout(() => {
                    if (this.isDragging && !this.moved) {
                        this.element.classList.add(this.options.dragClass);
                    }
                }, this.options.touchTimeout);
            }
        }

        _handleMove(e) {
            if (!this.isDragging) return;
            const ev = e.touches ? e.touches[0] : e;
            const dx = ev.clientX - this.startX;
            const dy = ev.clientY - this.startY;

            if (!this.moved && (Math.abs(dx) > this.options.clickThreshold || Math.abs(dy) > this.options.clickThreshold)) {
                this.moved = true;
                e.preventDefault();
                this.element.classList.add(this.options.dragClass);
                if (this.touchTimer) { clearTimeout(this.touchTimer); this.touchTimer = null; }
            }

            if (this.moved) {
                e.preventDefault();
                const pos = this._constrain(this.startElementX + dx, this.startElementY + dy);
                this.element.style.left = pos.x + 'px';
                this.element.style.top  = pos.y + 'px';
            }
        }

        _handleEnd(e) {
            if (!this.isDragging) return;
            if (this.touchTimer) { clearTimeout(this.touchTimer); this.touchTimer = null; }
            this.isDragging = false;
            this.element.classList.remove(this.options.dragClass);
            this.element.style.cursor = 'grab';

            if (!this.moved) {
                // คลิกปกติ — เปิด overlay
                document.getElementById('phone-overlay').classList.add('active');
                return;
            }

            if (this.options.savePosition) this._savePosition();

            // กัน click หลัง drag
            const block = ev => { ev.stopPropagation(); ev.preventDefault(); this.element.removeEventListener('click', block, true); };
            this.element.addEventListener('click', block, true);
        }

        _constrain(x, y) {
            const br = this.options.boundary.getBoundingClientRect
                ? this.options.boundary.getBoundingClientRect()
                : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
            const er = this.element.getBoundingClientRect();
            return {
                x: Math.max(br.left, Math.min(br.right  - er.width,  x)),
                y: Math.max(br.top,  Math.min(br.bottom - er.height, y))
            };
        }

        _savePosition() {
            const r = this.element.getBoundingClientRect();
            try { localStorage.setItem(this.options.storageKey, JSON.stringify({ left: r.left, top: r.top })); } catch(e) {}
        }

        _loadPosition() {
            try {
                const s = localStorage.getItem(this.options.storageKey);
                if (!s) return;
                const p = JSON.parse(s);
                const pos = this._constrain(p.left, p.top);
                this.element.style.left = pos.x + 'px';
                this.element.style.top  = pos.y + 'px';
            } catch(e) {}
        }
    }

    // ── เวลา ──────────────────────────────────────────────────
    function getTime() {
        const n = new Date();
        return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
    }
    function startClock() {
        setInterval(() => {
            const el = document.getElementById('phone-time');
            if (el) el.textContent = getTime();
        }, 10000);
    }

    // ── inject HTML ────────────────────────────────────────────
    function injectPhone() {
        const div = document.createElement('div');
        div.innerHTML = `
        <button id="phone-toggle-btn" title="Open Phone">💗</button>
        <div id="phone-overlay">
            <div id="phone-frame">
                <div id="phone-notch"></div>
                <div id="phone-statusbar">
                    <span class="time" id="phone-time">${getTime()}</span>
                    <div class="icons"><span>WiFi</span><span>🔋</span></div>
                </div>
                <div id="phone-screen">
                    <div id="phone-home">
                        <div class="app-icon app-settings"  data-app="settings">  <div class="icon-img">⚙️</div><span class="icon-label">Settings</span></div>
                        <div class="app-icon app-chat"      data-app="chat">      <div class="icon-img">💬</div><span class="icon-label">Chat</span></div>
                        <div class="app-icon app-photos"    data-app="photos">    <div class="icon-img">🖼️</div><span class="icon-label">Photos</span></div>
                        <div class="app-icon app-lazzy"     data-app="lazzy">     <div class="icon-img">👻</div><span class="icon-label">Lazzy</span></div>
                        <div class="app-icon app-instagram" data-app="instagram"> <div class="icon-img">📸</div><span class="icon-label">Instagram</span></div>
                        <div class="app-icon app-twitter"   data-app="twitter">   <div class="icon-img">🐦</div><span class="icon-label">Twitter</span></div>
                        <div class="app-icon app-youtube"   data-app="youtube">   <div class="icon-img">▶️</div><span class="icon-label">Youtube</span></div>
                        <div class="app-icon app-music"     data-app="music">     <div class="icon-img">🎵</div><span class="icon-label">Music</span></div>
                        <div class="app-icon app-phone"     data-app="phonecall"> <div class="icon-img">📞</div><span class="icon-label">Phone</span></div>
                        <div class="app-icon app-camera"    data-app="camera">    <div class="icon-img">📹</div><span class="icon-label">Camera</span></div>
                    </div>
                </div>
                <div id="phone-navbar">
                    <button id="btn-menu" style="opacity:0;cursor:default;pointer-events:none;">　</button>
                    <button id="btn-sleep" title="ปิดจอ">⏻</button>
                    <button id="btn-back"  title="Home">↩</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(div);
    }

    // ── ลากปุ่มหัวใจ ──────────────────────────────────────────
    function setupDraggable() {
        const btn = document.getElementById('phone-toggle-btn');
        btn.style.left = '20px';
        btn.style.top  = (window.innerHeight / 2 - 24) + 'px';

        new DragHelper(btn, {
            storageKey: 'phone-ui-btn-pos',
            savePosition: true,
            boundary: document.documentElement,
        });
    }

    // ── navbar ─────────────────────────────────────────────────
    function setupNavbar() {
        const overlay = document.getElementById('phone-overlay');
        document.getElementById('btn-sleep').addEventListener('click', () => overlay.classList.remove('active'));
        document.getElementById('btn-back').addEventListener('click', () => showHome());
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    }

    // ── Home ───────────────────────────────────────────────────
    function showHome() {
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        document.getElementById('phone-home').style.display = 'grid';
    }

    function setupAppIcons() {
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', () => openApp(icon.dataset.app));
        });
    }

    function openApp(name) {
        document.getElementById('phone-home').style.display = 'none';
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        if      (name === 'chat')   renderChatApp();
        else if (name === 'camera') renderCameraApp();
        else if (name === 'lazzy')  renderLazzyApp();
        else                        renderComingSoon(name);
    }

    // ── Chat App ───────────────────────────────────────────────
    function renderChatApp() {
        const page = makePage('#1c1c1e');
        page.innerHTML = `
            <div style="padding:12px 16px;background:#2c2c2e;color:#fff;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #3a3a3c;">💬 Chat</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#636366;font-size:13px;font-family:-apple-system,sans-serif;">
                <span style="font-size:40px">💬</span><span>ยังไม่มีการสนทนา</span>
                <span style="font-size:11px;color:#48484a">กด + เพื่อเพิ่มผู้ติดต่อ</span>
            </div>
            <div style="padding:16px;border-top:1px solid #2c2c2e;">
                <button style="width:100%;padding:12px;background:linear-gradient(135deg,#30d158,#25a244);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;">+ เพิ่มผู้ติดต่อ</button>
            </div>`;
        document.getElementById('phone-screen').appendChild(page);
    }

    // ── Camera App ─────────────────────────────────────────────
    function renderCameraApp() {
        const page = makePage('#000');
        page.innerHTML = `
            <div style="padding:12px 16px;background:#1c1c1e;color:#fff;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #3a3a3c;">📹 Camera Security</div>
            <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#111;padding:2px;">
                ${[1,2,3,4].map(n=>`
                <div style="background:#0a0a0a;border:1px solid #2a2a2a;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:4px;color:#333;font-size:10px;font-family:-apple-system,sans-serif;position:relative;min-height:80px;">
                    <span style="font-size:20px">📹</span><span>CAM 0${n}</span>
                    <span style="position:absolute;top:6px;right:6px;width:6px;height:6px;background:${n===3?'#ff453a':'#30d158'};border-radius:50%;"></span>
                </div>`).join('')}
            </div>
            <div style="padding:10px 16px;background:#1c1c1e;color:#636366;font-size:10px;font-family:-apple-system,sans-serif;border-top:1px solid #2c2c2e;display:flex;justify-content:space-between;">
                <span>🔴 CAM 03 — ตรวจพบการเคลื่อนไหว</span><span style="color:#30d158">LIVE</span>
            </div>`;
        document.getElementById('phone-screen').appendChild(page);
    }

    // ── Lazzy App ──────────────────────────────────────────────
    function renderLazzyApp() {
        const page = makePage('#0d0d0d');
        page.innerHTML = `
            <div style="padding:12px 16px;background:#1a1040;color:#c084fc;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;border-bottom:1px solid #2d1f5e;">👻 Lazzy — Ghost Database</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#48484a;font-size:13px;font-family:-apple-system,sans-serif;">
                <span style="font-size:40px">👻</span>
                <span style="color:#c084fc">ฐานข้อมูลผี</span><span style="font-size:11px">ยังไม่มีข้อมูล</span>
            </div>`;
        document.getElementById('phone-screen').appendChild(page);
    }

    // ── Coming Soon ────────────────────────────────────────────
    function renderComingSoon(name) {
        const page = makePage('#1c1c1e');
        page.style.alignItems = 'center';
        page.style.justifyContent = 'center';
        page.innerHTML = `
            <span style="font-size:48px">🚧</span>
            <span style="color:#fff;font-size:16px;font-weight:600;font-family:-apple-system,sans-serif;margin-top:10px">${name}</span>
            <span style="font-size:12px;color:#636366;font-family:-apple-system,sans-serif;">กำลังสร้าง...</span>`;
        document.getElementById('phone-screen').appendChild(page);
    }

    function makePage(bg) {
        const p = document.createElement('div');
        p.className = 'app-page';
        p.style.cssText = `width:100%;height:100%;background:${bg};display:flex;flex-direction:column;`;
        return p;
    }

    // ── Extension Panel ────────────────────────────────────────
    function setupExtensionPanel() {
        const timer = setInterval(() => {
            const target =
                document.querySelector('#extensions_settings2') ||
                document.querySelector('.extensions_block')     ||
                document.querySelector('#extensionsMenu');
            if (!target) return;
            clearInterval(timer);
            if (document.getElementById('phone-ui-panel')) return;

            const panel = document.createElement('div');
            panel.id = 'phone-ui-panel';
            panel.id = 'phone-ui-settings';
            panel.innerHTML = `
                <div style="color:#fff;font-size:15px;font-weight:700;font-family:-apple-system,sans-serif;margin-bottom:4px;">💗 Phone UI</div>
                <div style="color:#636366;font-size:11px;font-family:-apple-system,sans-serif;margin-bottom:12px;">จอโทรศัพท์จำลองสำหรับ SillyTavern</div>
                <div class="phone-ui-toggle-row">
                    <div>
                        <label style="color:#fff;font-size:14px;font-weight:500;">เปิดใช้งาน Phone UI</label>
                        <small style="color:#636366;font-size:11px;display:block;margin-top:2px;">แสดงปุ่มหัวใจข้างจอ</small>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="phone-ui-enabled" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="mode-selector" style="margin-top:12px;">
                    <div class="mode-selector-title">โหมด</div>
                    <button class="mode-btn active" id="mode-normal"><span class="mode-icon">📱</span><div class="mode-text"><strong>Normal</strong><span>โทรศัพท์ทั่วไป</span></div></button>
                    <button class="mode-btn" id="mode-horror"><span class="mode-icon">👻</span><div class="mode-text"><strong>Horror RPG</strong><span>โหมดล่าผี</span></div></button>
                </div>`;
            target.prepend(panel);

            document.getElementById('phone-ui-enabled').addEventListener('change', e => {
                document.getElementById('phone-toggle-btn').style.display = e.target.checked ? 'flex' : 'none';
            });
            ['mode-normal','mode-horror'].forEach(id => {
                document.getElementById(id).addEventListener('click', () => {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    document.getElementById(id).classList.add('active');
                });
            });
        }, 500);
    }

    // ── init ───────────────────────────────────────────────────
    function init() {
        injectPhone();
        startClock();
        setupDraggable();
        setupNavbar();
        setupAppIcons();
        setupExtensionPanel();
        console.log('[Phone UI] ✅ loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
