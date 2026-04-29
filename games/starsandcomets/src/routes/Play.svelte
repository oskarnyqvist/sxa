<script>
    import { onMount, onDestroy } from 'svelte';
    import { replace } from 'svelte-spa-router';
    import { bootPlay } from '../play/boot.js';
    import { defaultDraft } from '../play/presets.js';
    import { serialize, deserialize } from '../world/serialize.js';
    import { getLevel, createLevel, updateLevel, whoami, loginUrl } from '../api.js';

    export let params = {};

    let canvas;
    let worldPanel;
    let speedSlider;
    let speedValue;
    let panelOpen = false;
    let isEditing = false;
    let mode = 'select';
    let lab;
    let sim;
    let world;
    let settings;
    let teardown;

    let loadState = 'loading';
    let loadError = null;
    let levelMeta = { id: null, title: '', description: '' };
    let saveState = 'idle';

    $: isDraft = params.id === 'draft';

    onMount(async () => {
        try {
            const raw = await loadRaw(params.id);
            const initial = deserialize(raw);
            levelMeta = {
                id: isDraft ? null : params.id,
                title: raw.title || '',
                description: raw.description || '',
            };
            const boot = bootPlay({ canvas, worldPanel, speedSlider, speedValue, initial });
            lab = boot.lab;
            sim = boot.sim;
            world = boot.world;
            settings = boot.settings;
            teardown = boot.teardown;
            lab.setEnabled(false);
            loadState = 'ok';
        } catch (e) {
            loadError = e.message;
            loadState = 'error';
        }
    });

    onDestroy(() => {
        teardown?.();
    });

    async function loadRaw(id) {
        if (id === 'draft') {
            const stored = sessionStorage.getItem('starsandcomets:draft');
            return stored ? JSON.parse(stored) : defaultDraft();
        }
        const level = await getLevel(id);
        return { ...level.data, title: level.title, description: level.description };
    }

    function toggleEdit() {
        isEditing = !isEditing;
        panelOpen = false;
        lab?.setEnabled(isEditing);
        if (!isEditing) selectMode('select');
    }

    function selectMode(m) {
        mode = m;
        lab?.setMode(m);
    }

    async function onSave() {
        if (!sim) return;
        saveState = 'saving';
        try {
            const me = await whoami();
            if (!me.authenticated) {
                if (confirm('Du behöver logga in för att spara. Gå till login?')) {
                    location.href = loginUrl();
                }
                saveState = 'idle';
                return;
            }
            const data = serialize({ world, settings, bodies: sim.bodies });
            if (isDraft) {
                const title = prompt('Namn på världen:', levelMeta.title || 'Min värld');
                if (!title) { saveState = 'idle'; return; }
                const created = await createLevel({ title, data });
                sessionStorage.removeItem('starsandcomets:draft');
                replace(`/w/${created.id}`);
            } else {
                await updateLevel(levelMeta.id, {
                    title: levelMeta.title,
                    description: levelMeta.description,
                    data,
                    schema_version: data.schema_version,
                });
            }
            saveState = 'saved';
            setTimeout(() => { if (saveState === 'saved') saveState = 'idle'; }, 1500);
        } catch (e) {
            alert('Kunde inte spara: ' + e.message);
            saveState = 'idle';
        }
    }
</script>

