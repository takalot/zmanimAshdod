/* =================================================================
   suisseclock.js  —  v4  —  Mondaine SBB Stop2Go authentique
   Hans Hilfiker, 1944

   TROTTEUSE :
     - tige s'arrête au centre du disque (pas de pointe)
     - disque rouge = terminaison de l'aiguille
     - épaisseur gare (R×0.032), disque (R×0.090)
     - glissement continu 58s, décélération + micro-overshoot

   PIVOT CENTRAL :
     - forme rectangulaire/capsule (pas un cercle)
     - rouge, couvre le croisement des aiguilles

   GRANDE AIGUILLE + HEURE :
     - vibrent ensemble (axe commun) au bond
================================================================= */

window.initSuisseClock = function (canvasId, sizePx) {

    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const DPR  = window.devicePixelRatio || 1;
    const SIZE = sizePx || 320;

    canvas.style.width  = SIZE + 'px';
    canvas.style.height = SIZE + 'px';
    canvas.width  = SIZE * DPR;
    canvas.height = SIZE * DPR;

    const ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);

    const DECEL_START = 57.20;
    const SWEEP_END   = 58.00;
    const JUMP_START  = 58.60;
    const JUMP_END    = 59.90;

    class Clock {

        constructor(canvas, ctx, radius) {
            this.canvas = canvas;
            this.ctx    = ctx;
            this.radius = radius;
        }

        update() {
            this.center = { x: SIZE * 0.5, y: SIZE * 0.5 };
            this.ctx.clearRect(0, 0, SIZE, SIZE);
            const now = new Date();
            const pos = now.getSeconds() + now.getMilliseconds() / 1000;
            const { off: jumpOff } = this.jumpOffset(pos);
            this.drawShadow();
            this.drawFace();
            this.drawMarkers();
            this.drawHourHand(now, jumpOff);
            this.drawMinuteHand(now, pos);
            this.drawSecondHand(pos);
           /* this.drawCenter(); */
        }

        jumpOffset(pos) {
            if (pos >= JUMP_END)  return { off: 1.0,  phase: 'calé' };
            if (pos < JUMP_START) return { off: 0.0,  phase: 'stable' };
            const t = (pos - JUMP_START) / (JUMP_END - JUMP_START);
            let off, phase;
            if      (t < 0.10) { const p=t/0.10;        off=1.14*(1-Math.pow(1-p,4));               phase='BOND↑'; }
            else if (t < 0.25) { const p=(t-0.10)/0.15; off=1.14+(0.90-1.14)*(1-Math.pow(1-p,3));  phase='recul↓'; }
            else if (t < 0.42) { const p=(t-0.25)/0.17; off=0.90+(1.04-0.90)*(1-Math.pow(1-p,3));  phase='rebond↑'; }
            else if (t < 0.58) { const p=(t-0.42)/0.16; off=1.04+(0.98-1.04)*(1-Math.pow(1-p,2));  phase='mini↓'; }
            else if (t < 0.75) { const p=(t-0.58)/0.17; off=0.98+(1.005-0.98)*(1-Math.pow(1-p,2)); phase='micro↑'; }
            else               { const p=(t-0.75)/0.25; off=1.005+(1.000-1.005)*(p*p*(3-2*p));     phase='calage'; }
            return { off, phase };
        }

        drawShadow() {
            const { x: cx, y: cy } = this.center;
            const r = this.radius;
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
            this.ctx.shadowColor   = 'rgba(0,0,0,0.20)';
            this.ctx.shadowBlur    = r * 0.12;
            this.ctx.shadowOffsetY = r * 0.04;
            this.ctx.fillStyle = '#000';
            this.ctx.fill();
            this.ctx.restore();
        }

        drawFace() {
            const { x: cx, y: cy } = this.center;
            const r = this.radius;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fillStyle = '#f8f5ef';
            this.ctx.fill();
            const radial = this.ctx.createRadialGradient(cx, cy - r * 0.15, r * 0.1, cx, cy, r);
            radial.addColorStop(0, 'rgba(255,255,255,0.40)');
            radial.addColorStop(1, 'rgba(0,0,0,0.02)');
            this.ctx.fillStyle = radial;
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(0,0,0,0.10)';
            this.ctx.lineWidth = r * 0.008;
            this.ctx.stroke();
        }

        drawMarkers() {
            const { x: cx, y: cy } = this.center;
            const r = this.radius;
            for (let i = 0; i < 60; i++) {
                const angle     = (Math.PI * 2) * (i / 60);
                const isHour    = i % 5  === 0;
                const isQuarter = i % 15 === 0;
                const outer = r * 0.92;
                const inner = isQuarter ? r * 0.66 : isHour ? r * 0.74 : r * 0.85;
                const width = isQuarter ? r * 0.055 : isHour ? r * 0.042 : r * 0.013;
                this.ctx.beginPath();
                this.ctx.moveTo(cx + Math.sin(angle) * outer, cy - Math.cos(angle) * outer);
                this.ctx.lineTo(cx + Math.sin(angle) * inner, cy - Math.cos(angle) * inner);
                this.ctx.strokeStyle = '#111';
                this.ctx.lineWidth   = width;
                this.ctx.lineCap     = 'butt';
                this.ctx.stroke();
            }
        }

        drawTrapHand(angle, length, back, baseW, tipW, color) {
            const r = this.radius;
            const { x: cx, y: cy } = this.center;
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(angle);
            this.ctx.shadowColor   = 'rgba(0,0,0,0.18)';
            this.ctx.shadowBlur    = r * 0.025;
            this.ctx.shadowOffsetY = r * 0.012;
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.moveTo(-baseW * r * 0.5,  back   * r);
            this.ctx.lineTo( baseW * r * 0.5,  back   * r);
            this.ctx.lineTo( tipW  * r * 0.5, -length * r);
            this.ctx.lineTo(-tipW  * r * 0.5, -length * r);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }

        drawHourHand(now, jumpOff) {
            const h = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
            const base = (Math.PI * 2) * (h / 12);
            const vib  = (Math.PI * 2 / 60) * jumpOff * (1 / 12);
            this.drawTrapHand(base + vib, 0.50, 0.13, 0.12, 0.08, '#111');
        }

        drawMinuteHand(now, pos) {
            const { off } = this.jumpOffset(pos);
            const disp = now.getMinutes() + off;
            this.drawTrapHand((Math.PI * 2) * (disp / 60), 0.84, 0.14, 0.085, 0.050, '#111');
        }

        /* ── TROTTEUSE ──────────────────────────────────────────────
           La tige s'arrête exactement au centre du disque.
           Le disque est la terminaison — rien ne dépasse.
        ────────────────────────────────────────────────────────── */
        drawSecondHand(pos) {
            const { x: cx, y: cy } = this.center;
            const r = this.radius;
            let angle;

            if (pos < DECEL_START) {
                angle = (Math.PI * 2) * (pos / 58.0);
            } else if (pos < SWEEP_END) {
                const t    = (pos - DECEL_START) / (SWEEP_END - DECEL_START);
                const a0   = (Math.PI * 2) * (DECEL_START / 58.0);
                const ease = 1 - Math.pow(1 - t, 3);
                const base = a0 + (Math.PI * 2 - a0) * ease;
                const amp  = (Math.PI * 2 / 60) * 0.04;
                angle = base + amp * Math.exp(-t * 9) * Math.sin(t * Math.PI * 3);
            } else {
                angle = 0;
            }

            const diskDist = r * 0.66;

            /* tige : queue → centre du disque (pas au-delà) */
            const stemX0 = cx - Math.sin(angle) * r * 0.22;
            const stemY0 = cy + Math.cos(angle) * r * 0.22;
            const stemX1 = cx + Math.sin(angle) * diskDist;
            const stemY1 = cy - Math.cos(angle) * diskDist;

            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0,0,0,0.20)';
            this.ctx.shadowBlur  = r * 0.020;
            this.ctx.strokeStyle = '#d71920';
            this.ctx.lineWidth   = r * 0.032;
            this.ctx.lineCap     = 'butt';
            this.ctx.beginPath();
            this.ctx.moveTo(stemX0, stemY0);
            this.ctx.lineTo(stemX1, stemY1);
            this.ctx.stroke();

            /* disque = terminaison de l'aiguille */
            const diskX = cx + Math.sin(angle) * diskDist;
            const diskY = cy - Math.cos(angle) * diskDist;
            this.ctx.shadowBlur  = 0;
            this.ctx.fillStyle   = '#d71920';
            this.ctx.beginPath();
            this.ctx.arc(diskX, diskY, r * 0.090, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0,0,0,0.10)';
            this.ctx.lineWidth   = r * 0.006;
            this.ctx.stroke();

            this.ctx.restore();
        }

        /* ── PIVOT — capsule rectangulaire rouge ────────────────────
           Forme droite (rectangle à coins arrondis = capsule),
           orientée verticalement, couvre le croisement des aiguilles.
        ────────────────────────────────────────────────────────── */
        drawCenter() {
            const { x: cx, y: cy } = this.center;
            const r = this.radius;
            const w  = r * 0.030;   // demi-largeur capsule
            const h  = r * 0.052;   // demi-hauteur capsule
            const rr = w;            // rayon coins = demi-largeur → capsule

            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.shadowColor = 'rgba(0,0,0,0.30)';
            this.ctx.shadowBlur  = r * 0.015;
            this.ctx.fillStyle   = '#d71920';

            this.ctx.beginPath();
            this.ctx.moveTo(-w, -h + rr);
            this.ctx.arcTo(-w, -h,  0, -h, rr);
            this.ctx.arcTo( w, -h,  w, -h + rr, rr);
            this.ctx.arcTo( w,  h,  0,  h, rr);
            this.ctx.arcTo(-w,  h, -w,  h - rr, rr);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.shadowBlur = 0;
            this.ctx.fillStyle  = '#111';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r * 0.010, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        }
    }

    const clock = new Clock(canvas, ctx, SIZE * 0.44);

    function render() {
        clock.update();
        requestAnimationFrame(render);
    }

    render();
};
