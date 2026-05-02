<script>
    import { selected } from '../stores/selection.js';

    export let settings;
    export let onDelete = () => {};
</script>

<div class="panel">
    <header>
        <h2>Redigera</h2>
        <p class="hint">Sektioner kommer hit i kommande steg.</p>
    </header>

    {#if $selected}
        <p class="placeholder">Markerad: <strong>{$selected.name}</strong></p>
    {:else}
        <p class="placeholder dim">Inget markerat.</p>
    {/if}
</div>

<style>
    .panel {
        padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
        color: var(--text);
    }
    header { margin-bottom: 16px; }
    h2 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-dim);
    }
    .hint {
        font-size: 12px;
        color: var(--text-faint);
        margin-top: 4px;
    }
    .placeholder {
        font-size: 14px;
        color: var(--text);
    }
    .placeholder.dim { color: var(--text-dim); }
</style>
