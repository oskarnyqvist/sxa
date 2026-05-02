<script>
    export let canvas;
    export let onSpawn = () => {};

    let drag = null; // { type, x, y, pointerId, captured }

    function start(e, type) {
        e.preventDefault();
        drag = { type, x: e.clientX, y: e.clientY, pointerId: e.pointerId, captured: e.currentTarget };
        e.currentTarget.setPointerCapture(e.pointerId);
    }

    function move(e) {
        if (!drag || e.pointerId !== drag.pointerId) return;
        drag = { ...drag, x: e.clientX, y: e.clientY };
    }

    function end(e) {
        if (!drag || e.pointerId !== drag.pointerId) return;
        const { type, x, y, captured } = drag;
        try { captured.releasePointerCapture(e.pointerId); } catch {}
        drag = null;
        if (!canvas) return;
        const r = canvas.getBoundingClientRect();
        if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
        const sx = x - r.left;
        const sy = y - r.top;
        onSpawn(type, sx, sy);
    }
</script>

<div class="toolbox">
    <button
        class="icon star"
        aria-label="Lägg till stjärna"
        on:pointerdown={(e) => start(e, 'star')}
        on:pointermove={move}
        on:pointerup={end}
        on:pointercancel={end}
    >
        <svg viewBox="0 0 24 24" width="22" height="22"><path fill="#CEA158" d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
    </button>
    <button
        class="icon comet"
        aria-label="Lägg till komet"
        on:pointerdown={(e) => start(e, 'comet')}
        on:pointermove={move}
        on:pointerup={end}
        on:pointercancel={end}
    >
        <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="17" cy="7" r="4" fill="#3983B1"/>
            <path d="M14 10 L4 20" stroke="#3983B1" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        </svg>
    </button>
</div>

{#if drag}
    <div class="ghost" style="left: {drag.x}px; top: {drag.y}px;">
        {#if drag.type === 'star'}
            <svg viewBox="0 0 24 24" width="40" height="40"><path fill="#CEA158" d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/></svg>
        {:else}
            <svg viewBox="0 0 24 24" width="40" height="40">
                <circle cx="17" cy="7" r="4" fill="#3983B1"/>
                <path d="M14 10 L4 20" stroke="#3983B1" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
            </svg>
        {/if}
    </div>
{/if}

<style>
    .toolbox {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 6px;
        background: var(--surface-glass);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 6px;
        z-index: 6;
    }

    .icon {
        background: transparent;
        border: none;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        touch-action: none;
        padding: 0;
    }
    .icon:active { cursor: grabbing; background: var(--border); }

    .ghost {
        position: fixed;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 100;
        opacity: 0.85;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
    }
</style>
