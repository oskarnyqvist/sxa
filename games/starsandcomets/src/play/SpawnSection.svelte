<script>
    export let onSpawn = () => {};
</script>

<section>
    <h3>Lägg till</h3>
    <div class="row">
        <button type="button" on:click={() => onSpawn('star')}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path fill="#CEA158" d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z"/>
            </svg>
            <span>Stjärna</span>
        </button>
        <button type="button" on:click={() => onSpawn('comet')}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <circle cx="17" cy="7" r="4" fill="#3983B1"/>
                <path d="M14 10 L4 20" stroke="#3983B1" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
            </svg>
            <span>Komet</span>
        </button>
    </div>
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
    .row {
        display: flex;
        gap: 10px;
    }
    button {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: var(--surface);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 8px;
        font: inherit;
        cursor: pointer;
    }
    button:hover { background: var(--border); }
    button:active { transform: translateY(1px); }
</style>
