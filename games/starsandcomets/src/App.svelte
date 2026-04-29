<script>
    import Router, { location } from 'svelte-spa-router';
    import Browse from './routes/Browse.svelte';
    import New from './routes/New.svelte';
    import Me from './routes/Me.svelte';
    import Play from './routes/Play.svelte';

    const routes = {
        '/': Browse,
        '/new': New,
        '/me': Me,
        '/w/:id': Play,
        '*': Browse,
    };

    $: isPlay = $location.startsWith('/w/');
</script>

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
        background: #11111b;
        border-top: 1px solid #313244;
        padding-bottom: env(safe-area-inset-bottom);
    }

    .bottom-nav a {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: 10px 0;
        color: #6c7086;
        text-decoration: none;
        font-size: 11px;
        font-weight: 500;
    }

    .bottom-nav a.active {
        color: #89b4fa;
    }

    .bottom-nav .icon {
        font-size: 20px;
        line-height: 1;
    }
</style>
