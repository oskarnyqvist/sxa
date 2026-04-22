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

new Phaser.Game(config);
