import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#1e1e2e',
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [GameScene]
};

const game = new Phaser.Game(config);

document.getElementById('share').addEventListener('click', async (e) => {
    const scene = game.scene.getScene('game');
    if (!scene) return;
    const url = new URL(window.location.href);
    url.searchParams.set('s', scene.serializeState());
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, '', url);
    e.target.classList.add('copied');
    e.target.textContent = 'Kopierad!';
    setTimeout(() => {
        e.target.classList.remove('copied');
        e.target.textContent = 'Dela';
    }, 1200);
});
