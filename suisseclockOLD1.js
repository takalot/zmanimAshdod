/* =================================================================
   suisseclock.js
   Montre analogique style CFF (Chemins de Fer Fédéraux suisses)
   Utilisation : window.initSuisseClock('id-du-canvas', tailleEnPx)
================================================================= */

window.initSuisseClock = function(canvasId, sizePx) {

    /* ── Récupère le canvas dans le DOM ── */
    var canvas = document.getElementById(canvasId);
    if (!canvas) return; /* sécurité : on arrête si le canvas n'existe pas */

    /* ── Taille du canvas en pixels (carré) ── */
    var SIZE      = sizePx || 300;
    canvas.width  = SIZE;
    canvas.height = SIZE;

    /* =============================================================
       CONSTRUCTEUR Clock
       canvas : élément <canvas>
       radius : rayon du cadran en pixels
    ============================================================= */
    var Clock = function(canvas, radius) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d'); /* contexte de dessin 2D */
        this.radius = radius;
        this.update(); /* premier rendu immédiat */
    };

    /* =============================================================
       update() — appelée à chaque frame par requestAnimationFrame
       Efface le canvas puis redessine tous les éléments dans l'ordre
    ============================================================= */
    Clock.prototype.update = function() {
        /* centre du canvas recalculé à chaque frame (résistant au resize) */
        this.center = { x: this.canvas.width * 0.5, y: this.canvas.height * 0.5 };

        /* efface tout avant de redessiner */
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        /* ordre de dessin : du fond vers l'avant */
        this.drawBezel();      /* 1. lunette argentée (anneau extérieur) */
        this.drawFace();       /* 2. cadran ivoire */
        this.drawMarkers();    /* 3. graduations minutes et heures */
        this.drawHourHand();   /* 4. aiguille des heures */
        this.drawMinuteHand(); /* 5. aiguille des minutes */
        this.drawSecondHand(); /* 6. trotteuse rouge */
        this.drawCenterDot();  /* 7. point central rouge (par-dessus tout) */
    };

    /* =============================================================
       drawBezel() — lunette argentée autour du cadran
       Dessinée en deux passes :
         1. ombre portée noire (donne la profondeur)
         2. anneau rempli d'un gradient linéaire argenté
    ============================================================= */
    Clock.prototype.drawBezel = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        var outerR = r * 1.10; /* rayon extérieur de la lunette = 110% du cadran */

        /* — Passe 1 : ombre portée sous la lunette — */
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
        this.ctx.shadowColor   = 'rgba(0,0,0,0.7)';  /* ombre noire semi-transparente */
        this.ctx.shadowBlur    = r * 0.18;            /* flou proportionnel au rayon */
        this.ctx.shadowOffsetY = r * 0.04;            /* légèrement décalée vers le bas */
        this.ctx.fillStyle     = '#000';
        this.ctx.fill();
        this.ctx.restore(); /* on reset l'ombre pour ne pas affecter la suite */

        /* — Gradient argenté diagonal (coin haut-gauche → coin bas-droit) — */
        var g = this.ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
        g.addColorStop(0.00, '#e8e8e8'); /* gris clair */
        g.addColorStop(0.10, '#ffffff'); /* blanc brillant */
        g.addColorStop(0.20, '#c8c8c8'); /* gris moyen */
        g.addColorStop(0.35, '#f5f5f5'); /* presque blanc */
        g.addColorStop(0.50, '#a0a0a0'); /* gris foncé (ombre) */
        g.addColorStop(0.65, '#f0f0f0'); /* retour clair */
        g.addColorStop(0.80, '#d0d0d0'); /* gris doux */
        g.addColorStop(0.90, '#ffffff'); /* blanc brillant */
        g.addColorStop(1.00, '#b0b0b0'); /* gris final */

        /* — Passe 2 : anneau = grand cercle MOINS petit cercle (even-odd) — */
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerR, 0, 2 * Math.PI); /* cercle extérieur */
        this.ctx.closePath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI, true); /* cercle intérieur (sens inverse = trou) */
        this.ctx.fillStyle = g;
        this.ctx.fill(); /* remplit l'espace entre les deux cercles */

        /* — Liseré intérieur sombre pour séparer lunette et cadran — */
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth   = r * 0.012;
        this.ctx.stroke();
    };

    /* =============================================================
       drawFace() — cadran ivoire avec halo lumineux central
       Deux passes de remplissage sur le même cercle :
         1. couleur de base ivoire/crème
         2. gradient radial blanc→transparent→brun clair (effet lumière)
    ============================================================= */
    Clock.prototype.drawFace = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;

        /* — Fond ivoire uni — */
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#f0ede6'; /* blanc cassé / ivoire chaud */
        this.ctx.fill();

        /* — Halo lumineux : gradient radial légèrement décentré vers le haut — */
        var radial = this.ctx.createRadialGradient(
            cx, cy - r * 0.1, 0,  /* centre du halo : légèrement au-dessus du centre */
            cx, cy,            r   /* bord extérieur du gradient */
        );
        radial.addColorStop(0.0, 'rgba(255,255,255,0.55)'); /* blanc brillant au centre */
        radial.addColorStop(0.6, 'rgba(255,255,255,0.0)');  /* fondu vers transparent */
        radial.addColorStop(1.0, 'rgba(180,160,130,0.18)'); /* légère teinte dorée en bordure */
        this.ctx.fillStyle = radial;
        this.ctx.fill(); /* superposé sur le fond ivoire */
    };

    /* =============================================================
       drawMarkers() — graduations du cadran
       60 traits au total, 3 tailles :
         - traits fins    : minutes simples (48 traits)
         - traits épais   : chaque 5 minutes = heures (12 traits)
         - traits très épais : 12h / 3h / 6h / 9h (4 traits)
       Convention angulaire : angle 0 = 12h, sens horaire
         x = sin(angle) × distance
         y = -cos(angle) × distance  (canvas : Y croît vers le bas)
    ============================================================= */
    Clock.prototype.drawMarkers = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;

        for (var i = 1; i <= 60; i++) {

            /* angle en radians, sens horaire depuis 12h */
            var angle = (Math.PI * 2) * (i / 60);

            /* classification du marqueur */
            var isHour    = (i % 5  === 0); /* toutes les 5 divisions = heure */
            var isQuarter = (i % 15 === 0); /* toutes les 15 divisions = quart (3h/6h/9h/12h) */

            /* bord extérieur du trait : 92% du rayon */
            var outerD = r * 0.92;

            /* bord intérieur : plus long = plus proche du centre */
            var innerD = isQuarter ? r * 0.68  /* quart  : long  */
                       : isHour    ? r * 0.72  /* heure  : moyen */
                       :             r * 0.84; /* minute : court */

            /* épaisseur du trait */
            var lw = isQuarter ? r * 0.065  /* quart  : très épais */
                   : isHour    ? r * 0.055  /* heure  : épais      */
                   :             r * 0.018; /* minute : fin        */

            this.ctx.strokeStyle = '#1a1a1a'; /* quasi-noir */
            this.ctx.lineWidth   = lw;
            this.ctx.lineCap     = 'butt';    /* bout carré (pas arrondi) */

            this.ctx.beginPath();
            /* point de départ : bord extérieur */
            this.ctx.moveTo( Math.sin(angle) * outerD + cx, -Math.cos(angle) * outerD + cy);
            /* point d'arrivée : bord intérieur */
            this.ctx.lineTo( Math.sin(angle) * innerD + cx, -Math.cos(angle) * innerD + cy);
            this.ctx.stroke();
        }
    };

    /* =============================================================
       drawTrapHand() — aiguille trapézoïdale (style CFF)
       La forme est un trapèze : large à la base (queue), plus étroit à la pointe.

       Paramètres :
         angle     : radians, sens horaire depuis 12h
         length    : longueur de la pointe (fraction du rayon)
         back      : longueur de la queue  (fraction du rayon)
         widthBase : demi-largeur à la base  (fraction du rayon)
         widthTip  : demi-largeur à la pointe (fraction du rayon)
         color     : couleur de remplissage

       Technique : translate au centre + rotate(angle)
         → dans le repère tourné, "haut" (-Y) pointe vers l'heure
    ============================================================= */
    Clock.prototype.drawTrapHand = function(angle, length, back, widthBase, widthTip, color) {
        var ctx = this.ctx;
        var r   = this.radius;
        var cx  = this.center.x;
        var cy  = this.center.y;

        ctx.save();

        /* déplace l'origine au centre de la montre */
        ctx.translate(cx, cy);

        /* tourne le repère : après cette rotation, "haut" = direction de l'aiguille */
        ctx.rotate(angle); /* +angle = sens horaire (corrigé vs doc original -angle) */

        /* ombre portée légère pour donner du relief */
        ctx.shadowColor   = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur    = r * 0.05;
        ctx.shadowOffsetX = r * 0.008; /* décalage X (après rotation) */
        ctx.shadowOffsetY = r * 0.016; /* décalage Y (après rotation) */

        ctx.fillStyle = color;

        ctx.beginPath();
        /* coin arrière-gauche (queue, côté gauche) */
        ctx.moveTo(-widthBase * r / 2,  back   * r);
        /* coin arrière-droit (queue, côté droit) */
        ctx.lineTo( widthBase * r / 2,  back   * r);
        /* coin avant-droit (pointe, côté droit) — en négatif car Y haut = négatif */
        ctx.lineTo( widthTip  * r / 2, -length * r);
        /* coin avant-gauche (pointe, côté gauche) */
        ctx.lineTo(-widthTip  * r / 2, -length * r);
        ctx.closePath();
        ctx.fill();

        ctx.restore(); /* annule translate + rotate */
    };

    /* =============================================================
       drawHourHand() — aiguille des heures
       Utilise l'heure LOCALE (new Date()) incluant les minutes et secondes
       pour que l'aiguille progresse doucement entre les heures.
    ============================================================= */
    Clock.prototype.drawHourHand = function() {
        var now = new Date();

        /* heure décimale sur 12h :
           ex. 10h30m00s → 10.5, 22h53m → 10.883... */
        var hours = (now.getHours() % 12)   /* heure modulo 12 */
                  + now.getMinutes() / 60   /* + fraction de minute */
                  + now.getSeconds() / 3600;/* + fraction de seconde */

        /* angle proportionnel : 12h = 0, 3h = π/2, 6h = π, etc. */
        var angle = (Math.PI * 2) * (hours / 12);

        /* aiguille courte et large :
           pointe à 52% du rayon, queue à 14%, base 13%, pointe 8.5% */
        this.drawTrapHand(angle, 0.52, 0.14, 0.13, 0.085, '#1a1a1a');
    };

    /* =============================================================
       drawMinuteHand() — aiguille des minutes avec bond CFF
       Comportement :
         - secondes 0..58 : fixe sur le cran courant (pas de mouvement fluide)
         - seconde 59      : animation de bond en 3 phases :
             phase 1 (0→250ms)  : bond rapide vers cran+1+0.10
             phase 2 (250→550ms): recul vers cran+1-0.06
             phase 3 (550→1s)   : calage final sur cran+1 exact
    ============================================================= */
    Clock.prototype.drawMinuteHand = function() {
        var now     = new Date();
        var seconds = now.getSeconds();
        var ms      = now.getMilliseconds() / 1000; /* 0.000 → 0.999 */
        var minutes = now.getMinutes();             /* 0 → 59 */
        var target  = minutes + 1; /* cran de destination (prochaine minute) */
        var displayMinutes;

        if (seconds === 59) {
            /* ── Animation de bond sur la 59e seconde ── */
            var t = ms; /* t : 0.000 → 0.999 */
            var offset;

            if (t < 0.25) {
                /* Phase 1 : bond rapide
                   l'aiguille dépasse le cran cible de +0.10 unité */
                offset = (t / 0.25) * 0.10;               /* 0 → +0.10 */

            } else if (t < 0.55) {
                /* Phase 2 : recul élastique (smoothstep)
                   revient légèrement en arrière du cran cible */
                var u = (t - 0.25) / 0.30;
                u = u * u * (3 - 2 * u);                  /* courbe en S */
                offset = 0.10 - u * 0.16;                  /* +0.10 → -0.06 */

            } else {
                /* Phase 3 : calage final (smoothstep)
                   revient exactement sur le cran cible */
                var v = (t - 0.55) / 0.45;
                v = v * v * (3 - 2 * v);                  /* courbe en S */
                offset = -0.06 + v * 0.06;                /* -0.06 → 0.00 */
            }

            /* position finale = cran suivant + offset de l'animation */
            displayMinutes = target + offset;

        } else {
            /* ── Toutes les autres secondes : fixe sur le cran courant ── */
            displayMinutes = minutes;
        }

        /* angle proportionnel : 60 minutes = tour complet */
        var angle = (Math.PI * 2) * (displayMinutes / 60);

        /* aiguille longue et fine :
           pointe à 86% du rayon, queue à 14%, base 9.5%, pointe 5.5% */
        this.drawTrapHand(angle, 0.86, 0.14, 0.095, 0.055, '#1a1a1a');
    };

    /* =============================================================
       drawSecondHand() — trotteuse rouge style CFF
       Comportement authentique :
         - effectue un tour complet en 58.5 secondes (pas 60s)
         - s'immobilise à 12h pendant les 1.5 secondes restantes
         - repart au top de chaque nouvelle minute
       Dessinée comme une ligne + disque à la pointe.
    ============================================================= */
    Clock.prototype.drawSecondHand = function() {
        var now     = new Date();
        var seconds = now.getSeconds();
        var ms      = now.getMilliseconds() / 1000;
        var cx = this.center.x, cy = this.center.y, r = this.radius;

        /* position dans le cycle de 60s : 0.000 → 59.999 */
        var pos = seconds + ms;

        var angle;
        if (pos < 58.5) {
            /* tour en 58.5s : on mappe 0→58.5s sur 0→2π */
            angle = (Math.PI * 2) * (pos / 58.5);
        } else {
            /* pause à 12h les 1.5 dernières secondes */
            angle = 0;
        }

        /* coordonnées de la pointe (78% du rayon vers l'avant) */
        var tipX  = cx + Math.sin(angle) * r * 0.78;
        var tipY  = cy - Math.cos(angle) * r * 0.78;

        /* coordonnées de la queue (22% du rayon vers l'arrière) */
        var tailX = cx - Math.sin(angle) * r * 0.22;
        var tailY = cy + Math.cos(angle) * r * 0.22;

        this.ctx.save();

        /* — Tige de la trotteuse — */
        this.ctx.strokeStyle = '#cc1111';     /* rouge vif */
        this.ctx.lineWidth   = r * 0.022;     /* épaisseur proportionnelle */
        this.ctx.lineCap     = 'butt';        /* bout carré (pas arrondi) */
        this.ctx.shadowColor = 'rgba(0,0,0,0.35)';
        this.ctx.shadowBlur  = r * 0.03;
        this.ctx.beginPath();
        this.ctx.moveTo(tailX, tailY);
        this.ctx.lineTo(tipX,  tipY);
        this.ctx.stroke();

        /* — Disque rouge à la pointe (signature CFF) — */
        var ballR = r * 0.065; /* rayon du disque = 6.5% du rayon total */
        this.ctx.shadowBlur = 0; /* pas d'ombre sur le disque */
        this.ctx.fillStyle  = '#cc1111';
        this.ctx.beginPath();
        this.ctx.arc(tipX, tipY, ballR, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.restore();
    };

    /* =============================================================
       drawCenterDot() — point central rouge
       Dessiné en dernier pour couvrir l'intersection des aiguilles.
    ============================================================= */
    Clock.prototype.drawCenterDot = function() {
        var cx = this.center.x, cy = this.center.y, r = this.radius;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r * 0.028, 0, 2 * Math.PI); /* 2.8% du rayon */
        this.ctx.fillStyle = '#cc1111';
        this.ctx.fill();
    };

    /* =============================================================
       INITIALISATION ET BOUCLE D'ANIMATION
    ============================================================= */

    /* crée l'instance — rayon = 44% de la taille du canvas */
    var clock = new Clock(canvas, SIZE * 0.44);

    /* boucle d'animation : ~60fps via requestAnimationFrame */
    function render() {
        clock.update();
        requestAnimationFrame(render);
    }
    render();
};
