import { createToroidalWorld } from '../world/toroidal.js';
import { createSimulator }     from '../simulator.js';
import { createRenderer }      from '../renderer.js';
import { createLab }           from '../lab.js';

export function bootPlay({ canvas, worldPanel, speedSlider, speedValue, initial }) {
    const world    = createToroidalWorld({ width: initial.world.width, height: initial.world.height });
    const settings = { ...initial.settings };
    const sim      = createSimulator(world, settings);
    const ren      = createRenderer(canvas, world, settings);
    const lab      = createLab(canvas, sim, ren);

    worldPanel.innerHTML = `
        <label>Acceleration <span id="accel-value">${settings.acceleration}</span>
            <input id="accel-slider" type="range" min="0" max="3000" step="50" value="${settings.acceleration}" />
        </label>
        <label>Max hastighet <span id="maxspeed-value">${settings.maxSpeed}</span>
            <input id="maxspeed-slider" type="range" min="0" max="3000" step="50" value="${settings.maxSpeed}" />
        </label>
        <label>Attraktionsläge
            <select id="mode-select">
                <option value="nearest"     ${settings.attractionMode === 'nearest'     ? 'selected' : ''}>Närmast</option>
                <option value="all"         ${settings.attractionMode === 'all'         ? 'selected' : ''}>Alla lika</option>
                <option value="weighted"    ${settings.attractionMode === 'weighted'    ? 'selected' : ''}>Alla viktade</option>
                <option value="normalized"  ${settings.attractionMode === 'normalized'  ? 'selected' : ''}>Alla normaliserade</option>
                <option value="normalized2" ${settings.attractionMode === 'normalized2' ? 'selected' : ''}>Alla normaliserade²</option>
            </select>
        </label>
    `;
    worldPanel.querySelector('#accel-slider').addEventListener('input', e => {
        settings.acceleration = parseFloat(e.target.value);
        worldPanel.querySelector('#accel-value').textContent = settings.acceleration;
    });
    worldPanel.querySelector('#maxspeed-slider').addEventListener('input', e => {
        settings.maxSpeed = parseFloat(e.target.value);
        worldPanel.querySelector('#maxspeed-value').textContent = settings.maxSpeed;
    });
    worldPanel.querySelector('#mode-select').addEventListener('change', e => {
        settings.attractionMode = e.target.value;
    });

    for (const body of initial.bodies) sim.addBody(body);
    ren.setCamera({ x: world.width / 2, y: world.height / 2, zoom: 1 });

    let timeScale = 1;
    function onSpeed() {
        timeScale = parseFloat(speedSlider.value);
        speedValue.textContent = `${timeScale.toFixed(2)}x`;
    }
    speedSlider.addEventListener('input', onSpeed);

    let raf;
    let last = performance.now();
    function loop(now) {
        const dt = Math.min((now - last) / 1000, 0.05) * timeScale;
        last = now;
        if (!lab.isEditing()) sim.tick(dt);
        ren.draw(sim.bodies, now);
        lab.drawOverlay(canvas.getContext('2d'));
        raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const teardown = () => {
        cancelAnimationFrame(raf);
        speedSlider.removeEventListener('input', onSpeed);
    };

    return { teardown, lab, sim, ren, world, settings };
}
