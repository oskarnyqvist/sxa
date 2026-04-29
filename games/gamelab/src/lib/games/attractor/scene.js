import Phaser from 'phaser';

export function createScene(params) {
    return class extends Phaser.Scene {
        constructor() {
            super('game');
            this.params = params;
        }

        create() {
            const P = this.params;
            this.physics.world.setBounds(0, 0, P.worldWidth, P.worldHeight);
            this.cameras.main.setBounds(0, 0, P.worldWidth, P.worldHeight);

            this.trailGraphics = this.add.graphics();
            this.trail = [];

            const saved = parseStateFromURL(P.numPoints);
            const cx = P.worldWidth / 2;
            const cy = P.worldHeight / 2;
            const start = saved ?? {
                px: cx,
                py: cy,
                pvx: Math.cos(Phaser.Math.FloatBetween(0, Math.PI * 2)) * P.initialSpeed,
                pvy: Math.sin(Phaser.Math.FloatBetween(0, Math.PI * 2)) * P.initialSpeed,
                zoom: 1,
                points: Array.from({ length: P.numPoints }, () => ({
                    x: Phaser.Math.FloatBetween(cx - P.spawnRadius, cx + P.spawnRadius),
                    y: Phaser.Math.FloatBetween(cy - P.spawnRadius, cy + P.spawnRadius),
                })),
            };

            this.player = this.add.circle(start.px, start.py, P.playerRadius, P.playerColor);
            this.physics.add.existing(this.player);
            this.player.body.setCircle(P.playerRadius);
            this.player.body.setDrag(P.drag, P.drag);
            this.player.body.setMaxVelocity(P.maxSpeed);
            this.player.body.setBounce(P.bounce);
            this.player.body.setCollideWorldBounds(true);
            this.player.body.setVelocity(start.pvx, start.pvy);

            this.cameras.main.setZoom(start.zoom);
            this.enableFollow();

            this.points = start.points.map((p) => ({ x: p.x, y: p.y }));
            this.markers = this.points.map((p) =>
                this.add.circle(p.x, p.y, P.markerRadius, P.markerColor),
            );
            this.nextIndex = 0;

            this.dragStart = null;
            this.dragged = false;

            this.input.on('pointerdown', (pointer) => {
                this.dragStart = {
                    x: pointer.x,
                    y: pointer.y,
                    scrollX: this.cameras.main.scrollX,
                    scrollY: this.cameras.main.scrollY,
                };
                this.dragged = false;
            });

            this.input.on('pointermove', (pointer) => {
                if (!this.dragStart || !pointer.isDown) return;
                const dx = pointer.x - this.dragStart.x;
                const dy = pointer.y - this.dragStart.y;
                if (!this.dragged && Math.hypot(dx, dy) > P.dragThreshold) {
                    this.dragged = true;
                    this.cameras.main.stopFollow();
                }
                if (this.dragged) {
                    const zoom = this.cameras.main.zoom;
                    this.cameras.main.scrollX = this.dragStart.scrollX - dx / zoom;
                    this.cameras.main.scrollY = this.dragStart.scrollY - dy / zoom;
                }
            });

            this.input.on('pointerup', (pointer) => {
                if (!this.dragStart) return;
                if (this.dragged) {
                    this.enableFollow();
                } else {
                    const p = this.points[this.nextIndex];
                    p.x = pointer.worldX;
                    p.y = pointer.worldY;
                    this.markers[this.nextIndex].setPosition(pointer.worldX, pointer.worldY);
                    this.nextIndex = (this.nextIndex + 1) % P.numPoints;
                }
                this.dragStart = null;
            });

            this.input.on('wheel', (_pointer, _over, _dx, dy) => {
                const zoom = Phaser.Math.Clamp(
                    this.cameras.main.zoom - Math.sign(dy) * P.zoomStep,
                    P.minZoom,
                    P.maxZoom,
                );
                this.cameras.main.setZoom(zoom);
            });
        }

        update() {
            const P = this.params;
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

            if (Math.sqrt(nearestDistSq) > P.stopDistance) {
                this.physics.accelerateTo(this.player, nearest.x, nearest.y, P.acceleration);
            } else {
                this.player.body.setAcceleration(0, 0);
            }

            this.updateTrail();
        }

        updateTrail() {
            const P = this.params;
            const now = this.time.now;
            this.trail.push({ x: this.player.x, y: this.player.y, t: now });
            while (this.trail.length > 0 && now - this.trail[0].t > P.trailDuration) {
                this.trail.shift();
            }

            this.trailGraphics.clear();
            if (this.trail.length < 2) return;

            this.trailGraphics.lineStyle(P.trailWidth, P.trailColor, P.trailAlpha);
            this.trailGraphics.beginPath();
            this.trailGraphics.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                this.trailGraphics.lineTo(this.trail[i].x, this.trail[i].y);
            }
            this.trailGraphics.strokePath();
        }

        enableFollow() {
            const P = this.params;
            const cam = this.cameras.main;
            cam.startFollow(this.player, false, P.followLerp, P.followLerp);
            cam.setDeadzone(cam.width * P.deadzoneFrac, cam.height * P.deadzoneFrac);
        }

        serializeState() {
            const nums = [
                Math.round(this.player.x),
                Math.round(this.player.y),
                Math.round(this.player.body.velocity.x),
                Math.round(this.player.body.velocity.y),
                Math.round(this.cameras.main.zoom * 100),
                ...this.points.flatMap((p) => [Math.round(p.x), Math.round(p.y)]),
            ];
            return nums.join('.');
        }
    };
}

function parseStateFromURL(numPoints) {
    const s = new URLSearchParams(window.location.search).get('s');
    if (!s) return null;
    const n = s.split('.').map(Number);
    if (n.length !== 5 + numPoints * 2 || n.some(Number.isNaN)) return null;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
        points.push({ x: n[5 + i * 2], y: n[5 + i * 2 + 1] });
    }
    return { px: n[0], py: n[1], pvx: n[2], pvy: n[3], zoom: n[4] / 100, points };
}
