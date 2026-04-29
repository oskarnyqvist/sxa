import { defaults } from './defaults.js';
import { createScene } from './scene.js';
import { variants, getVariant } from './variants/index.js';

export default {
    slug: 'attractor',
    label: 'Attractor',
    description: 'Spelaren dras mot attraktorer',
    route: '/attractor',
    variants,
    getVariant,

    async mount(container, variant) {
        const Phaser = (await import('phaser')).default;
        const params = { ...defaults, ...(variant.params ?? {}) };
        const Scene = createScene(params);
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            backgroundColor: '#1e1e2e',
            scale: {
                mode: Phaser.Scale.RESIZE,
                parent: container,
                width: '100%',
                height: '100%',
            },
            physics: { default: 'arcade', arcade: { debug: false } },
            scene: [Scene],
        });
        const getScene = () => game.scene.getScene('game');
        return {
            destroy: () => game.destroy(true),
            serializeState: () => getScene()?.serializeState() ?? null,
            updateParams: (patch) => {
                const scene = getScene();
                if (scene) Object.assign(scene.params, patch);
            },
            getParams: () => getScene()?.params ?? null,
        };
    },
};
