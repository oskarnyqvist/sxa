let nextId = 1;

export function createStar(pos, overrides = {}) {
    return {
        id: nextId++,
        name: `Star ${nextId - 1}`,
        pos: [...pos],
        vel: [0, 0],
        pinned: true,
        attraction: 1,
        repelRadius: 10,
        radius: 14,
        color: '#f9e2af',
        glow: 0,
        tailTaper: 0,
        tailFade: 0,
        speedReactivity: 0,
        trail: null,
        ...overrides,
    };
}

export function createComet(pos, vel = [0, 0], overrides = {}) {
    return {
        id: nextId++,
        name: `Comet ${nextId - 1}`,
        pos: [...pos],
        vel: [...vel],
        pinned: false,
        attraction: 0,
        repelRadius: 0,
        radius: 6,
        color: '#89b4fa',
        glow: 0,
        tailTaper: 0.7,
        tailFade: 0.7,
        speedReactivity: 0.3,
        trail: { style: 'line', maxLength: 300, width: 2, color: '#89b4fa', alpha: 0.6, particleSpacing: 3, particleWobble: 0.4, points: [] },
        ...overrides,
    };
}
