<script>
    import { onMount, onDestroy } from 'svelte';
    import { selected as selectedStore } from '../stores/selection.js';
    import { recentMaxSpeed } from '../simulator.js';
    import { randomBodyColor } from './colors.js';

    export let body;
    export let onDelete = () => {};

    let cardEl;
    let stats = readStats(body);
    let intervalId;

    function readStats(b) {
        if (!b?.stats) return { maxSpeed: 0, age: 0, closest: Infinity, distance: 0 };
        return {
            maxSpeed: recentMaxSpeed(b),
            age: b.stats.age,
            closest: b.stats.closestApproach,
            distance: b.stats.totalDistance,
        };
    }

    onMount(() => {
        intervalId = setInterval(() => { stats = readStats(body); }, 250);
    });
    onDestroy(() => clearInterval(intervalId));

    function formatLength(n) {
        if (!isFinite(n)) return '—';
        if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
        return Math.round(n).toString();
    }
    function formatAge(s) {
        if (s < 60) return `${s.toFixed(1)}s`;
        const m = Math.floor(s / 60);
        const r = Math.floor(s % 60);
        return `${m}m ${r}s`;
    }

    // Re-evaluate when the store fires (covers handle-drag mutating this body).
    $: $selectedStore;

    $: isSelected = body === $selectedStore;
    $: kind = body.pinned ? 'star' : 'comet';

    // Scroll the selected card into view when canvas tap selects a body off-screen.
    $: if (isSelected && cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function poke() { selectedStore.set($selectedStore); }

    function selectThis() {
        selectedStore.set(body);
    }

    function onKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectThis();
        }
    }

    function setColor(value) {
        body.color = value;
        if (body.trail) body.trail.color = value;
        poke();
    }

    function randomize() {
        setColor(randomBodyColor());
        body.glow = Math.random();
        if (body.trail) {
            body.tailFade = 0.5 + Math.random() * 0.5;
            body.tailTaper = 0.5 + Math.random() * 0.5;
        }
        poke();
    }
</script>

<div
    bind:this={cardEl}
    class="card"
    class:selected={isSelected}
    class:expanded={isSelected}
    on:click={selectThis}
    on:keydown={onKeydown}
    role="button"
    tabindex="0"
>
    <header>
        <span class="dot" style="background: {body.color}"></span>
        <input type="text" class="name" bind:value={body.name} on:input={poke} on:click|stopPropagation />
        {#if isSelected}
            <button type="button" class="dice" on:click|stopPropagation={randomize} aria-label="Slumpa känsla">🎲</button>
        {/if}
        {#if body.lifted}
            <span class="badge">Pausad</span>
        {:else}
            <span class="kind">{kind}</span>
        {/if}
    </header>

    {#if !isSelected}
        <div class="quick">
            <span class="qstat">{Math.round(stats.maxSpeed)} <em>v</em></span>
            <span class="qstat">{formatAge(stats.age)}</span>
        </div>
    {:else}
        <div class="grid">
            <label>
                <span class="row"><span>Storlek</span><span class="val">{body.radius}</span></span>
                <input type="range" min="2" max="60" step="1" bind:value={body.radius} on:input={poke} />
            </label>

            <label>
                <span class="row"><span>Färg</span></span>
                <input type="color" value={body.color} on:input={(e) => setColor(e.target.value)} />
            </label>

            <label class="checkbox">
                <input type="checkbox" checked={body.attraction !== 0}
                    on:change={(e) => { body.attraction = e.target.checked ? 1 : 0; poke(); }} />
                <span>Attraherar</span>
            </label>
        </div>

        <dl class="stats">
            <dt>Hastighet</dt><dd>{Math.round(stats.maxSpeed)}</dd>
            <dt>Närmsta</dt><dd>{formatLength(stats.closest)}</dd>
            <dt>Ålder</dt><dd>{formatAge(stats.age)}</dd>
            <dt>Sträcka</dt><dd>{formatLength(stats.distance)}</dd>
        </dl>

        <button type="button" class="danger" on:click|stopPropagation={() => onDelete(body)}>Ta bort</button>
    {/if}
</div>

<style>
    .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
    }
    .card.expanded { padding: 12px; cursor: default; }
    .card.selected {
        border-color: var(--cta);
        box-shadow: 0 0 0 1px var(--cta);
    }
    header {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .card.expanded header { margin-bottom: 10px; }

    .quick {
        display: flex;
        gap: 12px;
        margin-top: 6px;
        font-size: 11px;
        color: var(--text-faint);
        font-variant-numeric: tabular-nums;
    }
    .qstat em { font-style: normal; color: var(--text-dim); margin-left: 2px; }
    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex: 0 0 auto;
    }
    .name {
        flex: 1;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        padding: 2px 4px;
        color: var(--text);
        font: inherit;
        font-weight: 600;
        min-width: 0;
    }
    .name:focus {
        outline: none;
        border-color: var(--border);
    }
    .kind {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-faint);
    }
    .dice {
        background: transparent;
        border: none;
        color: var(--text-dim);
        cursor: pointer;
        font-size: 14px;
        padding: 2px 6px;
        line-height: 1;
    }
    .dice:hover { color: var(--cta); }
    .badge {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--cta-text);
        background: var(--cta);
        padding: 2px 6px;
        border-radius: 4px;
    }
    .grid {
        display: grid;
        gap: 10px;
    }
    label {
        font-size: 12px;
        color: var(--text-dim);
        display: block;
    }
    .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
    }
    .val { color: var(--cta); font-variant-numeric: tabular-nums; }
    label.checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
    }
    input[type="range"] { width: 100%; accent-color: var(--cta); }
    input[type="color"] {
        width: 100%;
        height: 32px;
        background: var(--bg-canvas);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 2px;
        cursor: pointer;
    }
    input[type="checkbox"] { accent-color: var(--cta); }

    .stats {
        margin-top: 12px;
        display: grid;
        grid-template-columns: auto 1fr auto 1fr;
        column-gap: 8px;
        row-gap: 4px;
        font-size: 11px;
        font-variant-numeric: tabular-nums;
    }
    .stats dt { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.08em; }
    .stats dd { color: var(--text); }

    .danger {
        margin-top: 12px;
        width: 100%;
        background: transparent;
        color: var(--accent);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px;
        cursor: pointer;
        font: inherit;
    }
    .danger:hover { background: var(--border); }
</style>
