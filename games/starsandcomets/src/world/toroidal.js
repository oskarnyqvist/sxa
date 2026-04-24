export function createToroidalWorld({ width, height }) {
    function distance(a, b) {
        const dx = Math.min(Math.abs(b[0] - a[0]), width - Math.abs(b[0] - a[0]));
        const dy = Math.min(Math.abs(b[1] - a[1]), height - Math.abs(b[1] - a[1]));
        return Math.sqrt(dx * dx + dy * dy);
    }

    function direction(from, to) {
        let dx = to[0] - from[0];
        let dy = to[1] - from[1];
        if (Math.abs(dx) > width / 2)  dx = dx > 0 ? dx - width  : dx + width;
        if (Math.abs(dy) > height / 2) dy = dy > 0 ? dy - height : dy + height;
        const len = Math.sqrt(dx * dx + dy * dy);
        return len === 0 ? [0, 0] : [dx / len, dy / len];
    }

    function step(pos, vel, dt) {
        let x = (pos[0] + vel[0] * dt) % width;
        let y = (pos[1] + vel[1] * dt) % height;
        if (x < 0) x += width;
        if (y < 0) y += height;
        return [x, y];
    }

    function randomPoint() {
        return [Math.random() * width, Math.random() * height];
    }

    return { width, height, distance, direction, step, randomPoint };
}
