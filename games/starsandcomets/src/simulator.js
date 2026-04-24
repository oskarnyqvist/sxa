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

    function tick(dt) {
        const attractors = bodies.filter(b => b.attraction !== 0);
        const movable    = bodies.filter(b => !b.pinned);

        for (const body of movable) {
            let nearest = null;
            let nearestDist = Infinity;
            for (const a of attractors) {
                if (a === body) continue;
                const d = world.distance(body.pos, a.pos);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearest = a;
                }
            }

            let ax = 0, ay = 0;
            if (nearest && nearestDist > 0) {
                const dir = world.direction(body.pos, nearest.pos);
                let accel;
                if (nearest.repelRadius > 0 && nearestDist < nearest.repelRadius) {
                    const ratio = nearest.repelRadius / nearestDist;
                    accel = -nearest.attraction * settings.acceleration * ratio * ratio;
                } else {
                    accel = nearest.attraction * settings.acceleration;
                }
                ax = dir[0] * accel;
                ay = dir[1] * accel;
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
