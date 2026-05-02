import { createStar, createComet } from './bodies.js';
import { selected as selectedStore } from './stores/selection.js';

const VEL_ARROW_SCALE = 0.5;
const HANDLE_HIT_RADIUS = 22;
const HANDLE_VISUAL_RADIUS = 8;
const MIN_HANDLE_SCREEN_DIST = 36;

export function createLab(canvas, simulator, renderer) {
    let selected = null;
    let dragState = null;
    let enabled = true;
    const pointers = new Map();

    // Mirror the store locally so hit-tests and overlay don't pay subscribe overhead per frame.
    const unsubscribe = selectedStore.subscribe(v => { selected = v; });

    function setSelected(body) {
        selectedStore.set(body);
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

    function handlesFor(body) {
        if (!body) return [];
        const cam = renderer.getCamera();
        const [sx, sy] = renderer.worldToScreen(body.pos[0], body.pos[1]);
        const out = [];

        const rDist = Math.max(body.radius * cam.zoom, MIN_HANDLE_SCREEN_DIST);
        out.push({ kind: 'radius', sx: sx + rDist, sy });

        if (!body.pinned) {
            const [tx, ty] = renderer.worldToScreen(
                body.pos[0] + body.vel[0] * VEL_ARROW_SCALE,
                body.pos[1] + body.vel[1] * VEL_ARROW_SCALE,
            );
            out.push({ kind: 'velocity', sx: tx, sy: ty });
        }

        return out;
    }

    function handleAt(sx, sy) {
        if (!selected) return null;
        for (const h of handlesFor(selected)) {
            if (Math.hypot(h.sx - sx, h.sy - sy) <= HANDLE_HIT_RADIUS) return h;
        }
        return null;
    }

    function bodyAt(wx, wy) {
        for (let i = simulator.bodies.length - 1; i >= 0; i--) {
            const b = simulator.bodies[i];
            const dx = b.pos[0] - wx;
            const dy = b.pos[1] - wy;
            if (Math.sqrt(dx * dx + dy * dy) < Math.max(b.radius, 16)) return b;
        }
        return null;
    }

    canvas.addEventListener('pointerdown', e => {
        pointers.set(e.pointerId, { sx: e.offsetX, sy: e.offsetY });

        if (pointers.size >= 2) {
            startPinch();
            return;
        }

        canvas.setPointerCapture(e.pointerId);

        if (enabled) {
            const h = handleAt(e.offsetX, e.offsetY);
            if (h) {
                if (h.kind === 'radius')   dragState = { type: 'handle-radius',   body: selected };
                if (h.kind === 'velocity') dragState = { type: 'velocity',        body: selected };
                return;
            }

            const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);
            const hit = bodyAt(wx, wy);
            if (hit) {
                setSelected(hit);
                dragState = { type: 'move', body: hit };
                return;
            }

            if (selected) {
                setSelected(null);
            }
        }

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

        if (dragState.type === 'move') {
            dragState.body.pos = [wx, wy];
            if (!dragState.body.pinned) dragState.body.vel = [0, 0];
        }

        if (dragState.type === 'velocity') {
            dragState.body.vel = [
                (wx - dragState.body.pos[0]) / VEL_ARROW_SCALE,
                (wy - dragState.body.pos[1]) / VEL_ARROW_SCALE,
            ];
        }

        if (dragState.type === 'handle-radius') {
            const dx = wx - dragState.body.pos[0];
            const dy = wy - dragState.body.pos[1];
            dragState.body.radius = Math.max(2, Math.min(60, Math.round(Math.hypot(dx, dy))));
        }
    });

    function endPointer(e) {
        pointers.delete(e.pointerId);

        if (dragState?.type === 'pinch') {
            if (pointers.size < 2) dragState = null;
            return;
        }

        if (!dragState) return;

        if (dragState.type?.startsWith('handle-')
            || dragState.type === 'velocity'
            || dragState.type === 'move') {
            // Drag mutated the body in place; nudge subscribers so panels refresh.
            setSelected(selected);
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

    function drawArrow(ctx, ax, ay, bx, by, color) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function drawHandle(ctx, sx, sy, color, icon) {
        ctx.beginPath();
        ctx.arc(sx, sy, HANDLE_VISUAL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#242828';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (icon) {
            ctx.fillStyle = color;
            ctx.font = 'bold 9px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, sx, sy + 0.5);
        }
    }

    function drawOverlay(ctx) {
        if (!enabled) return;
        if (!selected) return;
        const cam = renderer.getCamera();

        const [sx, sy] = renderer.worldToScreen(selected.pos[0], selected.pos[1]);
        ctx.beginPath();
        ctx.arc(sx, sy, (selected.radius + 6) * cam.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#E1DACA';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (!selected.pinned) {
            const [tx, ty] = renderer.worldToScreen(
                selected.pos[0] + selected.vel[0] * VEL_ARROW_SCALE,
                selected.pos[1] + selected.vel[1] * VEL_ARROW_SCALE,
            );
            drawArrow(ctx, sx, sy, tx, ty, '#3983B1');
        }

        for (const h of handlesFor(selected)) {
            const color = h.kind === 'radius' ? '#E1DACA' : '#3983B1';
            const icon  = h.kind === 'radius' ? '↔'       : '→';
            drawHandle(ctx, h.sx, h.sy, color, icon);
        }
    }

    function isPaused() {
        if (!dragState) return false;
        return dragState.type === 'move'
            || dragState.type === 'velocity'
            || dragState.type === 'handle-radius';
    }

    function setEnabled(v) {
        enabled = !!v;
        if (!enabled) {
            dragState = null;
            setSelected(null);
        }
    }

    function removeBody(b) {
        simulator.removeBody(b);
        if (selected === b) setSelected(null);
    }

    function spawnAt(type, sx, sy) {
        const [wx, wy] = renderer.screenToWorld(sx, sy);
        const body = type === 'star'
            ? simulator.addBody(createStar([wx, wy]))
            : simulator.addBody(createComet([wx, wy], [0, 0]));
        setSelected(body);
        return body;
    }

    function teardown() {
        unsubscribe();
    }

    return { drawOverlay, isPaused, setEnabled, removeBody, spawnAt, teardown };
}
