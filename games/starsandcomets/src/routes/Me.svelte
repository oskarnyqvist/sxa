<script>
    import { onMount } from 'svelte';
    import { whoami, listLevels, loginUrl, deleteLevel } from '../api.js';

    let state = 'loading';
    let user = null;
    let levels = [];
    let error = null;

    onMount(load);

    async function load() {
        state = 'loading';
        try {
            const me = await whoami();
            if (!me.authenticated) { state = 'anon'; return; }
            user = me;
            levels = await listLevels();
            state = 'ok';
        } catch (e) {
            error = e.message;
            state = 'error';
        }
    }

    async function onDelete(level) {
        if (!confirm(`Ta bort "${level.title}"?`)) return;
        try {
            await deleteLevel(level.id);
            levels = levels.filter(l => l.id !== level.id);
        } catch (e) {
            alert('Kunde inte ta bort: ' + e.message);
        }
    }
</script>

<div class="page">
    <header>
        <h1>Mina världar</h1>
        {#if state === 'ok'}
            <p class="sub">{user.email}</p>
        {:else}
            <p class="sub">Logga in för att spara och dela</p>
        {/if}
    </header>

    {#if state === 'loading'}
        <p class="empty">Laddar…</p>
    {:else if state === 'anon'}
        <a class="cta" href={loginUrl()}>Logga in med Google</a>
    {:else if state === 'error'}
        <p class="empty">Fel: {error}</p>
    {:else if levels.length === 0}
        <p class="empty">Du har inga sparade världar än.</p>
        <a class="cta" href="#/new">Skapa en värld</a>
    {:else}
        <ul class="levels">
            {#each levels as level (level.id)}
                <li>
                    <a href={`#/w/${level.id}`}>
                        <span class="title">{level.title || 'Namnlös'}</span>
                        <span class="desc">{level.description || '—'}</span>
                    </a>
                    <button class="del" on:click={() => onDelete(level)} aria-label="Ta bort">×</button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .page {
        padding: 32px 16px 24px;
        max-width: 640px;
        margin: 0 auto;
    }
    header { margin-bottom: 32px; }
    h1 {
        font-family: var(--font-display);
        font-size: 44px;
        font-weight: 400;
        line-height: 1.05;
        color: var(--text);
        letter-spacing: -0.01em;
    }
    .sub {
        font-family: var(--font-mono);
        font-size: 12px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--c-camel);
        margin-top: 8px;
    }
    .empty {
        color: var(--text-faint);
        font-size: 13px;
        padding: 24px;
        text-align: center;
        border: var(--br-border-dim);
        border-style: dashed;
    }
    .cta {
        display: block;
        margin-top: 20px;
        padding: 14px 16px;
        text-align: center;
        background: var(--cta);
        color: var(--cta-text);
        font-weight: 700;
        text-decoration: none;
        border: 2px solid var(--c-graphite);
        box-shadow: var(--br-shadow-warm);
        transition: transform 0.08s, box-shadow 0.08s;
    }
    .cta:active {
        transform: translate(2px, 2px);
        box-shadow: 3px 3px 0 var(--c-kofte);
    }
    .levels {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .levels li {
        display: flex;
        align-items: stretch;
        background: var(--surface-soft);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: var(--br-border);
        box-shadow: var(--br-shadow-deep);
    }
    .levels a {
        flex: 1;
        padding: 14px 16px;
        text-decoration: none;
        color: var(--text);
    }
    .title {
        display: block;
        font-family: var(--font-display);
        font-weight: 400;
        font-size: 20px;
        line-height: 1.2;
    }
    .desc {
        display: block;
        font-size: 13px;
        color: var(--text-dim);
        margin-top: 4px;
    }
    .del {
        background: transparent;
        color: var(--text-dim);
        border: none;
        border-left: 2px solid var(--c-albescent);
        padding: 0 16px;
        font-size: 22px;
        cursor: pointer;
        font-family: var(--font-mono);
    }
    .del:hover { color: var(--accent); }
</style>
