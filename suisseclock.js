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

    /* ── Aiguille HEURE et MINUTE — bout carré, corps épais ── */
/* ── Aiguilles originales style suisse ── */
Clock.prototype.drawHand = function(angle, handOptions) {
    var startX =
        Math.sin(angle) *
        (this.radius * handOptions.backwardRadiusRatio) +
        this.center.x;

    var startY =
        Math.cos(angle) *
        (this.radius * handOptions.backwardRadiusRatio) +
        this.center.y;

    var endX =
        Math.sin(angle - Math.PI) *
        (this.radius * handOptions.forwardRadiusRatio) +
        this.center.x;

    var endY =
        Math.cos(angle - Math.PI) *
        (this.radius * handOptions.forwardRadiusRatio) +
        this.center.y;

    this.ctx.shadowColor   = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur    = this.radius * 0.075;
    this.ctx.shadowOffsetY = 1;

    this.ctx.strokeStyle = handOptions.color;
    this.ctx.lineWidth   =
        handOptions.thicknessRatio * this.radius;

    this.ctx.lineCap = 'but';

    this.ctx.beginPath();
    this.ctx.moveTo(startX, startY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    if (handOptions.tipRadiusRatio) {
        this.ctx.fillStyle = handOptions.color;

        this.ctx.beginPath();

        this.ctx.arc(
            endX,
            endY,
            handOptions.tipRadiusRatio * this.radius,
            0,
            2 * Math.PI
        );

        this.ctx.fill();
    }

    this.ctx.shadowBlur    = 0;
    this.ctx.shadowOffsetY = 0;

    if (handOptions.tipRadiusRatio) {
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
};

Clock.prototype.drawHourHand = function() {
    var now = new Date();

    var hours =
        (now.getHours() % 12) +
        now.getMinutes() / 60 +
        now.getSeconds() / 3600;

    var angle =
        (Math.PI * 2) * (-hours / 12);

    this.drawHand(angle, {
        color: '#1a1a1a',
        thicknessRatio: 0.08,
        forwardRadiusRatio: 0.60,
        backwardRadiusRatio: 0.25
    });
};

Clock.prototype.drawMinuteHand = function() {
    var now = new Date();

    var seconds = now.getSeconds();
    var milliseconds = now.getMilliseconds();

    var baseMinutes = now.getMinutes();

    var minuteProgress = 0;

    if (seconds === 59) {
        var t = milliseconds / 1000;

        // effet butée : avance un peu trop vite,
        // dépasse très légèrement, puis revient en place
        minuteProgress =
            t < 0.72
                ? t / 0.72 * 1.018
                : 1.018 - ((t - 0.72) / 0.28) * 0.018;
    }

    var minutes = baseMinutes + minuteProgress;

    var angle =
        (Math.PI * 2) * (-minutes / 60);

    this.drawHand(angle, {
        color: '#1a1a1a',
        thicknessRatio: 0.06,
        forwardRadiusRatio: 0.875,
        backwardRadiusRatio: 0.25
    });
};

Clock.prototype.drawSecondHand = function() {
    var now = new Date();

    var seconds =
        now.getSeconds() +
        now.getMilliseconds() / 1000;

    // Mouvement fluide normal de 0 à 58.5 secondes,
    // puis arrêt à 12h jusqu'à la seconde suivante.
    var displaySeconds;

    if (seconds >= 58.5) {
        displaySeconds = 0;
    } else {
        displaySeconds = seconds / 58.5 * 60;
    }

    var angle =
        (Math.PI * 2) * (-displaySeconds / 60);

    this.drawHand(angle, {
        color: '#cd151c',
        thicknessRatio: 0.0075,
        forwardRadiusRatio: 0.75,
        backwardRadiusRatio: 0.25,
        tipRadiusRatio: 0.075
    });
};

    /* ── Centre ── */
    Clock.prototype.drawCenterDot = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.030, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#888';
        this.ctx.fill();
    };

    var clock = new Clock(canvas, SIZE * 0.44);
    function render() { clock.update(); requestAnimationFrame(render); }
    render();
};
