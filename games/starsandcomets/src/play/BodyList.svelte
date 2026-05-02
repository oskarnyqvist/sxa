<script>
    import { bodies } from '../stores/selection.js';
    import BodyCard from './BodyCard.svelte';

    export let onDelete = () => {};
</script>

<section>
    <h3>Kroppar ({$bodies.length})</h3>
    {#if $bodies.length === 0}
        <p class="empty">Inga kroppar — lägg till en stjärna eller komet ovan.</p>
    {:else}
        <div class="grid">
            {#each $bodies as body (body.id)}
                <BodyCard {body} {onDelete} />
            {/each}
        </div>
    {/if}
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
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 10px;
        align-items: start;
    }
    .empty {
        font-size: 13px;
        color: var(--text-faint);
        padding: 16px;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 6px;
    }
</style>
