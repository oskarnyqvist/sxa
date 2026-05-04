const REPEL_FACTOR = 1.5;
const SPEED_HISTORY_LEN = 120; // ~2 s at 60 fps

function initStats(body) {
    body.stats = {
        speedRing: new Float32Array(SPEED_HISTORY_LEN),
        speedRingIdx: 0,
        closestApproach: Infinity,
        age: 0,
        totalDistance: 0,
    };
}

export function createSimulator(world, settings) {
    const bodies = [];

    function addBody(body) {
        initStats(body);
        bodies.push(body);
        return body;
    }

    function removeBody(body) {
        const i = bodies.indexOf(body);
        if (i !== -1) bodies.splice(i, 1);
    }

    let maxAttractorRadius = 1;

    function pull(body, attractor, dist, weight) {
        const dir = world.direction(body.pos, attractor.pos);
        const sizeFactor = attractor.radius / maxAttractorRadius;
        const repelRadius = attractor.radius * REPEL_FACTOR;
        let accel;
        let perpAccel = 0;
        if (dist < repelRadius) {
            const ratio = repelRadius / dist;
            accel = -attractor.attraction * settings.acceleration * ratio * ratio;
            // Break head-on symmetry deterministically — without this a comet
            // approaching dead-on bounces back in 1D instead of swinging round.
            const speed = Math.hypot(body.vel[0], body.vel[1]);
            if (speed > 0) {
                const headOn = Math.abs((body.vel[0] * dir[0] + body.vel[1] * dir[1]) / speed);
                const sign = (body.id & 1) ? -1 : 1;
                perpAccel = sign * Math.abs(accel) * 0.5 * headOn;
            }
        } else {
            accel = attractor.attraction * settings.acceleration;
        }
        const fx = (dir[0] * accel + (-dir[1]) * perpAccel) * weight * sizeFactor;
        const fy = (dir[1] * accel + ( dir[0]) * perpAccel) * weight * sizeFactor;
        return [fx, fy];
    }

    function tick(dt) {
        // Lifted bodies are temporarily out of physics — they don't pull, get pulled, or move.
        const attractors = bodies.filter(b => b.attraction !== 0 && !b.lifted);
        const movable    = bodies.filter(b => !b.pinned && !b.lifted);

        maxAttractorRadius = 1;
        for (const a of attractors) if (a.radius > maxAttractorRadius) maxAttractorRadius = a.radius;

        const force = new Map();
        for (const m of movable) force.set(m, [0, 0]);

        // applyPair: forward force on body. Asymmetric model — passive bodies
        // (attraction === 0) don't push back on their attractors, only other
        // attractors do (handled implicitly when we iterate that other body).
        function applyPair(body, attractor, dist, weight) {
            const [fx, fy] = pull(body, attractor, dist, weight);
            const bf = force.get(body);
            bf[0] += fx;
            bf[1] += fy;
        }

        for (const body of movable) {
            const others = attractors.filter(a => a !== body);

            if (settings.attractionMode === 'nearest') {
                let nearest = null;
                let nd = Infinity;
                for (const a of others) {
                    const d = world.distance(body.pos, a.pos);
                    if (d < nd) { nd = d; nearest = a; }
                }
                if (nearest && nd > 0) applyPair(body, nearest, nd, 1);
            } else if (settings.attractionMode === 'weighted') {
                const dists = others.map(a => world.distance(body.pos, a.pos));
                let wsum = 0;
                const weights = dists.map(d => {
                    const w = d > 0 ? 1 / d : 0;
                    wsum += w;
                    return w;
                });
                if (wsum > 0) {
                    for (let i = 0; i < others.length; i++) {
                        if (dists[i] === 0) continue;
                        applyPair(body, others[i], dists[i], weights[i] / wsum);
                    }
                }
            } else if (settings.attractionMode === 'normalized' || settings.attractionMode === 'normalized2') {
                const square = settings.attractionMode === 'normalized2';
                const dists = others.map(a => world.distance(body.pos, a.pos));
                let nd = Infinity;
                for (const d of dists) if (d > 0 && d < nd) nd = d;
                if (nd < Infinity) {
                    for (let i = 0; i < others.length; i++) {
                        if (dists[i] === 0) continue;
                        const ratio = nd / dists[i];
                        const w = square ? ratio * ratio : ratio;
                        applyPair(body, others[i], dists[i], w);
                    }
                }
            } else {
                for (const a of others) {
                    const d = world.distance(body.pos, a.pos);
                    if (d === 0) continue;
                    applyPair(body, a, d, 1);
                }
            }
        }

        for (const body of movable) {
            const f = force.get(body);
            body.vel[0] += f[0] * dt;
            body.vel[1] += f[1] * dt;

            const speed = Math.sqrt(body.vel[0] ** 2 + body.vel[1] ** 2);
            if (settings.maxSpeed > 0 && speed > settings.maxSpeed) {
                body.vel[0] = (body.vel[0] / speed) * settings.maxSpeed;
                body.vel[1] = (body.vel[1] / speed) * settings.maxSpeed;
            }

            const stepDx = body.vel[0] * dt;
            const stepDy = body.vel[1] * dt;
            body.pos = world.step(body.pos, body.vel, dt);

            if (!body.stats) initStats(body);
            const s = body.stats;
            s.age += dt;
            s.totalDistance += Math.hypot(stepDx, stepDy);
            s.speedRing[s.speedRingIdx] = speed;
            s.speedRingIdx = (s.speedRingIdx + 1) % s.speedRing.length;
            for (const a of attractors) {
                if (a === body) continue;
                const d = world.distance(body.pos, a.pos);
                if (d < s.closestApproach) s.closestApproach = d;
            }

            if (body.trail) {
                body.trail.points.push(body.pos[0], body.pos[1]);
                const max = body.trail.maxLength * 2;
                if (body.trail.points.length > max) {
                    body.trail.points.splice(0, body.trail.points.length - max);
                }
            }
        }
    }

    return { bodies, addBody, removeBody, tick };
}

export function recentMaxSpeed(body) {
    if (!body.stats) return 0;
    const ring = body.stats.speedRing;
    let m = 0;
    for (let i = 0; i < ring.length; i++) if (ring[i] > m) m = ring[i];
    return m;
}
