<script>
    import { replace } from 'svelte-spa-router';
    import { defaultDraft } from '../play/presets.js';
    import { serialize, deserialize } from '../world/serialize.js';
    import { getLevel, createLevel, updateLevel, whoami, loginUrl } from '../api.js';
    import { selected, lifted } from '../stores/selection.js';
    import PlayCanvas from '../play/PlayCanvas.svelte';
    import EditPanel from '../play/EditPanel.svelte';

    export let params = {};

    let canvasEl = null;
    let lab = null;
    let sim = null;
    let world = null;
    let settings = null;
    let setTimeScale = () => {};

    let initial = null;
    let mode = 'edit'; // 'view' | 'edit'
    let timeScale = 1;

    let loadState = 'loading';
    let loadError = null;
    let levelMeta = { id: null, title: '', description: '' };
    let saveState = 'idle';

    $: isDraft = params.id === 'draft';

    // In edit mode the selected body is also lifted out of physics so the user
    // can pose/edit without it flying away. View mode releases everything.
    $: if (mode === 'edit') lifted.set($selected);
    $: if (mode === 'view') lifted.set(null);

    (async () => {
        try {
            const raw = await loadRaw(params.id);
            levelMeta = {
                id: isDraft ? null : params.id,
                title: raw.title || '',
                description: raw.description || '',
            };
            initial = deserialize(raw);
            loadState = 'ok';
        } catch (e) {
            loadError = e.message;
            loadState = 'error';
        }
    })();

    async function loadRaw(id) {
        if (id === 'draft') {
            const stored = sessionStorage.getItem('starsandcomets:draft');
            return stored ? JSON.parse(stored) : defaultDraft();
        }
        const level = await getLevel(id);
        return { ...level.data, title: level.title, description: level.description };
    }

    function deleteBody(body) {
        lab?.removeBody(body);
    }

    function spawn(type) {
        lab?.spawnAtCenter(type);
    }

    function toggleMode() {
        mode = mode === 'edit' ? 'view' : 'edit';
        lab?.setEnabled(mode === 'edit');
        if (mode === 'view') {
            selected.set(null);
        }
    }

    function onSpeedInput(e) {
        timeScale = parseFloat(e.target.value);
        setTimeScale(timeScale);
    }

    function resetSpeed() {
        timeScale = 1;
        setTimeScale(1);
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

<div class="play" class:view={mode === 'view'} class:edit={mode === 'edit'}>
    <div class="canvas-area">
        {#if initial}
            <PlayCanvas
                {initial}
                bind:canvasEl
                bind:lab
                bind:sim
                bind:world
                bind:settings
                bind:setTimeScale
            />
        {/if}

        <div class="hud-speed">
            <input type="range" min="0" max="2" step="0.05" value={timeScale}
                list="speed-snaps"
                on:input={onSpeedInput} on:dblclick={resetSpeed} />
            <datalist id="speed-snaps">
                <option value="0"></option>
                <option value="0.5"></option>
                <option value="1"></option>
                <option value="2"></option>
            </datalist>
            <span>{timeScale.toFixed(2)}x</span>
        </div>
    </div>

    {#if mode === 'edit' && settings}
        <div class="panel-area">
            <EditPanel bind:settings onSpawn={spawn} onDelete={deleteBody} />
        </div>
    {/if}

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
        <button class="hud-btn mode" on:click={toggleMode}>
            {mode === 'edit' ? 'Visa' : 'Redigera'}
        </button>
        <button class="hud-btn fit" on:click={() => lab?.recenter()} aria-label="Centrera">⊕</button>
        <button class="hud-btn save" on:click={onSave} disabled={saveState === 'saving' || loadState !== 'ok'}>
            {#if saveState === 'saving'}Sparar…{:else if saveState === 'saved'}✓ Sparat{:else}{isDraft ? 'Spara' : 'Uppdatera'}{/if}
        </button>
    </div>
</div>

<style>
    .play {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .canvas-area {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
    }

    .play.edit .canvas-area {
        flex: 0 0 var(--canvas-edit-height, 50dvh);
    }

    .panel-area {
        flex: 1 1 auto;
        min-height: 0;
        overflow-y: auto;
        touch-action: pan-y;
        background: var(--bg);
    }

    .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: rgba(36, 40, 40, 0.9);
        color: var(--text);
        z-index: 10;
    }
    .overlay.error { color: var(--accent); }
    .overlay a { color: var(--link); }

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
        background: var(--surface-glass);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: var(--text);
        border: 1px solid var(--border);
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

    .hud-speed {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface-glass);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 5;
    }

    .hud-speed input[type="range"] {
        width: 140px;
        accent-color: var(--cta);
    }

    .hud-speed span {
        color: var(--cta);
        font-size: 12px;
        min-width: 38px;
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
</style>
