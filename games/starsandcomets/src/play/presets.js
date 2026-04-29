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

function stripRuntime(body) {
    if (body.trail?.points) body.trail = { ...body.trail, points: undefined };
    return body;
}
