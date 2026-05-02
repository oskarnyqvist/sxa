<script>
    import Router, { location } from 'svelte-spa-router';
    import Browse from './routes/Browse.svelte';
    import New from './routes/New.svelte';
    import Me from './routes/Me.svelte';
    import Play from './routes/Play.svelte';
    import Lab from './routes/Lab.svelte';
    import BackgroundCanvas from './BackgroundCanvas.svelte';

    const routes = {
        '/': Browse,
        '/new': New,
        '/me': Me,
        '/w/:id': Play,
        '/lab': Lab,
        '*': Browse,
    };

    $: isPlay = $location.startsWith('/w/');
</script>

<BackgroundCanvas active={!isPlay} />

<div class="app" class:immersive={isPlay}>
    <main class="view">
        <Router {routes} />
    </main>

    {#if !isPlay}
        <nav class="bottom-nav">
            <a href="#/" class:active={$location === '/'}>
                <span class="icon">✦</span>
                <span class="label">Utforska</span>
            </a>
            <a href="#/new" class:active={$location === '/new'}>
                <span class="icon">+</span>
                <span class="label">Skapa</span>
            </a>
            <a href="#/me" class:active={$location.startsWith('/me')}>
                <span class="icon">★</span>
                <span class="label">Mina</span>
            </a>
        </nav>
    {/if}
</div>

<style>
    .app {
        position: relative;
        z-index: 1;
        height: 100dvh;
        display: flex;
        flex-direction: column;
    }

    .view {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
    }

    .app.immersive .view {
        overflow: hidden;
    }

    .bottom-nav {
        flex: 0 0 auto;
        display: flex;
        background: var(--surface-soft);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-top: 2px solid var(--c-albescent);
        padding-bottom: env(safe-area-inset-bottom);
    }

    .bottom-nav a {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 12px 0 10px;
        color: var(--text-dim);
        text-decoration: none;
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        border-right: 2px solid var(--c-albescent);
        transition: color 0.1s, background 0.1s;
    }
    .bottom-nav a:last-child { border-right: none; }

    .bottom-nav a.active {
        color: var(--c-graphite);
        background: var(--cta);
    }

    .bottom-nav .icon {
        font-family: var(--font-display);
        font-size: 22px;
        line-height: 1;
    }
</style>
