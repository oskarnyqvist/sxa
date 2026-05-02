<script>
    import WorldSection from './WorldSection.svelte';
    import SpawnSection from './SpawnSection.svelte';
    import BodyList from './BodyList.svelte';

    export let settings;
    export let onSpawn = () => {};
    export let onDelete = () => {};
</script>

<div class="panel">
    <SpawnSection {onSpawn} />
    <WorldSection bind:settings />
    <BodyList {onDelete} />
</div>

<style>
    .panel {
        padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
        color: var(--text);
    }
</style>
