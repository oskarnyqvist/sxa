import { createStar, createComet } from './bodies.js';
import { selected as selectedStore, lifted as liftedStore, bodies as bodiesStore } from './stores/selection.js';
import { randomBodyColor } from './play/colors.js';


export function createLab(canvas, simulator, renderer) {
    let selected = null;
    let dragState = null;
    let enabled = true;
    let spawnState = null;
    let lastTap = null; // { body, t, sx, sy } — for double-tap detection
    const pointers = new Map();

    // Mirror the store locally so hit-tests and overlay don't pay subscribe overhead per frame.
    const unsubSelected = selectedStore.subscribe(v => { selected = v; });

    // Lifted store drives body.lifted flag — sim filters lifted bodies out of physics.
    let prevLifted = null;
    const unsubLifted = liftedStore.subscribe(b => {
        if (prevLifted && prevLifted !== b) prevLifted.lifted = false;
        if (b) b.lifted = true;
        prevLifted = b;
    });

    // Publish the body list so panels can render it without poking each other.
    bodiesStore.set(simulator.bodies);

    function setSelected(body) {
        selectedStore.set(body);
    }

    function pokeBodies() {
        bodiesStore.set(simulator.bodies);
    }

    // Long-press hold on a paused body cycles its radius up and down so the
    // user can release at the size they want. Triangle wave from MIN to MAX,
    // phased so it picks up smoothly at the body's current size.
    const PULSE_MIN = 4;
    const PULSE_MAX = 40;
    const PULSE_PERIOD = 1600;

    function startSizePulse(state) {
        const body = state.body;
        const startR = body.radius;
        const norm = Math.max(0, Math.min(1, (startR - PULSE_MIN) / (PULSE_MAX - PULSE_MIN)));
        const phaseOffset = norm * (PULSE_PERIOD / 2); // start on the up-slope at current size
        state.type = 'body-pulse-size';
        state.pulseT0 = performance.now();
        state.pulsePhaseOffset = phaseOffset;
        // Self-terminating: if dragState gets replaced (pinch, new gesture,
        // teardown), the interval stops mutating radius. Closure-bound to
        // `state` and `id` so it can clean itself up without external help.
        const id = setInterval(() => {
            if (dragState !== state || state.type !== 'body-pulse-size') {
                clearInterval(id);
                state.pulseInterval = null;
                return;
            }
            const t = (performance.now() - state.pulseT0 + state.pulsePhaseOffset) % PULSE_PERIOD;
            const half = PULSE_PERIOD / 2;
            const tri = t < half ? t / half : (PULSE_PERIOD - t) / half;
            body.radius = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * tri;
        }, 16);
        state.pulseInterval = id;
    }

    function stopSizePulse() {
        if (dragState && dragState.pulseInterval) {
            clearInterval(dragState.pulseInterval);
            dragState.pulseInterval = null;
        }
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

    function bodyAt(wx, wy) {
        for (let i = simulator.bodies.length - 1; i >= 0; i--) {
            const b = simulator.bodies[i];
            const dx = b.pos[0] - wx;
            const dy = b.pos[1] - wy;
            if (Math.sqrt(dx * dx + dy * dy) < Math.max(b.radius, 16)) return b;
        }
        return null;
    }

    function nearestBodyOnScreen(sx, sy, maxScreenDist) {
        const max2 = maxScreenDist * maxScreenDist;
        let best = null, bestD = Infinity;
        for (const b of simulator.bodies) {
            const [bsx, bsy] = renderer.worldToScreen(b.pos[0], b.pos[1]);
            const dx = bsx - sx, dy = bsy - sy;
            const d = dx * dx + dy * dy;
            if (d < max2 && d < bestD) { bestD = d; best = b; }
        }
        return best;
    }

    canvas.addEventListener('pointerdown', e => {
        pointers.set(e.pointerId, { sx: e.offsetX, sy: e.offsetY });

        if (pointers.size >= 2) {
            startPinch();
            return;
        }

        canvas.setPointerCapture(e.pointerId);

        if (enabled) {
            const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);
            const hit = bodyAt(wx, wy);
            if (hit) {
                const now = performance.now();
                // Double-tap on the selected body → randomize its color.
                if (selected === hit
                    && lastTap && lastTap.body === hit
                    && now - lastTap.t < 280
                    && Math.hypot(e.offsetX - lastTap.sx, e.offsetY - lastTap.sy) < 20) {
                    const c = randomBodyColor();
                    hit.color = c;
                    if (hit.trail) hit.trail.color = c;
                    pokeBodies();
                    setSelected(hit); // poke subscribers so card re-reads color
                    lastTap = null;   // don't chain into a triple
                    dragState = { type: 'consumed' };
                    return;
                }
                lastTap = { body: hit, t: now, sx: e.offsetX, sy: e.offsetY };

                // First touch on an unselected body: just select + pause.
                // The gesture is consumed — no fling/move possible until the
                // user starts a fresh gesture on the (now selected) body.
                if (selected !== hit) {
                    setSelected(hit);
                    dragState = { type: 'consumed' };
                    return;
                }
                // Already selected: enter action gesture. Quick drag = fling
                // (changes velocity); long-press 350ms then drag = move
                // (preserves velocity).
                dragState = {
                    type: 'body-pending',
                    body: hit,
                    startSx: e.offsetX,
                    startSy: e.offsetY,
                    samples: [{ sx: e.offsetX, sy: e.offsetY, t: now }],
                    holdTimer: null,
                };
                dragState.holdTimer = setTimeout(() => {
                    if (dragState && dragState.type === 'body-pending') {
                        startSizePulse(dragState);
                    }
                }, 350);
                return;
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
            const dxs = e.offsetX - dragState.startSx;
            const dys = e.offsetY - dragState.startSy;
            if (Math.hypot(dxs, dys) > 6) dragState.movedFar = true;
            renderer.setCamera({
                x: dragState.startCam.x - dxs / dragState.startCam.zoom,
                y: dragState.startCam.y - dys / dragState.startCam.zoom,
            });
            return;
        }

        if (!enabled) return;
        const [wx, wy] = renderer.screenToWorld(e.offsetX, e.offsetY);

        // Pending: first real movement decides whether this is a fling
        // (quick drag, sets velocity on release).
        if (dragState.type === 'body-pending') {
            const dxs = e.offsetX - dragState.startSx;
            const dys = e.offsetY - dragState.startSy;
            if (Math.hypot(dxs, dys) > 6) {
                clearTimeout(dragState.holdTimer);
                dragState.type = 'body-fling';
            }
        }

        // Movement during size-pulse switches to plain move — user pivoted
        // from "tweak size" to "reposition". We stop pulsing but keep the
        // current radius they were on.
        if (dragState.type === 'body-pulse-size') {
            const dxs = e.offsetX - dragState.startSx;
            const dys = e.offsetY - dragState.startSy;
            if (Math.hypot(dxs, dys) > 6) {
                stopSizePulse();
                dragState.type = 'body-move';
            }
        }

        if (dragState.type === 'body-fling' || dragState.type === 'body-move') {
            dragState.body.pos = [wx, wy];
            const t = performance.now();
            dragState.samples.push({ sx: e.offsetX, sy: e.offsetY, t });
            const cutoff = t - 100;
            while (dragState.samples.length > 1 && dragState.samples[0].t < cutoff) {
                dragState.samples.shift();
            }
            // Move keeps velocity zeroed; fling lets samples decide on release.
            if (dragState.type === 'body-move' && !dragState.body.pinned) {
                dragState.body.vel = [0, 0];
            }
        }
    });

    function endPointer(e) {
        pointers.delete(e.pointerId);

        if (dragState?.type === 'pinch') {
            if (pointers.size < 2) dragState = null;
            return;
        }

        if (!dragState) return;

        if (dragState.type === 'body-pulse-size') {
            // Stop pulsing and commit whatever radius we landed on.
            stopSizePulse();
            setSelected(dragState.body); // poke for any subscribers reading radius
        }

        if (dragState.type === 'body-pending') {
            // Quick tap: selection already happened on pointerdown.
            clearTimeout(dragState.holdTimer);
        }

        if (dragState.type === 'body-move') {
            // Long-press move: keep selection so the body stays lifted/editable.
            setSelected(dragState.body);
        }

        if (dragState.type === 'body-fling') {
            // Compute release velocity from the last ~50 ms of pointer samples
            // (same window as spawn-fling for consistency).
            const samples = dragState.samples;
            if (samples.length >= 2 && !dragState.body.pinned) {
                const cam = renderer.getCamera();
                const last = samples[samples.length - 1];
                let prev = samples[0];
                for (let i = samples.length - 2; i >= 0; i--) {
                    if (last.t - samples[i].t >= 50) { prev = samples[i]; break; }
                    prev = samples[i];
                }
                const dt = (last.t - prev.t) / 1000;
                if (dt > 0.001) {
                    dragState.body.vel = [
                        (last.sx - prev.sx) / dt / cam.zoom,
                        (last.sy - prev.sy) / dt / cam.zoom,
                    ];
                }
            }
            // Release the body back into the sim — clearing selection drops
            // its lifted flag so it actually flies with the new velocity.
            setSelected(null);
        }

        // Tap (no real pan): pick nearest body within ~10% of the smaller
        // canvas side. Outside that radius, treat as deselect.
        if (dragState.type === 'pan' && !dragState.movedFar) {
            const maxDist = Math.min(canvas.width, canvas.height) * 0.1;
            const nearest = nearestBodyOnScreen(dragState.startSx, dragState.startSy, maxDist);
            if (nearest) setSelected(nearest);
            else if (selected) setSelected(null);
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

    function drawSpawnGhost(ctx) {
        if (!spawnState || spawnState.lastSx == null) return;
        if (!spawnState.inside) return; // hide ghost over the palette
        const sx = spawnState.lastSx, sy = spawnState.lastSy;
        const color = spawnState.type === 'star' ? '#CEA158' : '#3983B1';
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // Trail showing recent pointer path — visual cue that fling is being recorded.
        if (spawnState.type === 'comet' && spawnState.points.length >= 2) {
            ctx.beginPath();
            const pts = spawnState.points;
            ctx.moveTo(pts[0].sx, pts[0].sy);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawOverlay(ctx) {
        drawSpawnGhost(ctx);
        if (!enabled) return;
        if (!selected) return;
        const cam = renderer.getCamera();

        const [sx, sy] = renderer.worldToScreen(selected.pos[0], selected.pos[1]);

        // Soft halo when lifted out of physics — signals "frozen, you can edit".
        if (selected.lifted) {
            ctx.beginPath();
            ctx.arc(sx, sy, (selected.radius + 14) * cam.zoom, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(206, 161, 88, 0.18)';
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(sx, sy, (selected.radius + 6) * cam.zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#E1DACA';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

    }

    function isPaused() {
        if (!dragState) return false;
        return dragState.type === 'body-move'
            || dragState.type === 'body-fling'
            || dragState.type === 'body-pending'
            || dragState.type === 'body-pulse-size';
    }

    function setEnabled(v) {
        enabled = !!v;
        if (!enabled) {
            stopSizePulse();
            dragState = null;
            setSelected(null);
        }
    }

    function removeBody(b) {
        simulator.removeBody(b);
        if (selected === b) setSelected(null);
        pokeBodies();
    }

    function spawnAt(type, sx, sy, vel = [0, 0]) {
        const [wx, wy] = renderer.screenToWorld(sx, sy);
        const body = type === 'star'
            ? simulator.addBody(createStar([wx, wy]))
            : simulator.addBody(createComet([wx, wy], vel));
        setSelected(body);
        pokeBodies();
        return body;
    }

    function spawnAtCenter(type) {
        return spawnAt(type, canvas.width / 2, canvas.height / 2);
    }

    // Drag-from-palette + fling. The palette is a Svelte component outside the
    // canvas, so it owns pointer capture and feeds us positions via this handle.
    // We track recent (sx, sy, t) samples; on commit we derive a release
    // velocity from the last ~80 ms of movement. Stars ignore velocity.
    function beginSpawn(type) {
        spawnState = { type, points: [], lastSx: null, lastSy: null, inside: false };
        return {
            move(sx, sy, inside) {
                if (!spawnState) return;
                const t = performance.now();
                spawnState.points.push({ sx, sy, t });
                const cutoff = t - 100;
                while (spawnState.points.length > 1 && spawnState.points[0].t < cutoff) {
                    spawnState.points.shift();
                }
                spawnState.lastSx = sx;
                spawnState.lastSy = sy;
                spawnState.inside = inside;
            },
            commit() {
                if (!spawnState) return null;
                const { type, points, lastSx, lastSy, inside } = spawnState;
                spawnState = null;
                if (!inside || lastSx == null) return null;

                let vel = [0, 0];
                if (type === 'comet' && points.length >= 2) {
                    const cam = renderer.getCamera();
                    const last = points[points.length - 1];
                    let prev = points[0];
                    for (let i = points.length - 2; i >= 0; i--) {
                        if (last.t - points[i].t >= 50) { prev = points[i]; break; }
                        prev = points[i];
                    }
                    const dt = (last.t - prev.t) / 1000;
                    if (dt > 0.001) {
                        vel = [
                            (last.sx - prev.sx) / dt / cam.zoom,
                            (last.sy - prev.sy) / dt / cam.zoom,
                        ];
                    }
                }
                // Don't auto-select: in edit mode, selection triggers lifted,
                // which freezes the body — defeating the whole fling gesture.
                const [wx, wy] = renderer.screenToWorld(lastSx, lastSy);
                const body = type === 'star'
                    ? simulator.addBody(createStar([wx, wy]))
                    : simulator.addBody(createComet([wx, wy], vel));
                pokeBodies();
                return body;
            },
            cancel() { spawnState = null; },
        };
    }

    function recenter() {
        if (simulator.bodies.length === 0) return;
        renderer.fitTo(simulator.bodies, canvas.width, canvas.height, 1.3);
    }

    function teardown() {
        liftedStore.set(null); // clear flag on any held body before tearing down
        unsubSelected();
        unsubLifted();
        bodiesStore.set([]);
    }

    return { drawOverlay, isPaused, setEnabled, removeBody, spawnAt, spawnAtCenter, beginSpawn, recenter, teardown };
}
