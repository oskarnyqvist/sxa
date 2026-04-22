import Phaser from 'phaser';

const ACCELERATION = 600;
const MAX_SPEED = 400;
const DRAG = 400;
const BOUNCE = 0.8;
const STOP_DISTANCE = 4;
const NUM_POINTS = 3;
const EDGE_MARGIN = 0.25;
const PLAYER_RADIUS = 30;
const MARKER_RADIUS = 11;
const TRAIL_DURATION = 60000;
const TRAIL_COLOR = 0x4ade80;
const TRAIL_ALPHA_HEAD = 0.8;
const TRAIL_ALPHA_TAIL = 0;
const TRAIL_WIDTH_HEAD = 8;
const TRAIL_WIDTH_TAIL = 1;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('game');
    }

    create() {
        const { width, height } = this.scale.gameSize;
        this.physics.world.setBounds(0, 0, width, height);

        this.trailGraphics = this.add.graphics();
        this.trail = [];

        this.player = this.add.circle(width / 2, height / 2, PLAYER_RADIUS, 0x4ade80);
        this.physics.add.existing(this.player);
        this.player.body.setCircle(PLAYER_RADIUS);
        this.player.body.setDrag(DRAG, DRAG);
        this.player.body.setMaxVelocity(MAX_SPEED);
        this.player.body.setBounce(BOUNCE);
        this.player.body.setCollideWorldBounds(true);

        this.points = [];
        for (let i = 0; i < NUM_POINTS; i++) {
            this.points.push({
                x: Phaser.Math.FloatBetween(width * EDGE_MARGIN, width * (1 - EDGE_MARGIN)),
                y: Phaser.Math.FloatBetween(height * EDGE_MARGIN, height * (1 - EDGE_MARGIN)),
            });
        }
        this.markers = this.points.map(p =>
            this.add.circle(p.x, p.y, MARKER_RADIUS, 0xef4444)
        );
        this.nextIndex = 0;

        this.input.on('pointerdown', (pointer) => {
            const p = this.points[this.nextIndex];
            p.x = pointer.x;
            p.y = pointer.y;
            this.markers[this.nextIndex].setPosition(pointer.x, pointer.y);
            this.nextIndex = (this.nextIndex + 1) % NUM_POINTS;
        });

        this.scale.on('resize', (gameSize) => {
            this.physics.world.setBounds(0, 0, gameSize.width, gameSize.height);
        });
    }

    update() {
        let nearest = this.points[0];
        let nearestDistSq = Infinity;
        for (const point of this.points) {
            const dx = point.x - this.player.x;
            const dy = point.y - this.player.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestDistSq) {
                nearestDistSq = distSq;
                nearest = point;
            }
        }

        if (Math.sqrt(nearestDistSq) > STOP_DISTANCE) {
            this.physics.accelerateTo(this.player, nearest.x, nearest.y, ACCELERATION);
        } else {
            this.player.body.setAcceleration(0, 0);
        }

        this.updateTrail();
    }

    updateTrail() {
        const now = this.time.now;
        this.trail.push({ x: this.player.x, y: this.player.y, t: now });
        while (this.trail.length > 0 && now - this.trail[0].t > TRAIL_DURATION) {
            this.trail.shift();
        }

        this.trailGraphics.clear();
        if (this.trail.length < 2) return;

        for (let i = 1; i < this.trail.length; i++) {
            const age = (now - this.trail[i].t) / TRAIL_DURATION;
            const t = 1 - age;
            const alpha = Phaser.Math.Linear(TRAIL_ALPHA_TAIL, TRAIL_ALPHA_HEAD, t);
            const width = Phaser.Math.Linear(TRAIL_WIDTH_TAIL, TRAIL_WIDTH_HEAD, t);
            this.trailGraphics.lineStyle(width, TRAIL_COLOR, alpha);
            this.trailGraphics.lineBetween(
                this.trail[i - 1].x, this.trail[i - 1].y,
                this.trail[i].x, this.trail[i].y,
            );
        }
    }
}
