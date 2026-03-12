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
                    <div class="icons"><span>WiFi</span><span>🔋</span></div>
                </div>
                <div id="phone-screen">
                    <div id="phone-home">
                        <div class="app-icon" data-app="settings"> <div class="icon-img">⚙️</div><span class="icon-label">Settings</span></div>
                        <div class="app-icon" data-app="chat">     <div class="icon-img">💬</div><span class="icon-label">Chat</span></div>
                        <div class="app-icon" data-app="photos">   <div class="icon-img">🖼️</div><span class="icon-label">Photos</span></div>
                        <div class="app-icon" data-app="lazzy">    <div class="icon-img">👻</div><span class="icon-label">Lazzy</span></div>
                        <div class="app-icon" data-app="instagram"><div class="icon-img">📸</div><span class="icon-label">Instagram</span></div>
                        <div class="app-icon" data-app="twitter">  <div class="icon-img">🐦</div><span class="icon-label">Twitter</span></div>
                        <div class="app-icon" data-app="youtube">  <div class="icon-img">▶️</div><span class="icon-label">Youtube</span></div>
                        <div class="app-icon" data-app="music">    <div class="icon-img">🎵</div><span class="icon-label">Music</span></div>
                        <div class="app-icon" data-app="camera">   <div class="icon-img">📹</div><span class="icon-label">Camera</span></div>
                    </div>
                </div>
                <div id="phone-navbar">
                    <button id="btn-menu" style="opacity:0;pointer-events:none;">　</button>
                    <button id="btn-sleep" title="Exit">⏻</button> 
                    <button id="btn-back"  title="Home">↩</button>
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
