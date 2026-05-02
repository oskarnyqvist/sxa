<script>
    import { onMount, onDestroy } from 'svelte';
    import { bootPlay } from './boot.js';

    export let initial;

    // Bound back to the parent so it can call lab/sim/world/settings APIs.
    export let canvasEl = null;
    export let lab = null;
    export let sim = null;
    export let world = null;
    export let settings = null;
    export let setTimeScale = () => {};

    let canvas;
    let teardown;

    onMount(() => {
        const boot = bootPlay({ canvas, initial });
        canvasEl = canvas;
        lab = boot.lab;
        sim = boot.sim;
        world = boot.world;
        settings = boot.settings;
        setTimeScale = boot.setTimeScale;
        teardown = boot.teardown;
        if (import.meta.env.DEV) {
            window.__play = { sim: boot.sim, lab: boot.lab, world: boot.world, settings: boot.settings, ren: boot.ren };
        }
    });

    onDestroy(() => {
        teardown?.();
    });
</script>

<canvas bind:this={canvas}></canvas>

<style>
    canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: default;
    }
</style>
