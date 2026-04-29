import classic from './classic.js';
import bouncy from './bouncy.js';
import swarm from './swarm.js';

export const variants = [classic, bouncy, swarm];

export function getVariant(slug) {
    return variants.find((v) => v.slug === slug);
}
