<script>
    import { push } from 'svelte-spa-router';
    import { defaultDraft } from '../play/presets.js';

    function startDraft() {
        sessionStorage.setItem('starsandcomets:draft', JSON.stringify(defaultDraft()));
        push('/w/draft');
    }
</script>

<div class="page">
    <header>
        <h1>Skapa värld</h1>
        <p class="sub">Välj en mall att börja från</p>
    </header>

    <ul class="presets">
        <li>
            <button type="button" on:click={startDraft}>
                <span class="title">Klassisk binär</span>
                <span class="desc">Två stjärnor, två kometer</span>
            </button>
        </li>
        <li class="disabled">
            <span class="title">Tom värld</span>
            <span class="desc">Kommer snart</span>
        </li>
    </ul>
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
    .presets {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .presets li {
        display: block;
    }
    .presets button,
    .presets li.disabled {
        display: block;
        width: 100%;
        text-align: left;
        padding: 18px;
        background: var(--surface-soft);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: var(--br-border);
        color: var(--text);
        font: inherit;
        cursor: pointer;
        box-shadow: var(--br-shadow-bloom);
        transition: transform 0.08s, box-shadow 0.08s;
    }
    .presets button:active {
        transform: translate(2px, 2px);
        box-shadow: 3px 3px 0 var(--c-velvet);
    }
    .presets li.disabled {
        color: var(--text-faint);
        cursor: not-allowed;
        box-shadow: var(--br-shadow-deep);
        opacity: 0.7;
    }
    .title {
        display: block;
        font-family: var(--font-display);
        font-weight: 400;
        font-size: 22px;
        line-height: 1.2;
    }
    .desc {
        display: block;
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.1em;
        color: var(--text-dim);
        margin-top: 6px;
        text-transform: uppercase;
    }
</style>
