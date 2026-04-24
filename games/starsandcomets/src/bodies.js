let nextId = 1;

export function createStar(pos, overrides = {}) {
    return {
        id: nextId++,
        name: `Star ${nextId - 1}`,
        pos: [...pos],
        vel: [0, 0],
        pinned: true,
        attraction: 1,
        repelRadius: 0,
        radius: 14,
        color: '#f9e2af',
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
        trail: { maxLength: 300, width: 2, color: '#89b4fa', alpha: 0.6, points: [] },
        ...overrides,
    };
}
