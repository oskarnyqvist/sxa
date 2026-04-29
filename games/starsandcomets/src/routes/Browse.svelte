<script>
    import { onMount } from 'svelte';
    import { whoami, listLevels, loginUrl } from '../api.js';

    let state = 'loading';
    let levels = [];

    onMount(async () => {
        try {
            const me = await whoami();
            if (!me.authenticated) { state = 'anon'; return; }
            levels = await listLevels();
            state = 'ok';
        } catch {
            state = 'error';
        }
    });
</script>

<div class="page">
    <header>
        <h1>Stars &amp; Comets</h1>
        <p class="sub">Utforska världar</p>
    </header>

    {#if state === 'loading'}
        <p class="empty">Laddar…</p>
    {:else if state === 'anon'}
        <section>
            <h2>Kom igång</h2>
            <p class="empty">Logga in för att spara och dela världar.</p>
            <a class="cta secondary" href={loginUrl()}>Logga in med Google</a>
        </section>
    {:else if state === 'error'}
        <p class="empty">Kunde inte nå data.sxa.se.</p>
    {:else}
        <section>
            <h2>Mina senaste</h2>
            {#if levels.length === 0}
                <p class="empty">Inga sparade världar än.</p>
            {:else}
                <ul class="levels">
                    {#each levels.slice(0, 5) as level (level.id)}
                        <li>
                            <a href={`#/w/${level.id}`}>
                                <span class="title">{level.title || 'Namnlös'}</span>
                                <span class="desc">{new Date(level.updated_at).toLocaleDateString('sv-SE')}</span>
                            </a>
                        </li>
                    {/each}
                </ul>
            {/if}
        </section>
    {/if}

    <a class="cta" href="#/new">Skapa en ny värld</a>
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
    h2 {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6c7086;
        margin-bottom: 12px;
    }
    section { margin-bottom: 24px; }
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
    .cta.secondary {
        background: transparent;
        color: #89b4fa;
        border: 1px solid #89b4fa;
    }
    .levels {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .levels li {
        background: #11111b;
        border: 1px solid #313244;
        border-radius: 8px;
    }
    .levels a {
        display: block;
        padding: 14px 16px;
        text-decoration: none;
        color: #cdd6f4;
    }
    .title { display: block; font-weight: 600; font-size: 15px; }
    .desc { display: block; font-size: 12px; color: #6c7086; margin-top: 4px; }
</style>
