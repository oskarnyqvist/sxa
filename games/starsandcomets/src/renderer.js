export function createRenderer(canvas, world) {
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

    function draw(bodies, now) {
        resize();
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (const body of bodies) {
            if (body.trail) drawTrail(body);
            drawBody(body);
        }
    }

    function drawBody(body) {
        const [sx, sy] = worldToScreen(body.pos[0], body.pos[1]);
        const r = body.radius * camera.zoom;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = body.color;
        ctx.fill();
    }

    function drawTrail(body) {
        const pts = body.trail.points;
        const start = Math.max(0, pts.length - body.trail.maxLength * 2);
        if (pts.length - start < 4) return;

        const wrapX = world.width  / 2;
        const wrapY = world.height / 2;

        ctx.strokeStyle = body.trail.color;
        ctx.globalAlpha = body.trail.alpha;
        ctx.lineWidth   = body.trail.width * camera.zoom;

        ctx.beginPath();
        const [sx0, sy0] = worldToScreen(pts[start], pts[start + 1]);
        ctx.moveTo(sx0, sy0);
        for (let i = start + 2; i < pts.length; i += 2) {
            const px = pts[i - 2], py = pts[i - 1];
            const cx = pts[i],     cy = pts[i + 1];
            const [sx, sy] = worldToScreen(cx, cy);
            if (Math.abs(cx - px) > wrapX || Math.abs(cy - py) > wrapY) {
                ctx.moveTo(sx, sy);
            } else {
                ctx.lineTo(sx, sy);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    function setCamera(c) {
        Object.assign(camera, c);
    }

    function getCamera() {
        return { ...camera };
    }

    return { draw, setCamera, getCamera, screenToWorld, worldToScreen };
}
