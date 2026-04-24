import './style.css';
import { createToroidalWorld }  from './src/world/toroidal.js';
import { createSimulator }      from './src/simulator.js';
import { createRenderer }       from './src/renderer.js';
import { createLab }            from './src/lab.js';
import { createStar, createComet } from './src/bodies.js';

const canvas = document.getElementById('canvas');
const world  = createToroidalWorld({ width: 4000, height: 4000 });
const settings = { acceleration: 800, maxSpeed: 600 };
const sim    = createSimulator(world, settings);
const ren    = createRenderer(canvas, world);
const lab    = createLab(canvas, sim, ren);

const worldPanel = document.getElementById('world-panel');
worldPanel.innerHTML = `
    <label>Acceleration <span id="accel-value">${settings.acceleration}</span>
        <input id="accel-slider" type="range" min="0" max="3000" step="50" value="${settings.acceleration}" />
    </label>
    <label>Max hastighet <span id="maxspeed-value">${settings.maxSpeed}</span>
        <input id="maxspeed-slider" type="range" min="0" max="3000" step="50" value="${settings.maxSpeed}" />
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

// Startscen
sim.addBody(createStar([2000, 1800]));
sim.addBody(createStar([2000, 2200]));
sim.addBody(createComet([2300, 2000], [0, -180]));
sim.addBody(createComet([1700, 2000], [0,  180]));

ren.setCamera({ x: 2000, y: 2000, zoom: 1 });

let timeScale = 1;
const speedSlider = document.getElementById('speed-slider');
const speedValue  = document.getElementById('speed-value');
speedSlider.addEventListener('input', () => {
    timeScale = parseFloat(speedSlider.value);
    speedValue.textContent = `${timeScale.toFixed(2)}x`;
});

let last = performance.now();
function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05) * timeScale;
    last = now;
    if (!lab.isEditing()) sim.tick(dt);
    ren.draw(sim.bodies, now);
    lab.drawOverlay(canvas.getContext('2d'));
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
