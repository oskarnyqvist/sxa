import { createStar, createComet } from './bodies.js';

const VEL_ARROW_SCALE = 0.5;
const ARROW_TIP_HIT   = 14;

export function createLab(canvas, simulator, renderer) {
    let selected = null;
    let mode = 'select'; // 'select' | 'addStar' | 'addComet' | 'edit'
    let dragState = null;

    const panel = document.getElementById('body-panel');
    const modeButtons = document.querySelectorAll('[data-mode]');

    function setMode(m) {
        mode = m;
        selected = null;
        renderPanel();
        modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === m);
        });
        canvas.style.cursor = m === 'select' || m === 'edit' ? 'default' : 'crosshair';
    }

    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    canvas.addEventListener('mousedown', e => {
        const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);

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
            // first try arrow tip hit
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
            } else {
                selected = null;
            }
            renderPanel();
            return;
        }

        // select mode: hit test
        const hit = bodyAt(wx, wy);
        if (hit) {
            selected = hit;
            dragState = { type: 'move', body: hit, startWx: wx, startWy: wy, origPos: [...hit.pos] };
        } else {
            selected = null;
        }
        renderPanel();
    });

    canvas.addEventListener('mousemove', e => {
        if (!dragState) return;
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

    canvas.addEventListener('mouseup', e => {
        if (!dragState) return;
        const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);

        if (dragState.type === 'launch') {
            const dx = dragState.wx - wx;
            const dy = dragState.wy - wy;
            dragState.body.vel = [dx * 2, dy * 2];
        }

        dragState = null;
    });

    canvas.addEventListener('wheel', e => {
        const cam = renderer.getCamera();
        const zoom = Math.max(0.1, Math.min(4, cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        renderer.setCamera({ zoom });
    });

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
            <label>Trail-längd <span>${b.trail.maxLength}</span>
                <input type="range" data-prop="trail.maxLength" min="0" max="5000" step="50" value="${b.trail.maxLength}" />
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

        panel.querySelector('#delete-body')?.addEventListener('click', () => {
            simulator.removeBody(b);
            selected = null;
            renderPanel();
        });
    }

    function isEditing() {
        return mode === 'edit';
    }

    return { drawOverlay, setMode, isEditing };
}
