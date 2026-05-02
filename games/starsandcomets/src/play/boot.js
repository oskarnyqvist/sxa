import { createToroidalWorld } from '../world/toroidal.js';
import { createSimulator }     from '../simulator.js';
import { createRenderer }      from '../renderer.js';
import { createLab }           from '../lab.js';

export function bootPlay({ canvas, initial }) {
    const world    = createToroidalWorld({ width: initial.world.width, height: initial.world.height });
    const settings = { ...initial.settings };
    const sim      = createSimulator(world, settings);
    const ren      = createRenderer(canvas, world, settings);
    const lab      = createLab(canvas, sim, ren);

    for (const body of initial.bodies) sim.addBody(body);
    ren.setCamera({ x: world.width / 2, y: world.height / 2, zoom: 1 });

    let timeScale = 1;
    let raf;
    let last = performance.now();
    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05) * timeScale;
        last = now;
        if (!lab.isPaused()) sim.tick(dt);
        ren.draw(sim.bodies, now);
        lab.drawOverlay(canvas.getContext('2d'));
        raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    function setTimeScale(n) { timeScale = n; }

    function teardown() {
        cancelAnimationFrame(raf);
        lab.teardown();
    }

    return { teardown, setTimeScale, lab, sim, ren, world, settings };
}
