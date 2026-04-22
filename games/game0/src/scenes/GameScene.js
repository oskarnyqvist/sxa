import Phaser from 'phaser';

const ACCELERATION = 600;
const MAX_SPEED = 400;
const DRAG = 400;
const BOUNCE = 0.8;
const STOP_DISTANCE = 0;
const NUM_POINTS = 3;
const EDGE_MARGIN = 0.25;
const PLAYER_RADIUS = 20;
const INITIAL_SPEED = 150;
const MARKER_RADIUS = 11;
const TRAIL_DURATION = 60000;
const TRAIL_COLOR = 0x4ade80;
const TRAIL_ALPHA = 0.8;
const TRAIL_WIDTH = 4;
const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('game');
    }

    create() {
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        this.trailGraphics = this.add.graphics();
        this.trail = [];

        const saved = parseStateFromURL();
        const cx = WORLD_WIDTH / 2;
        const cy = WORLD_HEIGHT / 2;
        const start = saved ?? {
            px: cx,
            py: cy,
            pvx: Math.cos(Phaser.Math.FloatBetween(0, Math.PI * 2)) * INITIAL_SPEED,
            pvy: Math.sin(Phaser.Math.FloatBetween(0, Math.PI * 2)) * INITIAL_SPEED,
            zoom: 1,
            points: Array.from({ length: NUM_POINTS }, () => ({
                x: Phaser.Math.FloatBetween(cx - 300, cx + 300),
                y: Phaser.Math.FloatBetween(cy - 300, cy + 300),
            })),
        };

        this.player = this.add.circle(start.px, start.py, PLAYER_RADIUS, 0x4ade80);
        this.physics.add.existing(this.player);
        this.player.body.setCircle(PLAYER_RADIUS);
        this.player.body.setDrag(DRAG, DRAG);
        this.player.body.setMaxVelocity(MAX_SPEED);
        this.player.body.setBounce(BOUNCE);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setVelocity(start.pvx, start.pvy);

        this.cameras.main.startFollow(this.player);
        this.cameras.main.setZoom(start.zoom);

        this.points = start.points.map(p => ({ x: p.x, y: p.y }));
        this.markers = this.points.map(p =>
            this.add.circle(p.x, p.y, MARKER_RADIUS, 0xef4444)
        );
        this.nextIndex = 0;

        this.input.on('pointerdown', (pointer) => {
            const p = this.points[this.nextIndex];
            p.x = pointer.worldX;
            p.y = pointer.worldY;
            this.markers[this.nextIndex].setPosition(pointer.worldX, pointer.worldY);
            this.nextIndex = (this.nextIndex + 1) % NUM_POINTS;
        });

        this.input.on('wheel', (_pointer, _over, _dx, dy) => {
            const zoom = Phaser.Math.Clamp(
                this.cameras.main.zoom - Math.sign(dy) * ZOOM_STEP,
                MIN_ZOOM,
                MAX_ZOOM,
            );
            this.cameras.main.setZoom(zoom);
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

        this.trailGraphics.lineStyle(TRAIL_WIDTH, TRAIL_COLOR, TRAIL_ALPHA);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            this.trailGraphics.lineTo(this.trail[i].x, this.trail[i].y);
        }
        this.trailGraphics.strokePath();
    }

    serializeState() {
        const nums = [
            Math.round(this.player.x),
            Math.round(this.player.y),
            Math.round(this.player.body.velocity.x),
            Math.round(this.player.body.velocity.y),
            Math.round(this.cameras.main.zoom * 100),
            ...this.points.flatMap(p => [Math.round(p.x), Math.round(p.y)]),
        ];
        return nums.join('.');
    }
}

function parseStateFromURL() {
    const s = new URLSearchParams(window.location.search).get('s');
    if (!s) return null;
    const n = s.split('.').map(Number);
    if (n.length !== 5 + NUM_POINTS * 2 || n.some(Number.isNaN)) return null;
    const points = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        points.push({ x: n[5 + i * 2], y: n[5 + i * 2 + 1] });
    }
    return { px: n[0], py: n[1], pvx: n[2], pvy: n[3], zoom: n[4] / 100, points };
}
