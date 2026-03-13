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
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <circle cx="12" cy="14" r="3"/>
            <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/>
            <circle cx="18" cy="10" r="1" fill="white" stroke="none"/>
        </svg>
    </div>
    <span class="icon-label">Security</span>
</div>
                </div>
            </div>

            <div id="phone-navbar">
              <button id="btn-menu" title="เมนู" style="color:rgba(255,255,255,0.6);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
</button>
               <button id="btn-sleep" title="ปิดจอ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12l9-9 9 9"/>
        <path d="M9 21V12h6v9"/>
    </svg>
</button>
                <button id="btn-back" title="Home">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
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

// ── ข้อมูล contacts ───────────────────────────────────────
    function getContacts() {
        const raw = localStorage.getItem('phone-ui-contacts');
        return raw ? JSON.parse(raw) : [];
    }

    function saveContacts(contacts) {
        localStorage.setItem('phone-ui-contacts', JSON.stringify(contacts));
    }

    function getChatHistory(contactId) {
        const raw = localStorage.getItem('phone-ui-chat-' + contactId);
        return raw ? JSON.parse(raw) : [];
    }

    function saveChatHistory(contactId, history) {
        localStorage.setItem('phone-ui-chat-' + contactId, JSON.stringify(history));
    }

    // ── ST API ────────────────────────────────────────────────
    async function sendToST(contactName, contactPersonality, history, userMessage) {
        const messages = [
            {
                role: 'system',
                content: `คุณคือ ${contactName} กำลังส่ง SMS คุยกับผู้เล่น
บุคลิก: ${contactPersonality || 'ตอบสั้นๆ เป็นธรรมชาติ เหมือนคุยทาง SMS'}
ตอบสั้นๆ เหมือนข้อความจริง ไม่เกิน 2-3 ประโยค ห้ามบรรยายการกระทำ`
            },
            ...history.map(m => ({
                role: m.isUser ? 'user' : 'assistant',
                content: m.text
            })),
            { role: 'user', content: userMessage }
        ];

        try {
            const res = await fetch('http://localhost:8000/api/backends/chat-completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages,
                    max_tokens: 200,
                    stream: false
                })
            });
            if (!res.ok) throw new Error('API error: ' + res.status);
            const data = await res.json();
            return data.choices[0].message.content.trim();
        } catch (err) {
            console.error('[Phone UI] ST API error:', err);
            return null;
        }
    }

    // ── Chat App — Inbox ──────────────────────────────────────
    function renderChatApp() {
        const screen = document.getElementById('phone-screen');
        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#080808;display:flex;flex-direction:column;';

        const contacts = getContacts();

        page.innerHTML = `
            <div style="
                padding:12px 16px;background:#0f0f0f;
                border-bottom:1px solid #1a1a1a;
                display:flex;align-items:center;justify-content:space-between;
                flex-shrink:0;
            ">
                <span style="color:#c8c8c8;font-size:14px;font-weight:600;letter-spacing:0.5px;">Messages</span>
                <button id="chat-add-btn" style="
                    background:none;border:1px solid #2a2a2a;
                    color:#c8c8c8;width:28px;height:28px;
                    border-radius:50%;cursor:pointer;font-size:16px;
                    display:flex;align-items:center;justify-content:center;
                ">+</button>
            </div>

            <div id="chat-inbox" style="flex:1;overflow-y:auto;scrollbar-width:none;">
                ${contacts.length === 0 ? `
                    <div style="
                        display:flex;flex-direction:column;
                        align-items:center;justify-content:center;
                        height:100%;gap:8px;color:#2a2a2a;font-size:12px;
                    ">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                             stroke="#2a2a2a" stroke-width="1" stroke-linecap="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>ยังไม่มีการสนทนา</span>
                        <span style="font-size:10px;color:#1e1e1e">กด + เพื่อเพิ่มผู้ติดต่อ</span>
                    </div>
                ` : contacts.map(c => {
                    const history = getChatHistory(c.id);
                    const last = history.length > 0 ? history[history.length - 1] : null;
                    return `
                    <div class="chat-contact-row" data-id="${c.id}" style="
                        padding:12px 16px;border-bottom:1px solid #0f0f0f;
                        display:flex;align-items:center;gap:12px;cursor:pointer;
                    ">
                        <div style="
                            width:42px;height:42px;border-radius:50%;
                            background:linear-gradient(135deg,#1e0a2a,#3a0000);
                            display:flex;align-items:center;justify-content:center;
                            color:#c8c8c8;font-size:16px;font-weight:500;
                            flex-shrink:0;border:1px solid #2a2a2a;
                        ">${c.name.charAt(0).toUpperCase()}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="color:#e0e0e0;font-size:13px;font-weight:500;margin-bottom:3px;">
                                ${c.name}
                            </div>
                            <div style="
                                color:#4a4a4a;font-size:11px;
                                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
                            ">${last ? (last.isUser ? 'คุณ: ' : '') + last.text : 'เริ่มการสนทนา...'}</div>
                        </div>
                        <div style="color:#2a2a2a;font-size:10px;flex-shrink:0;">
                            ${last ? last.time || '' : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;

        screen.appendChild(page);

        document.getElementById('chat-add-btn').addEventListener('click', () => {
            showAddContactModal();
        });

        page.querySelectorAll('.chat-contact-row').forEach(row => {
            row.addEventListener('click', () => {
                const contact = getContacts().find(c => c.id === row.dataset.id);
                if (contact) openChatConversation(contact);
            });
        });
    }

    // ── Modal เพิ่มผู้ติดต่อ ──────────────────────────────────
    function showAddContactModal() {
        document.getElementById('add-contact-modal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'add-contact-modal';
        modal.style.cssText = `
            position:absolute;inset:0;
            background:rgba(0,0,0,0.85);
            z-index:999;display:flex;
            align-items:center;justify-content:center;padding:20px;
        `;
        modal.innerHTML = `
            <div style="
                background:#0f0f0f;border:1px solid #1e1e1e;
                border-radius:16px;padding:20px;width:100%;
                display:flex;flex-direction:column;gap:12px;
            ">
                <div style="color:#c8c8c8;font-size:14px;font-weight:600;text-align:center;">
                    เพิ่มผู้ติดต่อ
                </div>
                <input id="new-contact-name" placeholder="ชื่อตัวละคร เช่น ไบร์ท" style="
                    background:#1a1a1a;border:1px solid #2a2a2a;
                    border-radius:8px;color:#c8c8c8;
                    padding:10px 12px;font-size:13px;outline:none;
                    width:100%;box-sizing:border-box;font-family:inherit;
                "/>
                <textarea id="new-contact-personality" placeholder="บุคลิก เช่น ร่าเริง พูดเยอะ ใช้ภาษาวัยรุ่น" style="
                    background:#1a1a1a;border:1px solid #2a2a2a;
                    border-radius:8px;color:#c8c8c8;
                    padding:10px 12px;font-size:13px;outline:none;
                    width:100%;height:80px;resize:none;
                    box-sizing:border-box;font-family:inherit;line-height:1.5;
                "></textarea>
                <div style="display:flex;gap:8px;">
                    <button id="modal-cancel" style="
                        flex:1;padding:10px;background:none;
                        border:1px solid #2a2a2a;border-radius:8px;
                        color:#4a4a4a;cursor:pointer;font-size:13px;font-family:inherit;
                    ">ยกเลิก</button>
                    <button id="modal-confirm" style="
                        flex:1;padding:10px;background:#3a0000;
                        border:1px solid #5a0000;border-radius:8px;
                        color:#e0e0e0;cursor:pointer;font-size:13px;
                        font-family:inherit;font-weight:500;
                    ">เพิ่ม</button>
                </div>
            </div>
        `;
        document.getElementById('phone-frame').appendChild(modal);

        document.getElementById('modal-cancel').addEventListener('click', () => modal.remove());
        document.getElementById('modal-confirm').addEventListener('click', () => {
            const name = document.getElementById('new-contact-name').value.trim();
            const personality = document.getElementById('new-contact-personality').value.trim();
            if (!name) return;
            const contacts = getContacts();
            contacts.push({ id: 'contact-' + Date.now(), name, personality });
            saveContacts(contacts);
            modal.remove();
            document.querySelectorAll('.app-page').forEach(p => p.remove());
            renderChatApp();
        });
    }

    // ── หน้าแชทกับคนนั้นๆ ────────────────────────────────────
    function openChatConversation(contact) {
        const screen = document.getElementById('phone-screen');
        document.querySelectorAll('.app-page').forEach(p => p.remove());

        const page = document.createElement('div');
        page.className = 'app-page';
        page.style.cssText = 'width:100%;height:100%;background:#080808;display:flex;flex-direction:column;';

        const history = getChatHistory(contact.id);

        page.innerHTML = `
            <div style="
                padding:10px 16px;background:#0f0f0f;
                border-bottom:1px solid #1a1a1a;
                display:flex;align-items:center;gap:10px;flex-shrink:0;
            ">
                <button id="chat-back-btn" style="
                    background:none;border:none;color:#4a4a4a;
                    cursor:pointer;font-size:22px;padding:2px 6px 2px 0;
                ">‹</button>
                <div style="
                    width:32px;height:32px;border-radius:50%;
                    background:linear-gradient(135deg,#1e0a2a,#3a0000);
                    display:flex;align-items:center;justify-content:center;
                    color:#c8c8c8;font-size:14px;font-weight:500;
                    border:1px solid #2a2a2a;flex-shrink:0;
                ">${contact.name.charAt(0).toUpperCase()}</div>
                <div style="flex:1;">
                    <div style="color:#e0e0e0;font-size:13px;font-weight:500;">${contact.name}</div>
                    <div id="chat-status" style="color:#4a4a4a;font-size:10px;">online</div>
                </div>
            </div>

            <div id="chat-messages" style="
                flex:1;overflow-y:auto;
                padding:12px 10px;
                display:flex;flex-direction:column;gap:6px;
                scrollbar-width:none;
            ">
                ${history.map(m => renderBubble(m.text, m.isUser)).join('')}
                ${history.length === 0 ? `
                    <div style="text-align:center;color:#2a2a2a;font-size:11px;margin-top:20px;">
                        ${contact.name} · เริ่มการสนทนา
                    </div>
                ` : ''}
            </div>

            <!-- input bar -->
            <div style="
                padding:6px 8px;background:#0f0f0f;
                border-top:1px solid #1a1a1a;
                display:flex;flex-direction:column;gap:6px;flex-shrink:0;
            ">
                <!-- emoji picker (ซ่อนอยู่) -->
                <div id="emoji-picker" style="
                    display:none;flex-wrap:wrap;gap:4px;
                    padding:8px;background:#0f0f0f;
                    border:1px solid #1e1e1e;border-radius:12px;
                    max-height:110px;overflow-y:auto;scrollbar-width:none;
                "></div>

                <!-- แถวพิมพ์ + ปุ่ม -->
                <div style="display:flex;align-items:center;gap:6px;">
                    <button id="emoji-btn" style="
                        background:none;border:none;font-size:20px;
                        cursor:pointer;padding:4px;border-radius:8px;
                        flex-shrink:0;opacity:0.5;transition:opacity 0.2s;
                    ">🙂</button>
                    <input id="chat-input" placeholder="พิมพ์ข้อความ..." style="
                        flex:1;background:#1a1a1a;border:1px solid #2a2a2a;
                        border-radius:18px;color:#c8c8c8;
                        padding:8px 14px;font-size:12px;outline:none;font-family:inherit;
                    "/>
                    <button id="voice-btn" style="
                        background:none;border:none;font-size:20px;
                        cursor:pointer;padding:4px;border-radius:8px;
                        flex-shrink:0;opacity:0.5;transition:opacity 0.2s;
                    ">🎤</button>
                    <button id="chat-send-btn" style="
                        width:34px;height:34px;border-radius:50%;
                        background:#3a0000;border:1px solid #5a0000;
                        color:#c8c8c8;cursor:pointer;
                        display:flex;align-items:center;justify-content:center;
                        flex-shrink:0;
                    ">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"/>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        screen.appendChild(page);

        // scroll ลงล่าง
        const msgBox = document.getElementById('chat-messages');
        msgBox.scrollTop = msgBox.scrollHeight;

        // ── ปุ่มย้อนกลับ ──────────────────────────────────
        document.getElementById('chat-back-btn').addEventListener('click', () => {
            document.querySelectorAll('.app-page').forEach(p => p.remove());
            renderChatApp();
        });

        // ── ส่งข้อความ ────────────────────────────────────
        document.getElementById('chat-send-btn').addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            handleSendMessage(contact, text);
        });

        document.getElementById('chat-input').addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            const input = document.getElementById('chat-input');
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            handleSendMessage(contact, text);
        });

        // ── Emoji Picker ──────────────────────────────────
        const emojis = [
            '😀','😂','🥲','😍','🥺','😭','😤','😱','🤔','😎',
            '👻','💀','🩸','🔪','😈','👁️','🕯️','🌑','⛩️','🗡️',
            '❤️','🖤','💔','💯','🔥','⚡','🌊','🌙','⭐','✨',
            '👍','👎','🙏','💪','🤝','👀','🫀','🧠','💣','🚨'
        ];

        const emojiPicker = document.getElementById('emoji-picker');
        emojis.forEach(em => {
            const btn = document.createElement('button');
            btn.textContent = em;
            btn.style.cssText = `
                background:none;border:none;font-size:20px;
                cursor:pointer;padding:4px;border-radius:6px;
                transition:transform 0.1s;
            `;
            btn.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                input.value += em;
                input.focus();
            });
            btn.addEventListener('mouseover', () => btn.style.transform = 'scale(1.3)');
            btn.addEventListener('mouseout',  () => btn.style.transform = 'scale(1)');
            emojiPicker.appendChild(btn);
        });

        document.getElementById('emoji-btn').addEventListener('click', () => {
            const picker = document.getElementById('emoji-picker');
            const isOpen = picker.style.display === 'flex';
            picker.style.display = isOpen ? 'none' : 'flex';
            document.getElementById('emoji-btn').style.opacity = isOpen ? '0.5' : '1';
        });

        // ── Voice Popup ───────────────────────────────────
        document.getElementById('voice-btn').addEventListener('click', () => {
            showVoicePopup(contact);
        });
    }

    // ── ฟองข้อความ ───────────────────────────────────────────
    function renderBubble(text, isUser) {
        return `
        <div style="
            display:flex;
            justify-content:${isUser ? 'flex-end' : 'flex-start'};
            animation:bubbleIn 0.2s ease;
        ">
            <div style="
                max-width:75%;padding:8px 12px;
                border-radius:${isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px'};
                background:${isUser ? '#3a0000' : '#1a1a1a'};
                border:1px solid ${isUser ? '#5a0000' : '#242424'};
                color:${isUser ? '#e8d0d0' : '#c8c8c8'};
                font-size:12px;line-height:1.5;word-break:break-word;
            ">${text}</div>
        </div>`;
    }

    // ── ส่งข้อความ + รอ reply ─────────────────────────────────
    async function handleSendMessage(contact, text) {
        const msgBox = document.getElementById('chat-messages');
        const statusEl = document.getElementById('chat-status');
        if (!msgBox) return;

        const now = new Date();
        const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

        msgBox.insertAdjacentHTML('beforeend', renderBubble(text, true));
        msgBox.scrollTop = msgBox.scrollHeight;

        const history = getChatHistory(contact.id);
        history.push({ text, isUser: true, time });
        saveChatHistory(contact.id, history);

        const typingId = 'typing-' + Date.now();
        msgBox.insertAdjacentHTML('beforeend', `
            <div id="${typingId}" style="display:flex;justify-content:flex-start;">
                <div style="
                    padding:8px 14px;border-radius:16px 16px 16px 4px;
                    background:#1a1a1a;border:1px solid #242424;
                    display:flex;gap:4px;align-items:center;
                ">
                    <span style="width:5px;height:5px;background:#4a4a4a;border-radius:50%;
                                 animation:typingDot 1s infinite;display:block;"></span>
                    <span style="width:5px;height:5px;background:#4a4a4a;border-radius:50%;
                                 animation:typingDot 1s 0.2s infinite;display:block;"></span>
                    <span style="width:5px;height:5px;background:#4a4a4a;border-radius:50%;
                                 animation:typingDot 1s 0.4s infinite;display:block;"></span>
                </div>
            </div>
        `);
        msgBox.scrollTop = msgBox.scrollHeight;
        if (statusEl) statusEl.textContent = 'กำลังพิมพ์...';

        const reply = await sendToST(contact.name, contact.personality, history, text);

        document.getElementById(typingId)?.remove();
        if (statusEl) statusEl.textContent = 'online';

        if (reply) {
            msgBox.insertAdjacentHTML('beforeend', renderBubble(reply, false));
            msgBox.scrollTop = msgBox.scrollHeight;
            history.push({ text: reply, isUser: false, time });
            saveChatHistory(contact.id, history);
        } else {
            msgBox.insertAdjacentHTML('beforeend', renderBubble('⚠️ ไม่ได้รับสัญญาณ...', false));
            msgBox.scrollTop = msgBox.scrollHeight;
        }
    }

    // ── Voice Popup ───────────────────────────────────────────
    function showVoicePopup(contact) {
        document.getElementById('voice-popup')?.remove();
        const popup = document.createElement('div');
        popup.id = 'voice-popup';
        popup.style.cssText = `
            position:absolute;bottom:80px;left:10px;right:10px;
            background:#0f0f0f;border:1px solid #2a2a2a;
            border-radius:16px;padding:16px;z-index:999;
            display:flex;flex-direction:column;gap:10px;
            box-shadow:0 8px 30px rgba(0,0,0,0.8);
            animation:bubbleIn 0.2s ease;
        `;
        popup.innerHTML = `
            <div style="color:#4a4a4a;font-size:10px;text-transform:uppercase;
                        letter-spacing:1px;text-align:center;">🎤 Voice Message</div>
            <textarea id="voice-text-input" placeholder="พิมพ์สิ่งที่จะพูด..." style="
                background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;
                color:#c8c8c8;padding:10px 12px;font-size:12px;outline:none;
                resize:none;height:70px;font-family:inherit;line-height:1.5;
            "></textarea>
            <div style="
                display:flex;align-items:center;gap:3px;padding:8px 12px;
                background:#1a1a1a;border-radius:10px;border:1px solid #242424;
            ">
                <div style="color:#cc2200;font-size:14px;">●</div>
                <div style="display:flex;gap:2px;align-items:center;flex:1;">
                    ${Array.from({length:18}, () => `
                        <div style="
                            width:3px;height:${4 + Math.random()*14}px;
                            background:#2a2a2a;border-radius:2px;
                        "></div>
                    `).join('')}
                </div>
                <div style="color:#4a4a4a;font-size:10px;">0:03</div>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="voice-cancel" style="
                    flex:1;padding:9px;background:none;border:1px solid #2a2a2a;
                    border-radius:10px;color:#4a4a4a;cursor:pointer;
                    font-size:12px;font-family:inherit;
                ">ยกเลิก</button>
                <button id="voice-send" style="
                    flex:1;padding:9px;background:#3a0000;border:1px solid #5a0000;
                    border-radius:10px;color:#e0e0e0;cursor:pointer;
                    font-size:12px;font-family:inherit;font-weight:500;
                ">ส่ง 🎤</button>
            </div>
        `;
        document.getElementById('phone-frame').appendChild(popup);

        document.getElementById('voice-cancel').addEventListener('click', () => popup.remove());
        document.getElementById('voice-send').addEventListener('click', () => {
            const text = document.getElementById('voice-text-input').value.trim();
            if (!text) return;
            popup.remove();

            const msgBox = document.getElementById('chat-messages');
            if (!msgBox) return;

            const now = new Date();
            const time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

            msgBox.insertAdjacentHTML('beforeend', `
                <div style="display:flex;justify-content:flex-end;animation:bubbleIn 0.2s ease;">
                    <div style="
                        max-width:75%;padding:8px 12px;
                        border-radius:16px 16px 4px 16px;
                        background:#3a0000;border:1px solid #5a0000;
                        display:flex;align-items:center;gap:8px;
                    ">
                        <div style="color:#cc2200;font-size:16px;">🎤</div>
                        <div>
                            <div style="display:flex;gap:2px;align-items:center;margin-bottom:3px;">
                                ${Array.from({length:14}, () => `
                                    <div style="
                                        width:2px;height:${3 + Math.random()*10}px;
                                        background:rgba(255,100,100,0.4);border-radius:1px;
                                    "></div>
                                `).join('')}
                            </div>
                            <div style="color:#e8d0d0;font-size:10px;opacity:0.6;">0:03</div>
                        </div>
                    </div>
                </div>
            `);
            msgBox.scrollTop = msgBox.scrollHeight;

            const history = getChatHistory(contact.id);
            history.push({ text: `[🎤 "${text}"]`, isUser: true, time });
            saveChatHistory(contact.id, history);
            handleSendMessage(contact, `[Voice message: "${text}"]`);
        });
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
