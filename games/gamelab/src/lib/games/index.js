import attractor from './attractor/index.js';

export const families = [attractor];

export function getFamily(slug) {
    return families.find((f) => f.slug === slug);
}
