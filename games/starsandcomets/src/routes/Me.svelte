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
        padding: 24px 16px 16px;
        max-width: 640px;
        margin: 0 auto;
    }
    header { margin-bottom: 24px; }
    h1 { font-size: 28px; font-weight: 600; color: #cdd6f4; }
    .sub { color: #6c7086; margin-top: 4px; }
    .empty {
        color: #45475a;
        font-size: 13px;
        padding: 24px;
        text-align: center;
        border: 1px dashed #313244;
        border-radius: 8px;
    }
    .cta {
        display: block;
        margin-top: 16px;
        padding: 14px 16px;
        text-align: center;
        background: #89b4fa;
        color: #11111b;
        font-weight: 600;
        text-decoration: none;
        border-radius: 8px;
    }
    .levels {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .levels li {
        display: flex;
        align-items: stretch;
        background: #11111b;
        border: 1px solid #313244;
        border-radius: 8px;
        overflow: hidden;
    }
    .levels a {
        flex: 1;
        padding: 14px 16px;
        text-decoration: none;
        color: #cdd6f4;
    }
    .title { display: block; font-weight: 600; font-size: 15px; }
    .desc { display: block; font-size: 12px; color: #6c7086; margin-top: 4px; }
    .del {
        background: transparent;
        color: #6c7086;
        border: none;
        border-left: 1px solid #313244;
        padding: 0 16px;
        font-size: 18px;
        cursor: pointer;
    }
    .del:hover { color: #f38ba8; }
</style>
