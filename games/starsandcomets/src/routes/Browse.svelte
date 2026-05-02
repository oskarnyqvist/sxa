<script>
    import { onMount, onDestroy } from 'svelte';
    import { whoami, listLevels, loginUrl } from '../api.js';

    let state = 'loading';
    let levels = [];
    let titleEl;
    let rafId;

    onMount(async () => {
        startSunOrbit();
        try {
            const me = await whoami();
            if (!me.authenticated) { state = 'anon'; return; }
            levels = await listLevels();
            state = 'ok';
        } catch {
            state = 'error';
        }
    });

    onDestroy(() => cancelAnimationFrame(rafId));

    function startSunOrbit() {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const period = 11000;
        const rx = 4;
        const ry = 7;
        const start = performance.now();
        const tick = (now) => {
            if (!titleEl) { rafId = requestAnimationFrame(tick); return; }
            const θ = ((now - start) % period) / period * Math.PI * 2;
            const sx = -Math.sin(θ) * rx;
            const sy =  Math.cos(θ) * ry;
            titleEl.style.setProperty('--sx', `${sx.toFixed(2)}px`);
            titleEl.style.setProperty('--sy', `${sy.toFixed(2)}px`);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
    }
</script>

<div class="page">
    <header>
        <h1 class="title" bind:this={titleEl}>
            <span class="line">Stars</span>
            <span class="rule" aria-hidden="true">
                <span class="bar"></span>
                <span class="mark">✦</span>
                <span class="bar"></span>
            </span>
            <span class="line">Comets</span>
        </h1>
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
        padding: 32px 16px 24px;
        max-width: 640px;
        margin: 0 auto;
    }
    header { margin-bottom: 36px; }
    .title {
        --sx: 0px;
        --sy: 7px;
        text-align: center;
        line-height: 0.85;
        margin: 8px 0 12px;
        font-weight: 400;
        letter-spacing: 0.01em;
    }
    .title .line {
        display: block;
        position: relative;
        font-family: var(--font-display);
        font-size: clamp(64px, 16vw, 104px);
        color: var(--text);
        text-shadow:
            var(--sx) var(--sy) 0 var(--c-kofte),
            calc(var(--sx) * 1.8) calc(var(--sy) * 1.8) 0 var(--c-velvet);
    }
    .title .rule {
        display: flex;
        align-items: center;
        gap: 14px;
        margin: 4px 0;
    }
    .title .rule .bar {
        flex: 1;
        height: 2px;
        background: var(--c-albescent);
    }
    .title .rule .mark {
        font-family: var(--font-mono);
        font-size: 18px;
        color: var(--c-camel);
        line-height: 1;
        text-shadow:
            calc(var(--sx) * 0.4) calc(var(--sy) * 0.4) 0 var(--c-kofte);
    }


    .sub {
        text-align: center;
        font-family: var(--font-mono);
        font-size: 12px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--c-camel);
        margin-top: 8px;
    }
    h2 {
        font-family: var(--font-mono);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--text-dim);
        margin-bottom: 14px;
    }
    section { margin-bottom: 28px; }
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
    .cta.secondary {
        background: transparent;
        color: var(--cta);
        border-color: var(--cta);
        box-shadow: var(--br-shadow-deep);
    }
    .cta.secondary:active {
        box-shadow: 3px 3px 0 var(--c-mermaid);
    }
    .levels {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .levels li {
        background: var(--surface-soft);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: var(--br-border);
        box-shadow: var(--br-shadow-deep);
    }
    .levels a {
        display: block;
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
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.1em;
        color: var(--text-dim);
        margin-top: 6px;
    }
</style>
