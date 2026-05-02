export function createRenderer(canvas, world, settings) {
    const ctx = canvas.getContext('2d');

    let camera = { x: 0, y: 0, zoom: 1 };

    function resize() {
        canvas.width  = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    function worldToScreen(wx, wy) {
        return [
            (wx - camera.x) * camera.zoom + canvas.width  / 2,
            (wy - camera.y) * camera.zoom + canvas.height / 2,
        ];
    }

    function screenToWorld(sx, sy) {
        return [
            (sx - canvas.width  / 2) / camera.zoom + camera.x,
            (sy - canvas.height / 2) / camera.zoom + camera.y,
        ];
    }

    function hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${a})`;
    }

    function speedNorm(body) {
        if (body.pinned || !settings.maxSpeed) return 0;
        const s = Math.sqrt(body.vel[0] ** 2 + body.vel[1] ** 2);
        return Math.min(1, s / settings.maxSpeed);
    }

    function draw(bodies, now) {
        resize();
        ctx.fillStyle = '#1a1d1d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const body of bodies) {
            if (body.trail) drawTrail(body);
        }
        for (const body of bodies) {
            drawBody(body);
        }
    }

    function drawBody(body) {
        const [sx, sy] = worldToScreen(body.pos[0], body.pos[1]);
        const r = body.radius * camera.zoom;
        const sn = speedNorm(body);
        const reactGlow = 1 + 2 * (body.speedReactivity || 0) * sn;
        const effGlow = (body.glow || 0) * reactGlow;

        if (effGlow > 0) {
            const haloR = r * (2 + 5 * Math.min(effGlow, 2));
            const grad = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, haloR);
            grad.addColorStop(0, hexToRgba(body.color, Math.min(1, effGlow)));
            grad.addColorStop(1, hexToRgba(body.color, 0));
            const prevOp = ctx.globalCompositeOperation;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(sx, sy, haloR, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = prevOp;
        }

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
    }

    function drawTrail(body) {
        if (body.trail.style === 'particles') {
            drawTrailParticles(body);
        } else {
            drawTrailLine(body);
        }
    }

    function drawTrailLine(body) {
        const pts = body.trail.points;
        const totalSegs = pts.length / 2 - 1;
        if (totalSegs < 1) return;

        const sn = speedNorm(body);
        const react = body.speedReactivity || 0;
        const visibleFrac = 1 - react * 0.7 * (1 - sn);
        const visibleSegs = Math.max(1, Math.floor(totalSegs * visibleFrac));
        const startSeg = totalSegs - visibleSegs;

        const wrapX = world.width  / 2;
        const wrapY = world.height / 2;

        const baseWidth = body.trail.width * camera.zoom;
        const taper = body.tailTaper || 0;
        const fade  = body.tailFade  || 0;
        const baseAlpha = body.trail.alpha;

        ctx.strokeStyle = body.trail.color;
        ctx.lineCap = 'round';

        for (let seg = startSeg; seg < totalSegs; seg++) {
            const age = (totalSegs - 1 - seg) / Math.max(1, visibleSegs - 1);
            const i = seg * 2;
            const px = pts[i],     py = pts[i + 1];
            const cx = pts[i + 2], cy = pts[i + 3];
            if (Math.abs(cx - px) > wrapX || Math.abs(cy - py) > wrapY) continue;

            const [sx0, sy0] = worldToScreen(px, py);
            const [sx1, sy1] = worldToScreen(cx, cy);

            ctx.lineWidth = baseWidth * (1 - taper * age);
            ctx.globalAlpha = baseAlpha * (1 - fade * age);
            ctx.beginPath();
            ctx.moveTo(sx0, sy0);
            ctx.lineTo(sx1, sy1);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
    }

    function drawTrailParticles(body) {
        const pts = body.trail.points;
        const totalPts = pts.length / 2;
        if (totalPts < 1) return;

        const sn = speedNorm(body);
        const react = body.speedReactivity || 0;
        const visibleFrac = 1 - react * 0.7 * (1 - sn);
        const visiblePts = Math.max(1, Math.floor(totalPts * visibleFrac));
        const startPt = totalPts - visiblePts;

        const baseR = body.radius * camera.zoom;
        const taper = body.tailTaper || 0;
        const fade  = body.tailFade  || 0;
        const baseAlpha = body.trail.alpha;
        const spacing = Math.max(1, body.trail.particleSpacing | 0);
        const wobbleAmp = body.trail.particleWobble ?? 0;

        ctx.fillStyle = body.trail.color;

        for (let i = startPt; i < totalPts; i += spacing) {
            const age = (totalPts - 1 - i) / Math.max(1, visiblePts - 1);
            const sizeAge = 1 - taper * age;
            const wobble = 1 - wobbleAmp * (Math.sin(i * 0.5) * 0.5 + 0.5);
            const r = baseR * sizeAge * wobble;
            if (r < 0.5) continue;
            const alpha = baseAlpha * (1 - fade * age);
            const [sx, sy] = worldToScreen(pts[i * 2], pts[i * 2 + 1]);
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function setCamera(c) {
        Object.assign(camera, c);
    }

    function getCamera() {
        return { ...camera };
    }

    function fitTo(bodies, viewportW, viewportH, padding = 1.25, maxZoom = 1.5) {
        if (bodies.length === 0) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const b of bodies) {
            const r = b.radius || 0;
            if (b.pos[0] - r < minX) minX = b.pos[0] - r;
            if (b.pos[1] - r < minY) minY = b.pos[1] - r;
            if (b.pos[0] + r > maxX) maxX = b.pos[0] + r;
            if (b.pos[1] + r > maxY) maxY = b.pos[1] + r;
            // Trails extend further than current pos — include them so swinging
            // comets stay in frame after recentering.
            const pts = b.trail?.points;
            if (pts) {
                for (let i = 0; i < pts.length; i += 2) {
                    const x = pts[i], y = pts[i + 1];
                    if (x < minX) minX = x; else if (x > maxX) maxX = x;
                    if (y < minY) minY = y; else if (y > maxY) maxY = y;
                }
            }
        }
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const w = Math.max(1, (maxX - minX) * padding);
        const h = Math.max(1, (maxY - minY) * padding);
        const zoom = Math.max(0.1, Math.min(maxZoom, viewportW / w, viewportH / h));
        Object.assign(camera, { x: cx, y: cy, zoom });
    }

    return { draw, setCamera, getCamera, fitTo, screenToWorld, worldToScreen };
}
