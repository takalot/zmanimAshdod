/* ──────────────────────────────────────────────────────────────
   SUISSE CLOCK CFF STYLE - TRAPÉZOÏDES + BOND MINUTE + TROTTESSE
────────────────────────────────────────────────────────────── */
(function(){
    var canvas = document.getElementById('center-clock-canvas');
    if(!canvas) return;

    var CLOCK_SIZE = 460;

    function clockRadius(){ return CLOCK_SIZE*0.42; }
    function sizeCanvas(){ canvas.width = CLOCK_SIZE; canvas.height = CLOCK_SIZE; }

    var Clock = function(canvas,radius){
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.radius = radius;
        this.update();
    };

    Clock.prototype.drawFace = function(){
        var ctx=this.ctx, r=this.radius, cx=r, cy=r;
        ctx.beginPath();
        ctx.arc(cx,cy,r,0,2*Math.PI);
        ctx.fillStyle = '#f0ede6';
        ctx.fill();
        var radial = ctx.createRadialGradient(cx,cy-r*0.1,0,cx,cy,r);
        radial.addColorStop(0.0,'rgba(255,255,255,0.55)');
        radial.addColorStop(0.6,'rgba(255,255,255,0.0)');
        radial.addColorStop(1.0,'rgba(180,160,130,0.18)');
        ctx.fillStyle=radial;
        ctx.fill();
    };

    Clock.prototype.drawMarkers = function(){
        var ctx=this.ctx,r=this.radius,cx=r,cy=r;
        for(var i=1;i<=60;i++){
            var angle=(Math.PI*2)*(i/60);
            var isHour=i%5===0,isQuarter=i%15===0;
            var outerD=r*0.92, innerD=isQuarter?r*0.68:isHour?r*0.72:r*0.84;
            var lw=isQuarter?r*0.065:isHour?r*0.055:r*0.028;
            ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=lw; ctx.lineCap='butt';
            ctx.beginPath();
            ctx.moveTo(Math.sin(angle)*outerD+cx, -Math.cos(angle)*outerD+cy);
            ctx.lineTo(Math.sin(angle)*innerD+cx, -Math.cos(angle)*innerD+cy);
            ctx.stroke();
        }
    };

    Clock.prototype.drawTrapHand=function(angle,length,back,widthBase,widthTip,color){
        var ctx=this.ctx,r=this.radius,cx=r,cy=r;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(angle); // sens horaire
        ctx.shadowColor='rgba(0,0,0,0.4)';
        ctx.shadowBlur=r*0.05; ctx.shadowOffsetX=r*0.008; ctx.shadowOffsetY=r*0.016;
        ctx.fillStyle=color;
        ctx.beginPath();
        ctx.moveTo(-widthBase*r/2, back*r);
        ctx.lineTo(widthBase*r/2, back*r);
        ctx.lineTo(widthTip*r/2,-length*r);
        ctx.lineTo(-widthTip*r/2,-length*r);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    Clock.prototype.drawHourHand=function(){
        var now=new Date();
        var hours=(now.getHours()%12)+now.getMinutes()/60+now.getSeconds()/3600;
        var angle=(Math.PI*2)*(hours/12);
        this.drawTrapHand(angle,0.52,0.14,0.13,0.085,'#1a1a1a');
    };

    Clock.prototype.drawMinuteHand=function(){
        var now=new Date();
        var minutes=now.getMinutes();
        var seconds=now.getSeconds();
        var ms=now.getMilliseconds()/1000;
        var bounce=0;
        if(seconds===59){
            var t=ms;
            if(t<0.32) bounce=(t/0.32)*1.10;
            else if(t<0.62) bounce=1.10-((t-0.32)/0.30)*0.18;
            else bounce=0.92+((t-0.62)/0.38)*0.08;
            minutes+=bounce;
        }
        var angle=(Math.PI*2)*(minutes/60);
        this.drawTrapHand(angle,0.78,0.14,0.105,0.065,'#1a1a1a');
    };

    Clock.prototype.drawSecondHand=function(){
        var now=new Date();
        var seconds=now.getSeconds()+now.getMilliseconds()/1000;
        var angle=(Math.PI*2)*(seconds/60);
        var cx=this.radius,cy=this.radius,r=this.radius;
        var tipX=cx+Math.sin(angle)*r*0.78;
        var tipY=cy-Math.cos(angle)*r*0.78;
        var tailX=cx-Math.sin(angle)*r*0.22;
        var tailY=cy+Math.cos(angle)*r*0.22;
        this.ctx.save();
        this.ctx.strokeStyle='#cc1111'; this.ctx.lineWidth=r*0.022; this.ctx.lineCap='butt';
        this.ctx.shadowColor='rgba(0,0,0,0.35)'; this.ctx.shadowBlur=r*0.03;
        this.ctx.beginPath();
        this.ctx.moveTo(tailX,tailY);
        this.ctx.lineTo(tipX,tipY);
        this.ctx.stroke();
        var ballR=r*0.065; this.ctx.shadowBlur=0; this.ctx.fillStyle='#cc1111';
        this.ctx.beginPath();
        this.ctx.arc(tipX,tipY,ballR,0,2*Math.PI); this.ctx.fill();
        this.ctx.restore();
    };

    Clock.prototype.drawCenterDot=function(){
        var r=this.radius,cx=r,cy=r;
        this.ctx.beginPath();
        this.ctx.arc(cx,cy,r*0.028,0,2*Math.PI);
        this.ctx.fillStyle='#cc1111'; this.ctx.fill();
    };

    Clock.prototype.update=function(){
        this.center={x:this.canvas.width/2,y:this.canvas.height/2};
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.drawFace();
        this.drawMarkers();
        this.drawHourHand();
        this.drawMinuteHand();
        this.drawSecondHand();
        this.drawCenterDot();
    };

    sizeCanvas();
    var clock=new Clock(canvas,clockRadius());
    function render(){ clock.update(); requestAnimationFrame(render); }
    render();
})();