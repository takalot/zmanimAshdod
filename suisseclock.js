window.initSuisseClock = function(canvasId, sizePx) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var SIZE = sizePx || 300;
    canvas.width  = SIZE;
    canvas.height = SIZE;

    var Clock = function(canvas, radius) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this.radius = radius;
        this.update();
    };

    Clock.prototype.update = function() {
        this.center = { x: this.canvas.width * 0.5, y: this.canvas.height * 0.5 };
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBezel();
        this.drawFace();
        this.drawMarkers();
        this.drawHourHand();
        this.drawMinuteHand();
        this.drawSecondHand();
        this.drawCenterDot();
    };

    /* ── Lunette argentée ── */
    Clock.prototype.drawBezel = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        var outerR = r * 1.10;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
        this.ctx.shadowColor   = 'rgba(0,0,0,0.7)';
        this.ctx.shadowBlur    = r * 0.18;
        this.ctx.shadowOffsetY = r * 0.04;
        this.ctx.fillStyle     = '#000';
        this.ctx.fill();
        this.ctx.restore();

        var g = this.ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
        g.addColorStop(0.00, '#e8e8e8');
        g.addColorStop(0.10, '#ffffff');
        g.addColorStop(0.20, '#c8c8c8');
        g.addColorStop(0.35, '#f5f5f5');
        g.addColorStop(0.50, '#a0a0a0');
        g.addColorStop(0.65, '#f0f0f0');
        g.addColorStop(0.80, '#d0d0d0');
        g.addColorStop(0.90, '#ffffff');
        g.addColorStop(1.00, '#b0b0b0');
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, true);
        this.ctx.fillStyle = g;
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth   = r * 0.012;
        this.ctx.stroke();
    };

    /* ── Cadran ivoire ── */
    Clock.prototype.drawFace = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#f0ede6';
        this.ctx.fill();
        var radial = this.ctx.createRadialGradient(cx, cy - r * 0.1, 0, cx, cy, r);
        radial.addColorStop(0.0, 'rgba(255,255,255,0.55)');
        radial.addColorStop(0.6, 'rgba(255,255,255,0.0)');
        radial.addColorStop(1.0, 'rgba(180,160,130,0.18)');
        this.ctx.fillStyle = radial;
        this.ctx.fill();
    };

    /* ── Marqueurs ── */
    Clock.prototype.drawMarkers = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        for (var i = 1; i <= 60; i++) {
            var angle     = (Math.PI * 2) * (-i / 60);
            var isHour    = (i % 5  === 0);
            var isQuarter = (i % 15 === 0);
            var outerD = r * 0.92;
            var innerD = isQuarter ? r * 0.68 : isHour ? r * 0.72 : r * 0.84;
            var lw     = isQuarter ? r * 0.065 : isHour ? r * 0.055 : r * 0.018;
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth   = lw;
            this.ctx.lineCap     = 'butt';
            this.ctx.beginPath();
            this.ctx.moveTo(Math.sin(angle) * outerD + cx, Math.cos(angle) * outerD + cy);
            this.ctx.lineTo(Math.sin(angle) * innerD + cx, Math.cos(angle) * innerD + cy);
            this.ctx.stroke();
        }
    };

    /* ── Aiguille rectangulaire bout carré ── */
    Clock.prototype.drawRectHand = function(angle, tipDist, tailDist, width, color) {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);
        this.ctx.shadowColor   = 'rgba(0,0,0,0.45)';
        this.ctx.shadowBlur    = r * 0.05;
        this.ctx.shadowOffsetX = r * 0.01;
        this.ctx.shadowOffsetY = r * 0.02;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(-width * r / 2, -tipDist * r, width * r, (tipDist + tailDist) * r);
        this.ctx.restore();
    };

    /* ── Heure ── */
    Clock.prototype.drawHourHand = function() {
        var now   = new Date();
        var hours = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600;
        var angle = (Math.PI * 2) * (hours / 12);
        this.drawRectHand(angle, 0.52, 0.14, 0.10, '#1a1a1a');
    };

    /* ── Minute : fixe sur le cran, bond de ~0.12 cran à seconds===0 ── */
Clock.prototype.drawMinuteHand = function() {
    var now = new Date();

    var seconds = now.getSeconds();
    var ms = now.getMilliseconds() / 1000;

    var minutes = now.getMinutes();
    var bounce = 0;

    /*
      À 59.000 :
      - la trotteuse repart
      - la minute fait son bond
      EN MÊME TEMPS
    */
    if (seconds === 59) {
        var t = ms;

        if (t < 0.32) {
            // bond vers le cran suivant + léger dépassement
            bounce = (t / 0.32) * 1.10;
        } else if (t < 0.62) {
            // retour en arrière
            bounce = 1.10 - ((t - 0.32) / 0.30) * 0.18;
        } else {
            // calage exact sur le cran suivant
            bounce = 0.92 + ((t - 0.62) / 0.38) * 0.08;
        }

        minutes = minutes + bounce;
    }

    var angle =
        (Math.PI * 2) * (minutes / 60);

    this.drawRectHand(angle, 0.80, 0.16, 0.07, '#1a1a1a');
};

    /* ── Trotteuse : tourne en continu 0→59, marque une pause à 12h
       pendant toute la seconde 59, repart à seconds===0 ms>=4ms ── */
Clock.prototype.drawSecondHand = function() {
    var nowMs = Date.now();

    /*
      Cycle décalé :
      - 59.000 devient le début du cycle
      - 59.000 → 00.000 = début du tour
      - 00.000 ne remet PAS la trotteuse à 12h
    */
    var cycleMs = (nowMs + 1000) % 60000;

    var displaySeconds;

    if (cycleMs < 58500) {
        // tour complet en 58.5 secondes
        displaySeconds = cycleMs / 58500 * 60;
    } else {
        // pause à 12h
        displaySeconds = 60;
    }

    var angle =
        (Math.PI * 2) * (displaySeconds / 60);

    var cx = this.center.x;
    var cy = this.center.y;
    var r = this.radius;

    var tipX  = cx + Math.sin(angle) * r * 0.78;
    var tipY  = cy - Math.cos(angle) * r * 0.78;
    var tailX = cx - Math.sin(angle) * r * 0.22;
    var tailY = cy + Math.cos(angle) * r * 0.22;

    this.ctx.save();

    this.ctx.strokeStyle = '#cc1111';
    this.ctx.lineWidth   = r * 0.022;
    this.ctx.lineCap     = 'butt';
    this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
    this.ctx.shadowBlur  = r * 0.03;

    this.ctx.beginPath();
    this.ctx.moveTo(tailX, tailY);
    this.ctx.lineTo(tipX, tipY);
    this.ctx.stroke();

    var ballR = r * 0.065;

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle  = '#cc1111';

    this.ctx.beginPath();
    this.ctx.arc(tipX, tipY, ballR, 0, 2 * Math.PI);
    this.ctx.fill();

    this.ctx.restore();
};
    /* ── Centre ── */
    Clock.prototype.drawCenterDot = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.028, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#cc1111';
        this.ctx.fill();
    };

    var clock = new Clock(canvas, SIZE * 0.44);
    function render() { clock.update(); requestAnimationFrame(render); }
    render();
};