<div class="play" class:editing={isEditing}>
    <canvas id="canvas" bind:this={canvas}></canvas>

    {#if loadState === 'loading'}
        <div class="overlay">Laddar…</div>
    {:else if loadState === 'error'}
        <div class="overlay error">
            Kunde inte ladda: {loadError}
            <a href="#/">Tillbaka</a>
        </div>
    {/if}

    <div class="hud-top">
        <a class="hud-btn back" href="#/" aria-label="Tillbaka">←</a>

        {#if isEditing}
            <div id="toolbar" class="modes">
                <button class:active={mode === 'select'}   on:click={() => selectMode('select')}>Markera</button>
                <button class:active={mode === 'addStar'}  on:click={() => selectMode('addStar')}>+ Star</button>
                <button class:active={mode === 'addComet'} on:click={() => selectMode('addComet')}>+ Comet</button>
                <button class:active={mode === 'edit'}     on:click={() => selectMode('edit')}>Verktyg</button>
            </div>
            <button class="hud-btn settings" on:click={() => panelOpen = !panelOpen} aria-label="Inställningar">⚙</button>
        {:else}
            <button class="hud-btn save" on:click={onSave} disabled={saveState === 'saving' || loadState !== 'ok'}>
                {#if saveState === 'saving'}Sparar…{:else if saveState === 'saved'}✓ Sparat{:else}{isDraft ? 'Spara' : 'Uppdatera'}{/if}
            </button>
            <button class="hud-btn edit" on:click={toggleEdit} disabled={loadState !== 'ok'}>✎ Redigera</button>
        {/if}
    </div>

    {#if isEditing}
        <button class="hud-done" on:click={toggleEdit}>✓ Klar</button>
    {/if}

    <div class="hud-speed">
        <input bind:this={speedSlider} type="range" min="0" max="2" step="0.05" value="1" />
        <span bind:this={speedValue}>1.00x</span>
    </div>

    <aside id="panel" class:open={panelOpen} class:available={isEditing}>
        <div class="panel-head">
            <h3>Värld</h3>
            <button class="panel-close" on:click={() => panelOpen = false} aria-label="Stäng">×</button>
        </div>
        <div id="world-panel" bind:this={worldPanel}></div>
        <h3>Objekt</h3>
        <div id="body-panel"><p class="empty">Inget markerat</p></div>
    </aside>
</div>

<style>
    .play {
        position: relative;
        height: 100%;
        overflow: hidden;
    }

    #canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: grab;
    }

    #canvas:active {
        cursor: grabbing;
    }

    .play.editing #canvas {
        cursor: default;
    }

    .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: rgba(17, 17, 27, 0.9);
        color: #cdd6f4;
        z-index: 10;
    }
    .overlay.error { color: #f38ba8; }
    .overlay a { color: #89b4fa; }

    .hud-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 10px;
        padding-top: calc(10px + env(safe-area-inset-top));
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 5;
        pointer-events: none;
    }

    .hud-top > * {
        pointer-events: auto;
    }

    :global(.hud-top .hud-btn),
    :global(.hud-top a.hud-btn),
    :global(.hud-top button.hud-btn) {
        background: rgba(17, 17, 27, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #cdd6f4;
        border: 1px solid #313244;
        border-radius: 999px;
        height: 40px;
        min-width: 40px;
        padding: 0 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        gap: 6px;
    }

    :global(.hud-top .hud-btn:disabled) {
        opacity: 0.5;
        cursor: not-allowed;
    }

    :global(.hud-top .hud-btn.back) {
        font-size: 20px;
        padding: 0;
    }

    .hud-top .hud-btn.save {
        margin-left: auto;
    }

    .hud-top .hud-btn.settings {
        margin-left: auto;
    }

    .hud-done {
        position: absolute;
        top: calc(60px + env(safe-area-inset-top));
        right: 10px;
        z-index: 6;
        background: #89b4fa;
        color: #11111b;
        border: none;
        border-radius: 999px;
        height: 40px;
        padding: 0 16px;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
    }

    .hud-speed {
        position: absolute;
        bottom: calc(12px + env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        background: rgba(17, 17, 27, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid #313244;
        border-radius: 999px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 5;
    }

    .hud-speed input[type="range"] {
        width: 140px;
        accent-color: #89b4fa;
    }

    .hud-speed span {
        color: #89b4fa;
        font-size: 12px;
        min-width: 38px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }

    :global(.hud-top #toolbar.modes) {
        display: flex;
        gap: 4px;
        background: rgba(17, 17, 27, 0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid #313244;
        border-radius: 999px;
        padding: 4px;
        overflow-x: auto;
        scrollbar-width: none;
        flex-shrink: 1;
        min-width: 0;
    }
    :global(.hud-top #toolbar.modes::-webkit-scrollbar) { display: none; }

    :global(.hud-top #toolbar.modes button) {
        background: transparent;
        color: #9399b2;
        border: none;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 13px;
        white-space: nowrap;
        cursor: pointer;
        min-height: 32px;
    }
    :global(.hud-top #toolbar.modes button:hover) { color: #cdd6f4; }
    :global(.hud-top #toolbar.modes button.active) {
        background: #313244;
        color: #cdd6f4;
    }

    :global(#panel:not(.available)) {
        display: none;
    }
</style>
