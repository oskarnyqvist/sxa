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
        padding: 24px 16px 16px;
        max-width: 640px;
        margin: 0 auto;
    }
    header { margin-bottom: 24px; }
    h1 { font-size: 28px; font-weight: 600; color: #cdd6f4; }
    .sub { color: #6c7086; margin-top: 4px; }
    .presets {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .presets li {
        display: block;
    }
    .presets button,
    .presets li.disabled {
        display: block;
        width: 100%;
        text-align: left;
        padding: 16px;
        background: #11111b;
        border: 1px solid #313244;
        border-radius: 8px;
        color: #cdd6f4;
        font: inherit;
        cursor: pointer;
    }
    .presets button:hover { border-color: #89b4fa; }
    .presets li.disabled {
        color: #45475a;
        cursor: not-allowed;
    }
    .title { display: block; font-weight: 600; font-size: 15px; }
    .desc { display: block; font-size: 12px; color: #6c7086; margin-top: 4px; }
</style>
