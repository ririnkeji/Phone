window.PhoneDragHelper = {
    init: function(el, onClickFn) {
        let startX, startY, startL, startT;
        let dragging = false;
        let moved = false;

        el.style.position = 'fixed';
        el.style.left = '20px';
        el.style.top  = (window.innerHeight / 2 - 24) + 'px';
        el.style.cursor = 'grab';

        function getXY(e) {
            return e.touches
                ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                : { x: e.clientX,            y: e.clientY };
        }

        function onStart(e) {
            e.preventDefault();
            const p = getXY(e);
            const r = el.getBoundingClientRect();
            startX = p.x; startY = p.y;
            startL = r.left; startT = r.top;
            dragging = true;
            moved = false;
            el.style.cursor = 'grabbing';
        }

        function onMove(e) {
            if (!dragging) return;
            e.preventDefault();
            const p = getXY(e);
            const dx = p.x - startX;
            const dy = p.y - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            const newL = Math.min(Math.max(startL + dx, 0), window.innerWidth  - el.offsetWidth);
            const newT = Math.min(Math.max(startT + dy, 0), window.innerHeight - el.offsetHeight);
            el.style.left = newL + 'px';
            el.style.top  = newT + 'px';
        }

        function onEnd() {
            if (!dragging) return;
            dragging = false;
            el.style.cursor = 'grab';
            if (!moved && onClickFn) onClickFn();
            moved = false;
        }

        el.addEventListener('mousedown',  onStart, { passive: false });
        el.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('mousemove', onMove, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchend',  onEnd);
    }
};
