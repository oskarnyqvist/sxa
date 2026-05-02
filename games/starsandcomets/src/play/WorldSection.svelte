<script>
    export let settings;

    function poke() { settings = settings; } // re-trigger reactive expressions reading settings
</script>

<section>
    <h3>Värld</h3>
    <label>
        <span class="row"><span>Acceleration</span><span class="val">{settings.acceleration}</span></span>
        <input type="range" min="0" max="3000" step="50" bind:value={settings.acceleration} on:input={poke} />
    </label>
    <label>
        <span class="row"><span>Max hastighet</span><span class="val">{settings.maxSpeed}</span></span>
        <input type="range" min="0" max="3000" step="50" bind:value={settings.maxSpeed} on:input={poke} />
    </label>
</section>

<style>
    section { margin-bottom: 20px; }
    h3 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-dim);
        margin-bottom: 10px;
    }
    label {
        display: block;
        margin-bottom: 12px;
        font-size: 12px;
        color: var(--text-dim);
    }
    .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
    }
    .val { color: var(--cta); font-variant-numeric: tabular-nums; }
    input[type="range"] { width: 100%; accent-color: var(--cta); }
</style>
