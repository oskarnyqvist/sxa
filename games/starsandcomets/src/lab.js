import { createStar, createComet } from './bodies.js';

const VEL_ARROW_SCALE = 0.5;
const ARROW_TIP_HIT   = 14;

const PRESETS = {
    'Klassisk': { glow: 0,    tailTaper: 0,    tailFade: 0,    speedReactivity: 0   },
    'Glow':     { glow: 0.6,  tailTaper: 0.7,  tailFade: 0.7,  speedReactivity: 0   },
    'Neon':     { glow: 1.0,  tailTaper: 0.8,  tailFade: 0.5,  speedReactivity: 0.4 },
    'Eldkula':  { glow: 0.8,  tailTaper: 0.9,  tailFade: 0.9,  speedReactivity: 1.0 },
};

export function createLab(canvas, simulator, renderer) {
    let selected = null;
    let mode = 'select'; // 'select' | 'addStar' | 'addComet' | 'edit'
    let dragState = null;
    let enabled = true;
    const pointers = new Map(); // pointerId -> { sx, sy }

    const panel = document.getElementById('body-panel');

    function setMode(m) {
        mode = m;
        selected = null;
        renderPanel();
        canvas.style.cursor = m === 'select' || m === 'edit' ? 'default' : 'crosshair';
    }

    function startPan(e) {
        const cam = renderer.getCamera();
        dragState = {
            type: 'pan',
            startSx: e.offsetX,
            startSy: e.offsetY,
            startCam: { x: cam.x, y: cam.y, zoom: cam.zoom },
        };
    }

    function startPinch() {
        const [a, b] = [...pointers.values()];
        const midSx = (a.sx + b.sx) / 2;
        const midSy = (a.sy + b.sy) / 2;
        dragState = {
            type: 'pinch',
            startDist: Math.hypot(b.sx - a.sx, b.sy - a.sy) || 1,
            startZoom: renderer.getCamera().zoom,
            anchorWorld: renderer.screenToWorld(midSx, midSy),
        };
    }

    canvas.addEventListener('pointerdown', e => {
        pointers.set(e.pointerId, { sx: e.offsetX, sy: e.offsetY });

        if (pointers.size >= 2) {
            startPinch();
            return;
        }

        canvas.setPointerCapture(e.pointerId);
        const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);

        if (enabled) {
            if (mode === 'addStar') {
                const b = simulator.addBody(createStar([wx, wy]));
                selected = b;
                setMode('select');
                renderPanel();
                return;
            }

            if (mode === 'addComet') {
                dragState = { type: 'launch', wx, wy, body: null };
                const b = simulator.addBody(createComet([wx, wy], [0, 0]));
                dragState.body = b;
                selected = b;
                renderPanel();
                return;
            }

            if (mode === 'edit') {
                const tipHit = arrowTipAt(wx, wy);
                if (tipHit) {
                    selected = tipHit;
                    dragState = { type: 'velocity', body: tipHit };
                    renderPanel();
                    return;
                }
                const hit = bodyAt(wx, wy);
                if (hit) {
                    selected = hit;
                    dragState = { type: 'move', body: hit };
                    renderPanel();
                    return;
                }
                selected = null;
                renderPanel();
                startPan(e);
                return;
            }

            // select mode
            const hit = bodyAt(wx, wy);
            if (hit) {
                selected = hit;
                dragState = { type: 'move', body: hit, startWx: wx, startWy: wy, origPos: [...hit.pos] };
                renderPanel();
                return;
            }
            selected = null;
            renderPanel();
        }

        // play mode (disabled), or empty click in select/edit → pan
        startPan(e);
    });

    canvas.addEventListener('pointermove', e => {
        const p = pointers.get(e.pointerId);
        if (p) { p.sx = e.offsetX; p.sy = e.offsetY; }

        if (dragState?.type === 'pinch') {
            if (pointers.size < 2) return;
            const [a, b] = [...pointers.values()];
            const midSx = (a.sx + b.sx) / 2;
            const midSy = (a.sy + b.sy) / 2;
            const dist = Math.hypot(b.sx - a.sx, b.sy - a.sy);
            const zoom = Math.max(0.1, Math.min(4, dragState.startZoom * dist / dragState.startDist));
            const newX = dragState.anchorWorld[0] - (midSx - canvas.width  / 2) / zoom;
            const newY = dragState.anchorWorld[1] - (midSy - canvas.height / 2) / zoom;
            renderer.setCamera({ zoom, x: newX, y: newY });
            return;
        }

        if (!dragState) return;

        if (dragState.type === 'pan') {
            const dx = (e.offsetX - dragState.startSx) / dragState.startCam.zoom;
            const dy = (e.offsetY - dragState.startSy) / dragState.startCam.zoom;
            renderer.setCamera({
                x: dragState.startCam.x - dx,
                y: dragState.startCam.y - dy,
            });
            return;
        }

        if (!enabled) return;
        const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);

        if (dragState.type === 'move' && (dragState.body.pinned || mode === 'edit')) {
            dragState.body.pos = [wx, wy];
        }

        if (dragState.type === 'velocity') {
            dragState.body.vel = [
                (wx - dragState.body.pos[0]) / VEL_ARROW_SCALE,
                (wy - dragState.body.pos[1]) / VEL_ARROW_SCALE,
            ];
        }

        if (dragState.type === 'launch') {
            dragState.currentWx = wx;
            dragState.currentWy = wy;
        }
    });

    function endPointer(e) {
        pointers.delete(e.pointerId);

        if (dragState?.type === 'pinch') {
            if (pointers.size < 2) dragState = null;
            return;
        }

        if (!dragState) return;

        if (dragState.type === 'launch' && enabled) {
            const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);
            const dx = dragState.wx - wx;
            const dy = dragState.wy - wy;
            dragState.body.vel = [dx * 2, dy * 2];
        }

        dragState = null;
    }

    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        const cam = renderer.getCamera();
        const zoom = Math.max(0.1, Math.min(4, cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        renderer.setCamera({ zoom });
    }, { passive: false });

    function bodyAt(wx, wy) {
        for (let i = simulator.bodies.length - 1; i >= 0; i--) {
            const b = simulator.bodies[i];
            const dx = b.pos[0] - wx;
            const dy = b.pos[1] - wy;
            if (Math.sqrt(dx * dx + dy * dy) < Math.max(b.radius, 16)) return b;
        }
        return null;
    }

    function arrowTipAt(wx, wy) {
        for (let i = simulator.bodies.length - 1; i >= 0; i--) {
            const b = simulator.bodies[i];
            if (b.pinned) continue;
            const tipX = b.pos[0] + b.vel[0] * VEL_ARROW_SCALE;
            const tipY = b.pos[1] + b.vel[1] * VEL_ARROW_SCALE;
            const dx = tipX - wx;
            const dy = tipY - wy;
            if (Math.sqrt(dx * dx + dy * dy) < ARROW_TIP_HIT) return b;
        }
        return null;
    }

    function drawArrow(ctx, ax, ay, bx, by, color) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawOverlay(ctx) {
        if (!enabled) return;
        const cam = renderer.getCamera();

        if (mode === 'edit') {
            for (const b of simulator.bodies) {
                const [sx, sy] = renderer.worldToScreen(b.pos[0], b.pos[1]);
                ctx.beginPath();
                ctx.arc(sx, sy, (b.radius + 6) * cam.zoom, 0, Math.PI * 2);
                ctx.strokeStyle = b === selected ? '#89b4fa' : '#cdd6f4';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                if (!b.pinned) {
                    const [tx, ty] = renderer.worldToScreen(
                        b.pos[0] + b.vel[0] * VEL_ARROW_SCALE,
                        b.pos[1] + b.vel[1] * VEL_ARROW_SCALE,
                    );
                    drawArrow(ctx, sx, sy, tx, ty, b === selected ? '#89b4fa' : '#f9e2af');
                }
            }
            return;
        }

        if (!selected) return;

        // highlight selected
        const [sx, sy] = renderer.worldToScreen(selected.pos[0], selected.pos[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, (selected.radius + 6) * cam.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#cdd6f4';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // repel radius
        if (selected.attraction && selected.repelRadius > 0) {
            ctx.beginPath();
            ctx.arc(sx, sy, selected.repelRadius * cam.zoom, 0, Math.PI * 2);
            ctx.strokeStyle = '#f38ba8';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // launch preview arrow
        if (dragState?.type === 'launch' && dragState.currentWx !== undefined) {
            const [ax, ay] = renderer.worldToScreen(dragState.wx, dragState.wy);
            const [bx, by] = renderer.worldToScreen(dragState.currentWx, dragState.currentWy);
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = '#f38ba8';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    function renderPanel() {
        if (!selected) {
            panel.innerHTML = '<p class="empty">Inget markerat</p>';
            return;
        }
        const b = selected;
        panel.innerHTML = `
            <label>Namn
                <input type="text" data-prop="name" value="${b.name}" />
            </label>
            <label>Färg
                <input type="color" data-prop="color" value="${b.color}" />
            </label>
            <label>Radie <span>${b.radius}</span>
                <input type="range" data-prop="radius" min="2" max="60" step="1" value="${b.radius}" />
            </label>
            <label class="checkbox">
                <input type="checkbox" data-prop="attraction" ${b.attraction ? 'checked' : ''} />
                Attraherar
            </label>
            <label>Repel-radie <span>${b.repelRadius}</span>
                <input type="range" data-prop="repelRadius" min="0" max="500" step="10" value="${b.repelRadius}" />
            </label>
            ${b.trail ? `
            <label>Svansstil
                <select data-prop="trail.style">
                    <option value="line"      ${b.trail.style === 'line'      ? 'selected' : ''}>Linje</option>
                    <option value="particles" ${b.trail.style === 'particles' ? 'selected' : ''}>Partiklar</option>
                </select>
            </label>
            <label>Trail-längd <span>${b.trail.maxLength}</span>
                <input type="range" data-prop="trail.maxLength" min="0" max="5000" step="50" value="${b.trail.maxLength}" />
            </label>
            ` : ''}
            <hr />
            <label>Stil
                <select id="preset-select">
                    <option value="">Egen…</option>
                    ${Object.keys(PRESETS).map(k => `<option value="${k}">${k}</option>`).join('')}
                </select>
            </label>
            <label>Glow <span>${b.glow.toFixed(2)}</span>
                <input type="range" data-prop="glow" min="0" max="1" step="0.05" value="${b.glow}" />
            </label>
            ${b.trail ? `
            <label>Svans avsmalning <span>${b.tailTaper.toFixed(2)}</span>
                <input type="range" data-prop="tailTaper" min="0" max="1" step="0.05" value="${b.tailTaper}" />
            </label>
            <label>Svans fade <span>${b.tailFade.toFixed(2)}</span>
                <input type="range" data-prop="tailFade" min="0" max="1" step="0.05" value="${b.tailFade}" />
            </label>
            <label>Fart-reaktion <span>${b.speedReactivity.toFixed(2)}</span>
                <input type="range" data-prop="speedReactivity" min="0" max="1" step="0.05" value="${b.speedReactivity}" />
            </label>
            ` : ''}
            <button id="delete-body">Ta bort</button>
        `;

        panel.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                const prop = input.dataset.prop;
                const val = input.type === 'range'    ? parseFloat(input.value)
                          : input.type === 'checkbox' ? (input.checked ? 1 : 0)
                          : input.type === 'color'    ? input.value
                          : input.value;
                const path = prop.split('.');
                let target = b;
                for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
                target[path[path.length - 1]] = val;
                const span = input.previousElementSibling;
                if (span?.tagName === 'SPAN') span.textContent = val;
                if (prop === 'color' && b.trail) b.trail.color = val;
            });
        });

        panel.querySelectorAll('select[data-prop]').forEach(sel => {
            sel.addEventListener('change', () => {
                const path = sel.dataset.prop.split('.');
                let target = b;
                for (let i = 0; i < path.length - 1; i++) target = target[path[i]];
                target[path[path.length - 1]] = sel.value;
            });
        });

        const presetSel = panel.querySelector('#preset-select');
        presetSel?.addEventListener('change', () => {
            const p = PRESETS[presetSel.value];
            if (!p) return;
            Object.assign(b, p);
            renderPanel();
        });

        panel.querySelector('#delete-body')?.addEventListener('click', () => {
            simulator.removeBody(b);
            selected = null;
            renderPanel();
        });
    }

    function isEditing() {
        return mode === 'edit';
    }

    function setEnabled(v) {
        enabled = !!v;
        if (!enabled) {
            selected = null;
            dragState = null;
            renderPanel();
        }
    }

    return { drawOverlay, setMode, isEditing, setEnabled };
}
