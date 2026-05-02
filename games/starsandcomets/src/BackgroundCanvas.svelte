<script>
    import { onMount, onDestroy } from 'svelte';
    import { createToroidalWorld } from './world/toroidal.js';
    import { createSimulator } from './simulator.js';
    import { createRenderer } from './renderer.js';
    import { ambientWorld } from './play/presets.js';

    export let active = true;

    let canvas;
    let raf = null;
    let sim, ren;
    let last = 0;

    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        sim.tick(dt);
        ren.draw(sim.bodies, now);
        raf = requestAnimationFrame(loop);
    }

    function start() {
        if (raf || !sim) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
    }

    function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
    }

    function onVis() {
        if (document.hidden) stop();
        else if (active) start();
    }

    onMount(() => {
        const initial = ambientWorld();
        const world = createToroidalWorld({ width: initial.world.width, height: initial.world.height });
        const settings = { ...initial.settings };
        sim = createSimulator(world, settings);
        ren = createRenderer(canvas, world, settings);
        for (const body of initial.bodies) sim.addBody(body);
        ren.fitTo(sim.bodies, window.innerWidth, window.innerHeight, 1.4);
        document.addEventListener('visibilitychange', onVis);
        if (active) start();
    });

    onDestroy(() => {
        stop();
        document.removeEventListener('visibilitychange', onVis);
    });

    $: if (sim) {
        if (active && !document.hidden) start();
        else stop();
    }
</script>

<canvas bind:this={canvas} class:hidden={!active}></canvas>

<style>
    canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
        display: block;
    }
    canvas.hidden { display: none; }
</style>
