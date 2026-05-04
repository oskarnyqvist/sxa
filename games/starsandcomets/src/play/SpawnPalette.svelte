<script>
    // Floating palette ("ön") on the canvas. Drag a body off it onto the
    // canvas; release inside canvas commits the spawn. Comets fling — release
    // velocity becomes initial velocity. Stars ignore the fling.
    export let lab = null;
    export let canvasEl = null;

    let handle = null;
    let active = null; // 'star' | 'comet' | null
    let paletteEl;

    function pointInRect(x, y, r) {
        return x >= r.left && y >= r.top && x <= r.right && y <= r.bottom;
    }

    function clientToCanvas(clientX, clientY) {
        if (!canvasEl) return [0, 0, false];
        const cr = canvasEl.getBoundingClientRect();
        const sx = clientX - cr.left;
        const sy = clientY - cr.top;
        const insideCanvas = sx >= 0 && sy >= 0 && sx <= cr.width && sy <= cr.height;
        // Drop must land outside the palette itself — otherwise a tap on the
        // icon would spawn the body underneath the palette.
        const overPalette = paletteEl && pointInRect(clientX, clientY, paletteEl.getBoundingClientRect());
        return [sx, sy, insideCanvas && !overPalette];
    }

    function onDown(type, e) {
        if (!lab) return;
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        active = type;
        handle = lab.beginSpawn(type);
        const [sx, sy, inside] = clientToCanvas(e.clientX, e.clientY);
        handle.move(sx, sy, inside);
    }

    function onMove(e) {
        if (!handle) return;
        const [sx, sy, inside] = clientToCanvas(e.clientX, e.clientY);
        handle.move(sx, sy, inside);
    }

    function onUp() {
        if (!handle) return;
        handle.commit();
        handle = null;
        active = null;
    }

    function onCancel() {
        if (!handle) return;
        handle.cancel();
        handle = null;
        active = null;
    }
</script>

<div class="palette" class:active bind:this={paletteEl}>
    <button class="slot star"
        class:dragging={active === 'star'}
        aria-label="Dra ut en stjärna"
        on:pointerdown={(e) => onDown('star', e)}
        on:pointermove={onMove}
        on:pointerup={onUp}
        on:pointercancel={onCancel}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="#CEA158" d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/>
        </svg>
    </button>
    <button class="slot comet"
        class:dragging={active === 'comet'}
        aria-label="Dra ut en komet och flicka iväg"
        on:pointerdown={(e) => onDown('comet', e)}
        on:pointermove={onMove}
        on:pointerup={onUp}
        on:pointercancel={onCancel}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <circle cx="17" cy="7" r="4" fill="#3983B1"/>
            <path d="M14 10 L4 20" stroke="#3983B1" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>
    </button>
</div>

<style>
    .palette {
        position: absolute;
        top: 12px;
        left: 12px;
        z-index: 5;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 6px;
        background: var(--surface-glass);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid var(--border);
        border-radius: 14px;
        touch-action: none;
    }

    .slot {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        cursor: grab;
        padding: 0;
    }
    .slot:hover { background: var(--surface); }
    .slot:active, .slot.dragging { cursor: grabbing; background: var(--surface); }
</style>
