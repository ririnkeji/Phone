// ================================================================
// SillyTavern Phone UI Extension
// ================================================================

(function () {

    // ── DragHelper (Improved for SillyTavern) ───────────────────
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
            this.element.style.position = 'fixed';
            this.element.style.cursor = 'grab';
            this.element.style.userSelect = 'none';
            this.element.style.webkitUserSelect = 'none';
            this.element.style.touchAction = 'none'; // สำคัญมากสำหรับการลากบนมือถือ
            if (this.options.savePosition) this._loadPosition();
            this._bindEvents();
        }

        _bindEvents() {
            const t = this.options.dragHandle ? this.element.querySelector(this.options.dragHandle) : this.element;
            if (!t) return;

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
            
            // ดึงค่าตำแหน่งปัจจุบันจาก style โดยตรงเพื่อความแม่นยำ
            this.startElementX = parseInt(this.element.style.left) || 0;
            this.startElementY = parseInt(this.element.style.top) || 0;

            if (e.type === 'mousedown') {
                e.preventDefault();
                this.element.style.cursor = 'grabbing';
            }
        }

        _handleMove(e) {
            if (!this.isDragging) return;
            e.stopPropagation(); // กันไปกวน UI อื่นของ SillyTavern

            const ev = e.touches ? e.touches[0] : e;
            const dx = ev.clientX - this.startX;
            const dy = ev.clientY - this.startY;

            if (!this.moved && (Math.abs(dx) > this.options.clickThreshold || Math.abs(dy) > this.options.clickThreshold)) {
                this.moved = true;
                this.element.classList.add(this.options.dragClass);
            }

            if (this.moved) {
                const pos = this._constrain(this.startElementX + dx, this.startElementY + dy);
                this.element.style.left = pos.x + 'px';
                this.element.style.top  = pos.y + 'px';
            }
        }

        _handleEnd(e) {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.element.classList.remove(this.options.dragClass);
            this.element.style.cursor = 'grab';

            if (!this.moved) {
                // คลิกปกติ — เปิด overlay
                document.getElementById('phone-overlay').classList.add('active');
            } else {
                if (this.options.savePosition) this._savePosition();
                // กันการคลิกค้างหลังลาก
                const block = ev => { ev.stopPropagation(); ev.preventDefault(); this.element.removeEventListener('click', block, true); };
                this.element.addEventListener('click', block, true);
            }
        }

        _constrain(x, y) {
            const maxX = window.innerWidth - this.element.offsetWidth;
            const maxY = window.innerHeight - this.element.offsetHeight;
            return {
                x: Math.max(0, Math.min(maxX, x)),
                y: Math.max(0, Math.min(maxY, y))
            };
        }

        _savePosition() {
            const r = this.element.getBoundingClientRect();
            localStorage.setItem(this.options.storageKey, JSON.stringify({ left: r.left, top: r.top }));
        }

        _loadPosition() {
            const s = localStorage.getItem(this.options.storageKey);
            if (s) {
                const p = JSON.parse(s);
                const pos = this._constrain(p.left, p.top);
                this.element.style.left = pos.x + 'px';
                this.element.style.top  = pos.y + 'px';
            }
        }
    }

    // ── Utility ──────────────────────────────────────────────
    function getTime() {
        const n = new Date();
        return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
    }

    function injectPhone() {
    const div = document.createElement('div');
    div.innerHTML = `
    <button id="phone-toggle-btn" title="Open Phone">💗</button>
    <div id="phone-overlay">
        <div id="phone-frame">
            <div id="phone-notch"></div>

            <div id="phone-statusbar">
                <span class="time" id="phone-time">${getTime()}</span>
                <div class="icons">
                    <!-- WiFi icon SVG -->
                    <svg class="sb-icon" viewBox="0 0 24 24">
                        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                        <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
                    </svg>
                    <!-- Battery icon SVG -->
                    <svg class="sb-icon sb-battery" viewBox="0 0 24 24">
                        <rect x="1" y="7" width="18" height="10" rx="2"/>
                        <path d="M23 11v2" stroke-width="2"/>
                        <rect x="3" y="9" width="12" height="6" rx="1"
                              fill="currentColor" stroke="none" opacity="0.7"/>
                    </svg>
                </div>
            </div>

            <div id="phone-screen">
                <div id="phone-home">

                    <div class="app-icon" data-app="settings">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                            </svg>
                        </div>
                        <span class="icon-label">Settings</span>
                    </div>

                    <div class="app-icon" data-app="chat">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <span class="icon-label">Chat</span>
                    </div>

                    <div class="app-icon" data-app="photos">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <path d="M21 15l-5-5L5 21"/>
                            </svg>
                        </div>
                        <span class="icon-label">Photos</span>
                    </div>

                    <div class="app-icon" data-app="lazzy">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M12 2C8 2 5 5 5 9v7l-1 2h16l-1-2V9c0-4-3-7-7-7z"/>
                                <path d="M9 21c0 1.7 1.3 3 3 3s3-1.3 3-3"/>
                                <circle cx="9" cy="10" r="1" fill="white" stroke="none"/>
                                <circle cx="15" cy="10" r="1" fill="white" stroke="none"/>
                            </svg>
                        </div>
                        <span class="icon-label">Lazzy</span>
                    </div>

                    <div class="app-icon" data-app="instagram">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <rect x="2" y="2" width="20" height="20" rx="5"/>
                                <circle cx="12" cy="12" r="4"/>
                                <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
                            </svg>
                        </div>
                        <span class="icon-label">Instagram</span>
                    </div>

                    <div class="app-icon" data-app="twitter">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                            </svg>
                        </div>
                        <span class="icon-label">Twitter</span>
                    </div>

                    <div class="app-icon" data-app="youtube">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" stroke="none"/>
                            </svg>
                        </div>
                        <span class="icon-label">Youtube</span>
                    </div>

                    <div class="app-icon" data-app="music">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                            </svg>
                        </div>
                        <span class="icon-label">Music</span>
                    </div>

                    <div class="app-icon" data-app="camera">
                        <div class="icon-img">
                            <svg viewBox="0 0 24 24">
                                <path d="M23 7l-7-4-8 4v13l8 4 7-4V7z"/>
                                <line x1="8" y1="7" x2="8" y2="20"/>
                                <line x1="16" y1="3" x2="16" y2="17"/>
                            </svg>
                        </div>
                        <span class="icon-label">Camera</span>
                    </div>

                </div>
            </div>

            <div id="phone-navbar">
                <button id="btn-menu" style="opacity:0;pointer-events:none;"></button>
                <button id="btn-sleep" title="ปิดจอ">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="1.5"
                         stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </button>
                <button id="btn-back" title="Home">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="1.5"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12l9-9 9 9"/>
                        <path d="M9 21V12h6v9"/>
                    </svg>
                </button>
            </div>

        </div>
    </div>`;
    document.body.appendChild(div);
}


    function setupNavbar() {
        const overlay = document.getElementById('phone-overlay');
        // แก้ไขตามที่ขอ: ปุ่มกลางปิด, ปุ่มขวากลับหน้าหลัก
        document.getElementById('btn-sleep').addEventListener('click', () => overlay.classList.remove('active'));
        document.getElementById('btn-back').addEventListener('click', () => showHome());
        
        overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
    }

    function showHome() {
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        document.getElementById('phone-home').style.display = 'grid';
    }

    // ... (ส่วน App Icons และ Render App ต่างๆ เหมือนเดิม) ...
    function setupAppIcons() {
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.addEventListener('click', () => openApp(icon.dataset.app));
        });
    }

    function openApp(name) {
        document.getElementById('phone-home').style.display = 'none';
        document.querySelectorAll('.app-page').forEach(p => p.remove());
        // Simple router logic
        if (name === 'chat') renderChatApp();
        else renderComingSoon(name);
    }

    function makePage(bg) {
        const p = document.createElement('div');
        p.className = 'app-page';
        p.style.cssText = `width:100%;height:100%;background:${bg};display:flex;flex-direction:column;`;
        return p;
    }

    function renderComingSoon(name) {
        const page = makePage('#1c1c1e');
        page.style.alignItems = 'center'; page.style.justifyContent = 'center';
        page.innerHTML = `<span style="font-size:48px">🚧</span><span style="color:#fff;margin-top:10px">${name}</span>`;
        document.getElementById('phone-screen').appendChild(page);
    }

    function setupDraggable() {
        const btn = document.getElementById('phone-toggle-btn');
        // ตั้งตำแหน่งเริ่มต้นถ้าไม่มีใน storage
        if(!btn.style.left) {
            btn.style.left = '20px';
            btn.style.top = '50%';
        }
        new DragHelper(btn, { storageKey: 'phone-ui-btn-pos' });
    }

    function init() {
        injectPhone();
        setupDraggable();
        setupNavbar();
        setupAppIcons();
        console.log('[Phone UI] Fixed & Loaded');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();
