export function createSimulator(world, settings) {
    const bodies = [];

    function addBody(body) {
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
        let accel;
        if (attractor.repelRadius > 0 && dist < attractor.repelRadius) {
            const ratio = attractor.repelRadius / dist;
            accel = -attractor.attraction * settings.acceleration * ratio * ratio;
        } else {
            accel = attractor.attraction * settings.acceleration;
        }
        return [dir[0] * accel * weight * sizeFactor, dir[1] * accel * weight * sizeFactor];
    }

    function tick(dt) {
        const attractors = bodies.filter(b => b.attraction !== 0);
        const movable    = bodies.filter(b => !b.pinned);

        maxAttractorRadius = 1;
        for (const a of attractors) if (a.radius > maxAttractorRadius) maxAttractorRadius = a.radius;

        for (const body of movable) {
            let ax = 0, ay = 0;
            const others = attractors.filter(a => a !== body);

            if (settings.attractionMode === 'nearest') {
                let nearest = null;
                let nd = Infinity;
                for (const a of others) {
                    const d = world.distance(body.pos, a.pos);
                    if (d < nd) { nd = d; nearest = a; }
                }
                if (nearest && nd > 0) {
                    [ax, ay] = pull(body, nearest, nd, 1);
                }
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
                        const [fx, fy] = pull(body, others[i], dists[i], weights[i] / wsum);
                        ax += fx;
                        ay += fy;
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
                        const [fx, fy] = pull(body, others[i], dists[i], w);
                        ax += fx;
                        ay += fy;
                    }
                }
            } else {
                for (const a of others) {
                    const d = world.distance(body.pos, a.pos);
                    if (d === 0) continue;
                    const [fx, fy] = pull(body, a, d, 1);
                    ax += fx;
                    ay += fy;
                }
            }

            body.vel[0] += ax * dt;
            body.vel[1] += ay * dt;

            if (settings.maxSpeed > 0) {
                const speed = Math.sqrt(body.vel[0] ** 2 + body.vel[1] ** 2);
                if (speed > settings.maxSpeed) {
                    body.vel[0] = (body.vel[0] / speed) * settings.maxSpeed;
                    body.vel[1] = (body.vel[1] / speed) * settings.maxSpeed;
                }
            }

            body.pos = world.step(body.pos, body.vel, dt);

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
