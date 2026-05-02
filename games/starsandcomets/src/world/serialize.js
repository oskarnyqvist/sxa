export const SCHEMA_VERSION = 1;

const BODY_FIELDS = [
    'id', 'name', 'pos', 'vel',
    'pinned', 'attraction', 'radius',
    'color', 'glow', 'tailTaper', 'tailFade', 'speedReactivity',
];

function serializeTrail(trail) {
    if (!trail) return null;
    const { style, maxLength, width, color, alpha, particleSpacing, particleWobble } = trail;
    return { style, maxLength, width, color, alpha, particleSpacing, particleWobble };
}

function serializeBody(b) {
    const out = {};
    for (const k of BODY_FIELDS) out[k] = b[k];
    out.pos = [...b.pos];
    out.vel = [...b.vel];
    out.trail = serializeTrail(b.trail);
    return out;
}

export function serialize({ world, settings, bodies }) {
    return {
        schema_version: SCHEMA_VERSION,
        world: { width: world.width, height: world.height },
        settings: {
            acceleration: settings.acceleration,
            maxSpeed: settings.maxSpeed,
            attractionMode: settings.attractionMode,
        },
        bodies: bodies.map(serializeBody),
    };
}

function deserializeBody(b) {
    const body = { ...b, pos: [...b.pos], vel: [...b.vel] };
    if (b.trail) {
        body.trail = { ...b.trail, points: [] };
    } else {
        body.trail = null;
    }
    return body;
}

export function deserialize(data) {
    if (!data || typeof data !== 'object') throw new Error('Invalid level data');
    if (data.schema_version !== SCHEMA_VERSION) {
        throw new Error(`Unsupported schema_version: ${data.schema_version}`);
    }
    return {
        world: { width: data.world.width, height: data.world.height },
        settings: { ...data.settings },
        bodies: data.bodies.map(deserializeBody),
    };
}
