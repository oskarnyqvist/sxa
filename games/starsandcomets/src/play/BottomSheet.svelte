<script>
    import { tick } from 'svelte';

    export let settings;
    export let selected = null;
    export let snap = 'closed'; // 'closed' | 'peek' | 'full'
    export let onDelete = () => {};

    const PRESETS = {
        'Klassisk': { glow: 0,    tailTaper: 0,    tailFade: 0,    speedReactivity: 0   },
        'Glow':     { glow: 0.6,  tailTaper: 0.7,  tailFade: 0.7,  speedReactivity: 0   },
        'Neon':     { glow: 1.0,  tailTaper: 0.8,  tailFade: 0.5,  speedReactivity: 0.4 },
        'Eldkula':  { glow: 0.8,  tailTaper: 0.9,  tailFade: 0.9,  speedReactivity: 1.0 },
    };

    let sheetEl;
    let drag = null;
    let dragOffset = 0;

    $: if (selected && snap === 'closed') snap = 'peek';

    function poke() { selected = selected; settings = settings; }

    function applyPreset(name) {
        const p = PRESETS[name];
        if (!p || !selected) return;
        Object.assign(selected, p);
        poke();
    }

    function setColor(value) {
        if (!selected) return;
        selected.color = value;
        if (selected.trail) selected.trail.color = value;
        poke();
    }

    function onHandlePointerDown(e) {
        e.preventDefault();
        drag = { startY: e.clientY, startSnap: snap };
        sheetEl.setPointerCapture(e.pointerId);
    }

    function onHandlePointerMove(e) {
        if (!drag) return;
        dragOffset = e.clientY - drag.startY;
    }

    function onHandlePointerUp(e) {
        if (!drag) return;
        const total = window.innerHeight;
        const snaps = ['closed', 'peek', 'full'];
        const heights = { closed: 0, peek: 80, full: total * 0.65 };
        const startH = heights[drag.startSnap];
        const currentH = Math.max(0, startH - dragOffset);
        let best = 'closed';
        let bestDiff = Infinity;
        for (const s of snaps) {
            const d = Math.abs(heights[s] - currentH);
            if (d < bestDiff) { bestDiff = d; best = s; }
        }
        snap = best;
        drag = null;
        dragOffset = 0;
        sheetEl.releasePointerCapture(e.pointerId);
    }

    function cycleSnap() {
        snap = snap === 'closed' ? 'full' : snap === 'full' ? 'peek' : 'closed';
    }

    $: liveOffset = drag ? -dragOffset : 0;
</script>

<div
    class="sheet"
    class:closed={snap === 'closed'}
    class:peek={snap === 'peek'}
    class:full={snap === 'full'}
    style="--live-offset: {liveOffset}px"
    bind:this={sheetEl}
