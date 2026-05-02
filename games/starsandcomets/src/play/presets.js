import { createStar, createComet } from '../bodies.js';
import { SCHEMA_VERSION } from '../world/serialize.js';

export function defaultDraft() {
    return {
        schema_version: SCHEMA_VERSION,
        world: { width: 4000, height: 4000 },
        settings: { acceleration: 800, maxSpeed: 600, attractionMode: 'nearest' },
        bodies: [
            stripRuntime(createStar([2000, 1800])),
            stripRuntime(createStar([2000, 2200])),
            stripRuntime(createComet([2300, 2000], [0, -180])),
            stripRuntime(createComet([1700, 2000], [0,  180])),
        ],
    };
}

const AMBIENT_SCENARIOS = ['binary', 'single', 'trinary', 'drift'];

function rand(min, max) { return min + Math.random() * (max - min); }
function jitter(p, amount) { return [p[0] + rand(-amount, amount), p[1] + rand(-amount, amount)]; }

// For a roughly constant central acceleration `a`, a circular orbit at radius `r` needs
// v = sqrt(a*r). We pick a fraction of that so orbits are slightly elliptical (more interesting).
function orbitSpeed(accel, r, fraction = 0.95) {
    return Math.sqrt(accel * r) * fraction;
}

function ambientComet(pos, vel) {
    return createComet(pos, vel, {
        glow: rand(0.15, 0.45),
        tailFade: rand(0.8, 0.95),
        tailTaper: rand(0.7, 0.95),
    });
}

export function ambientWorld() {
    const scenario = AMBIENT_SCENARIOS[Math.floor(Math.random() * AMBIENT_SCENARIOS.length)];
    const accel = rand(400, 700);
    const c = [3000, 3000];
    const bodies = [];

    if (scenario === 'binary') {
        const sep = rand(500, 800);
        bodies.push(createStar(jitter([c[0], c[1] - sep / 2], 80), { radius: rand(14, 20), glow: rand(0.2, 0.4) }));
        bodies.push(createStar(jitter([c[0], c[1] + sep / 2], 80), { radius: rand(14, 20), glow: rand(0.2, 0.4) }));
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const r = rand(700, 1100);
            const speed = orbitSpeed(accel, r, rand(0.85, 1.05));
            bodies.push(ambientComet([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], [-Math.sin(a) * speed, Math.cos(a) * speed]));
        }
    } else if (scenario === 'single') {
        bodies.push(createStar(c, { radius: rand(20, 28), glow: rand(0.3, 0.5) }));
        const n = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = rand(500, 1200);
            const speed = orbitSpeed(accel, r, rand(0.85, 1.1));
            bodies.push(ambientComet([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], [-Math.sin(a) * speed, Math.cos(a) * speed]));
        }
    } else if (scenario === 'trinary') {
        const r = rand(500, 750);
        for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2 + Math.random() * 0.3;
            bodies.push(createStar([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r], { radius: rand(12, 16), glow: rand(0.2, 0.35) }));
        }
        const n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const rr = rand(1100, 1500);
            const speed = orbitSpeed(accel, rr, rand(0.8, 1.0));
            bodies.push(ambientComet([c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr], [-Math.sin(a) * speed, Math.cos(a) * speed]));
        }
    } else { // drift — flyby trajectories, not orbits
        const sep = rand(1500, 2200);
        bodies.push(createStar([c[0] - sep / 2, c[1] + rand(-200, 200)], { radius: rand(14, 18), glow: rand(0.2, 0.35) }));
        bodies.push(createStar([c[0] + sep / 2, c[1] + rand(-200, 200)], { radius: rand(14, 18), glow: rand(0.2, 0.35) }));
        const n = 4 + Math.floor(Math.random() * 3);
        const flybySpeed = orbitSpeed(accel, sep / 2, 1.4); // hyperbolic-ish, faster than orbit
        for (let i = 0; i < n; i++) {
            const x = rand(c[0] - sep, c[0] + sep);
            const y = c[1] + rand(-1000, 1000);
            const vy = rand(-flybySpeed * 0.2, flybySpeed * 0.2);
            const vx = (Math.random() < 0.5 ? 1 : -1) * flybySpeed * rand(0.7, 1.0);
            bodies.push(ambientComet([x, y], [vx, vy]));
        }
    }

    // maxSpeed should comfortably exceed any starting orbital speed, otherwise orbits decay.
    const maxStartSpeed = bodies.reduce((m, b) => Math.max(m, Math.hypot(b.vel[0], b.vel[1])), 0);

    return {
        schema_version: SCHEMA_VERSION,
        world: { width: 6000, height: 6000 },
        settings: {
            acceleration: accel,
            maxSpeed: Math.max(maxStartSpeed * 1.5, 600),
            attractionMode: 'nearest',
        },
        bodies,
    };
}

function stripRuntime(body) {
    if (body.trail?.points) body.trail = { ...body.trail, points: undefined };
    return body;
}