>
    <div
        class="grip"
        on:pointerdown={onHandlePointerDown}
        on:pointermove={onHandlePointerMove}
        on:pointerup={onHandlePointerUp}
        on:pointercancel={onHandlePointerUp}
        on:click={cycleSnap}
        on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycleSnap(); } }}
        role="button"
        tabindex="0"
    >
        <div class="bar"></div>
        <div class="title">
            {#if selected}
                {selected.name}
            {:else}
                Värld
            {/if}
        </div>
    </div>

    <div class="content">
        {#if selected}
            <section>
                <h3>Objekt</h3>
                <label>Namn
                    <input type="text" bind:value={selected.name} on:input={poke} />
                </label>
                <label>Färg
                    <input type="color" value={selected.color} on:input={(e) => setColor(e.target.value)} />
                </label>
                <label>Radie <span>{selected.radius}</span>
                    <input type="range" min="2" max="60" step="1" bind:value={selected.radius} on:input={poke} />
                </label>
                <label class="checkbox">
                    <input type="checkbox" checked={selected.attraction !== 0}
                        on:change={(e) => { selected.attraction = e.target.checked ? 1 : 0; poke(); }} />
                    Attraherar
                </label>
                {#if selected.trail}
                    <label>Svansstil
                        <select bind:value={selected.trail.style} on:change={poke}>
                            <option value="line">Linje</option>
                            <option value="particles">Partiklar</option>
                        </select>
                    </label>
                    <label>Trail-längd <span>{selected.trail.maxLength}</span>
                        <input type="range" min="0" max="5000" step="50" bind:value={selected.trail.maxLength} on:input={poke} />
                    </label>
                {/if}
                <hr />
                <label>Stil
                    <select on:change={(e) => { applyPreset(e.target.value); e.target.value = ''; }}>
                        <option value="">Egen…</option>
                        {#each Object.keys(PRESETS) as k}
                            <option value={k}>{k}</option>
                        {/each}
                    </select>
                </label>
                <label>Glow <span>{selected.glow.toFixed(2)}</span>
                    <input type="range" min="0" max="1" step="0.05" bind:value={selected.glow} on:input={poke} />
                </label>
                {#if selected.trail}
                    <label>Svans avsmalning <span>{selected.tailTaper.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.05" bind:value={selected.tailTaper} on:input={poke} />
                    </label>
                    <label>Svans fade <span>{selected.tailFade.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.05" bind:value={selected.tailFade} on:input={poke} />
                    </label>
                    <label>Fart-reaktion <span>{selected.speedReactivity.toFixed(2)}</span>
                        <input type="range" min="0" max="1" step="0.05" bind:value={selected.speedReactivity} on:input={poke} />
                    </label>
                {/if}
                <button class="danger" on:click={() => onDelete(selected)}>Ta bort</button>
            </section>
        {/if}

        <section>
            <h3>Värld</h3>
            <label>Acceleration <span>{settings.acceleration}</span>
                <input type="range" min="0" max="3000" step="50" bind:value={settings.acceleration} on:input={poke} />
            </label>
            <label>Max hastighet <span>{settings.maxSpeed}</span>
                <input type="range" min="0" max="3000" step="50" bind:value={settings.maxSpeed} on:input={poke} />
            </label>
        </section>
    </div>
</div>

<style>
    .sheet {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(36, 40, 40, 0.96);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-top: 1px solid var(--border);
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        z-index: 8;
        padding-bottom: env(safe-area-inset-bottom);
        transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
        max-height: 65dvh;
        display: flex;
        flex-direction: column;
        touch-action: none;
        transform: translateY(calc(100% - 80px + var(--live-offset, 0px)));
    }
    .sheet.closed {
        transform: translateY(calc(100% + var(--live-offset, 0px)));
    }
    .sheet.peek {
        transform: translateY(calc(100% - 80px + var(--live-offset, 0px)));
    }
    .sheet.full {
        transform: translateY(var(--live-offset, 0px));
    }

    .grip {
        flex: 0 0 auto;
        padding: 10px 16px 8px;
        cursor: grab;
        user-select: none;
        -webkit-user-select: none;
    }
    .grip:active { cursor: grabbing; }
    .grip .bar {
        width: 36px;
        height: 4px;
        background: var(--text-faint);
        border-radius: 2px;
        margin: 0 auto 6px;
    }
    .grip .title {
        text-align: center;
        font-size: 13px;
        color: var(--text);
        font-weight: 500;
    }

    .content {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 4px 16px 16px;
        touch-action: pan-y;
    }

    section + section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-soft);
    }

    h3 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-dim);
        margin-bottom: 8px;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 3px;
        color: var(--text-dim);
        font-size: 12px;
        margin-bottom: 10px;
    }

    label span {
        float: right;
        color: var(--cta);
    }

    label.checkbox {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }

    input[type="text"], input[type="color"], select {
        background: var(--bg-canvas);
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--text);
        padding: 6px 8px;
        width: 100%;
    }
    input[type="color"] { padding: 2px; height: 32px; cursor: pointer; }
    input[type="range"] { width: 100%; accent-color: var(--cta); }
    input[type="checkbox"] { accent-color: var(--cta); }

    hr {
        border: none;
        border-top: 1px solid var(--border-soft);
        margin: 6px 0;
    }

    button.danger {
        background: var(--surface);
        color: var(--accent);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 10px;
        cursor: pointer;
        min-height: 40px;
        width: 100%;
        font-weight: 500;
    }
    button.danger:hover { background: var(--border); }
</style>
