/* ══════════════════════════════════════════════
   SCENE CANVAS — cinematic weather backgrounds
══════════════════════════════════════════════ */
const sc = document.getElementById('scene');
const sctx = sc.getContext('2d');
let W, H, sceneType = 'clear', sceneAnim, sceneT = 0;

function resizeScene() {
  W = sc.width = window.innerWidth;
  H = sc.height = window.innerHeight;
}
resizeScene();
window.addEventListener('resize', resizeScene);

/* ─── shared pools ─── */
const STARS = Array.from({length:220},()=>({
  x:Math.random(), y:Math.random()*0.75,
  r:Math.random()*1.5+0.2, a:Math.random()*0.8+0.2,
  phase:Math.random()*Math.PI*2
}));
const CLOUDS = Array.from({length:9},(_,i)=>({
  x:Math.random()*1.8-0.4, y:0.06+i*0.055+Math.random()*0.03,
  w:0.22+Math.random()*0.28, h:0.045+Math.random()*0.035,
  speed:0.00004+Math.random()*0.00007, alpha:0.45+Math.random()*0.4
}));
const RAIN = Array.from({length:240},()=>({
  x:Math.random(), y:Math.random(),
  len:0.035+Math.random()*0.055, speed:0.009+Math.random()*0.007,
  alpha:0.12+Math.random()*0.3, w:0.4+Math.random()*0.7
}));
const SNOW = Array.from({length:140},()=>({
  x:Math.random(), y:Math.random(), r:0.8+Math.random()*2.4,
  speed:0.0006+Math.random()*0.0009, drift:(Math.random()-0.5)*0.0003,
  alpha:0.35+Math.random()*0.5, phase:Math.random()*Math.PI*2
}));

/* ─── helpers ─── */
function skyGrad(colors) {
  const g = sctx.createLinearGradient(0,0,0,H);
  colors.forEach(([stop,col])=>g.addColorStop(stop,col));
  return g;
}
function radGlow(x,y,r,col0,col1){
  const g=sctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,col0);g.addColorStop(1,col1);
  return g;
}
function drawHorizonHaze(y,col,alpha){
  sctx.save();sctx.globalAlpha=alpha;
  const g=sctx.createLinearGradient(0,y-H*0.06,0,y+H*0.06);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(0.5,col);g.addColorStop(1,'rgba(0,0,0,0)');
  sctx.fillStyle=g;sctx.fillRect(0,y-H*0.06,W,H*0.12);sctx.restore();
}

/* ─── CLEAR ─── */
function drawClear(t) {
  const hr=new Date().getHours();
  const isDay=hr>=6&&hr<20;
  const dusk=hr>=17&&hr<20;
  const dawn=hr>=5&&hr<8;

  if(isDay){
    // SKY
    let skyColors;
    if(dusk) skyColors=[[0,'#0a0520'],[0.25,'#3a1060'],[0.5,'#c04030'],[0.75,'#f07830'],[1,'#ffd090']];
    else if(dawn) skyColors=[[0,'#08102a'],[0.3,'#402060'],[0.6,'#e06050'],[0.85,'#f8a060'],[1,'#ffd090']];
    else skyColors=[[0,'#0d2550'],[0.3,'#1a5a9a'],[0.65,'#3a8ac8'],[1,'#7dc4e8']];
    sctx.fillStyle=skyGrad(skyColors);sctx.fillRect(0,0,W,H);

    // SUN position varies by hour
    const sunPct = Math.max(0,Math.min(1,(hr-6)/14));
    const sunX = W*(0.1+sunPct*0.8);
    const sunY = H*(0.12+Math.sin(sunPct*Math.PI)*(-0.08)+0.08);
    // glow halo
    sctx.fillStyle=radGlow(sunX,sunY,W*0.22,
      dusk||dawn?'rgba(255,140,40,0.35)':'rgba(255,240,100,0.22)',
      'rgba(255,180,0,0)');
    sctx.beginPath();sctx.arc(sunX,sunY,W*0.22,0,Math.PI*2);sctx.fill();
    // mid glow
    sctx.fillStyle=radGlow(sunX,sunY,W*0.08,
      dusk||dawn?'rgba(255,100,20,0.7)':'rgba(255,240,120,0.65)',
      'rgba(255,200,0,0)');
    sctx.beginPath();sctx.arc(sunX,sunY,W*0.08,0,Math.PI*2);sctx.fill();
    // core
    sctx.fillStyle=dusk||dawn?'rgba(255,160,60,0.95)':'rgba(255,252,200,1)';
    sctx.beginPath();sctx.arc(sunX,sunY,W*0.025,0,Math.PI*2);sctx.fill();

    // light rays
    if(!dusk&&!dawn){
      sctx.save();sctx.globalAlpha=0.03+Math.sin(t*0.0005)*0.012;
      for(let i=0;i<8;i++){
        const a=i/8*Math.PI*2+t*0.0001;
        sctx.fillStyle='rgba(255,240,120,1)';
        sctx.beginPath();sctx.moveTo(sunX,sunY);
        sctx.lineTo(sunX+Math.cos(a-0.05)*W,sunY+Math.sin(a-0.05)*H);
        sctx.lineTo(sunX+Math.cos(a+0.05)*W,sunY+Math.sin(a+0.05)*H);
        sctx.closePath();sctx.fill();
      }
      sctx.restore();
    }

    // light clouds (3 max for clear)
    CLOUDS.slice(0,3).forEach(c=>{
      c.x+=c.speed;if(c.x>1.6)c.x=-0.4;
      const col=dusk||dawn?'rgba(255,180,120,1)':'rgba(255,255,255,1)';
      drawSmoothCloud(c.x*W,c.y*H*0.65,c.w*W,c.h*H,c.alpha*(dusk||dawn?0.55:0.45),col);
    });

    // GROUND — horizon line
    const gy=H*0.72;
    // distant ground gradient
    const gg=sctx.createLinearGradient(0,gy,0,H);
    if(dusk||dawn){gg.addColorStop(0,'#3a2218');gg.addColorStop(0.5,'#1e1008');gg.addColorStop(1,'#100804');}
    else{gg.addColorStop(0,'#2a5e22');gg.addColorStop(0.4,'#1e4a18');gg.addColorStop(1,'#112e0e');}
    sctx.fillStyle=gg;sctx.fillRect(0,gy,W,H-gy);

    // rolling hill silhouette
    sctx.fillStyle=dusk||dawn?'#1a0e06':'#1e4018';
    sctx.beginPath();sctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){
      const y=gy+Math.sin(x/W*Math.PI*2.5+1)*H*0.04+Math.sin(x/W*Math.PI*5.2)*H*0.02;
      x===0?sctx.moveTo(x,y):sctx.lineTo(x,y);
    }
    sctx.lineTo(W,H);sctx.closePath();sctx.fill();

    // far mountains
    [[0.18,0.18,0.4],[0.5,0.16,0.36],[0.82,0.2,0.45]].forEach(([mx,mh,mw])=>{
      const col=dusk||dawn?'rgba(80,30,20,0.5)':'rgba(30,60,25,0.45)';
      sctx.fillStyle=col;
      sctx.beginPath();sctx.moveTo((mx-mw/2)*W,gy+4);sctx.lineTo(mx*W,gy-mh*H);sctx.lineTo((mx+mw/2)*W,gy+4);sctx.closePath();sctx.fill();
    });

    // horizon atmospheric haze
    drawHorizonHaze(gy, dusk||dawn?'rgba(220,100,30,0.15)':'rgba(180,220,255,0.12)', 1);

  } else {
    // NIGHT CLEAR
    sctx.fillStyle=skyGrad([[0,'#02040e'],[0.5,'#040818'],[0.85,'#06101e'],[1,'#0a1428']]);
    sctx.fillRect(0,0,W,H);

    // Milky Way band
    sctx.save();sctx.globalAlpha=0.06;
    const mwG=sctx.createLinearGradient(W*0.2,0,W*0.8,H*0.6);
    mwG.addColorStop(0,'rgba(180,180,255,0)');
    mwG.addColorStop(0.5,'rgba(200,200,255,1)');
    mwG.addColorStop(1,'rgba(180,180,255,0)');
    sctx.fillStyle=mwG;
    sctx.beginPath();sctx.ellipse(W*0.5,H*0.3,W*0.5,H*0.12,0.4,0,Math.PI*2);sctx.fill();
    sctx.restore();

    // stars
    STARS.forEach(s=>{
      const tw=Math.sin(t*0.001+s.phase);
      sctx.save();sctx.globalAlpha=s.a*(0.5+tw*0.5);
      sctx.fillStyle='#fff';
      sctx.beginPath();sctx.arc(s.x*W,s.y*H*0.75,s.r,0,Math.PI*2);sctx.fill();
      sctx.restore();
    });

    // MOON
    const mx=W*0.76,my=H*0.15;
    sctx.fillStyle=radGlow(mx,my,W*0.1,'rgba(200,215,255,0.18)','rgba(180,200,255,0)');
    sctx.beginPath();sctx.arc(mx,my,W*0.1,0,Math.PI*2);sctx.fill();
    sctx.fillStyle='rgba(235,242,255,0.92)';
    sctx.beginPath();sctx.arc(mx,my,W*0.032,0,Math.PI*2);sctx.fill();
    sctx.fillStyle='rgba(6,10,22,0.88)';
    sctx.beginPath();sctx.arc(mx+W*0.014,my-H*0.006,W*0.025,0,Math.PI*2);sctx.fill();

    // ground
    const ngy=H*0.72;
    sctx.fillStyle=skyGrad([[0,'#0a1610'],[1,'#04080a']]);
    sctx.fillRect(0,ngy,W,H-ngy);
    // dark hill
    sctx.fillStyle='rgba(5,10,8,0.95)';
    sctx.beginPath();sctx.moveTo(0,H);
    for(let x=0;x<=W;x+=4){
      const y=ngy+Math.sin(x/W*Math.PI*2.5+1)*H*0.04+Math.sin(x/W*Math.PI*5.2)*H*0.02;
      x===0?sctx.moveTo(x,y):sctx.lineTo(x,y);
    }
    sctx.lineTo(W,H);sctx.closePath();sctx.fill();
    drawHorizonHaze(ngy,'rgba(100,140,200,0.08)',1);
  }
}

/* ─── smooth cloud helper ─── */
function drawSmoothCloud(cx,cy,cw,ch,alpha,col){
  sctx.save();sctx.globalAlpha=alpha;sctx.fillStyle=col;
  const rx=cw/2,ry=ch/2;
  // blur effect via multiple overlapping ellipses
  [[0,0,1,1],[-.38,.18,.52,.68],[.38,.14,.48,.62],[-.14,-.22,.55,.55],[.15,-.18,.5,.5]].forEach(([ox,oy,sx,sy])=>{
    sctx.beginPath();sctx.ellipse(cx+ox*rx,cy+oy*ry,rx*sx,ry*sy,0,0,Math.PI*2);sctx.fill();
  });
  sctx.restore();
}

/* ─── RAIN ─── */
function drawRain(t) {
  // dark blue-grey sky
  sctx.fillStyle=skyGrad([[0,'#06080e'],[0.45,'#0c1018'],[0.8,'#101520'],[1,'#141a28']]);
  sctx.fillRect(0,0,W,H);

  // heavy cloud cover — 2 layers
  CLOUDS.forEach((c,i)=>{
    c.x+=c.speed*(i<4?0.8:0.5);if(c.x>1.6)c.x=-0.5;
    const alpha=i<4?c.alpha*0.65:c.alpha*0.45;
    const col=i<4?'rgba(28,32,44,1)':'rgba(40,45,60,1)';
    drawSmoothCloud(c.x*W,c.y*H*(i<4?0.52:0.68),c.w*W*1.3,c.h*H*1.5,alpha,col);
  });

  // ground
  const gy=H*0.74;
  sctx.fillStyle=skyGrad([[0,'#0a1210'],[1,'#060c08']]);
  sctx.fillRect(0,gy,W,H-gy);
  // subtle terrain line
  sctx.fillStyle='rgba(8,14,10,0.95)';
  sctx.beginPath();sctx.moveTo(0,H);
  for(let x=0;x<=W;x+=6){
    const y=gy+Math.sin(x/W*Math.PI*3)*H*0.025;
    x===0?sctx.moveTo(x,y):sctx.lineTo(x,y);
  }
  sctx.lineTo(W,H);sctx.closePath();sctx.fill();

  // puddle sheen
  [[0.25,0.9,0.1,0.012],[0.55,0.94,0.07,0.01],[0.72,0.97,0.05,0.008]].forEach(([rx,ry,rw,rh])=>{
    sctx.fillStyle=radGlow(rx*W,ry*H,rw*W,'rgba(120,160,220,0.14)','rgba(80,120,180,0)');
    sctx.beginPath();sctx.ellipse(rx*W,ry*H,rw*W,rh*H,0,0,Math.PI*2);sctx.fill();
  });

  // atmospheric haze near ground
  drawHorizonHaze(gy,'rgba(80,100,140,0.15)',1);

  // RAIN
  RAIN.forEach(p=>{
    p.y+=p.speed;p.x+=p.speed*0.16;
    if(p.y>1){p.y=-0.04;p.x=Math.random();}
    if(p.x>1)p.x=Math.random()*0.2;
    sctx.save();sctx.globalAlpha=p.alpha;
    sctx.strokeStyle='rgba(160,200,255,1)';sctx.lineWidth=p.w;sctx.lineCap='round';
    sctx.beginPath();
    sctx.moveTo(p.x*W,p.y*H);
    sctx.lineTo(p.x*W+p.len*W*0.15,p.y*H+p.len*H*0.95);
    sctx.stroke();sctx.restore();
  });
}

/* ─── STORM ─── */
function drawStorm(t) {
  sctx.fillStyle=skyGrad([[0,'#02020a'],[0.5,'#04040e'],[1,'#08061a']]);
  sctx.fillRect(0,0,W,H);

  // very dark heavy clouds
  CLOUDS.forEach((c,i)=>{
    c.x+=c.speed*(1.2-i*0.05);if(c.x>1.7)c.x=-0.6;
    drawSmoothCloud(c.x*W,c.y*H*0.65,c.w*W*1.6,c.h*H*2,c.alpha*0.88,'rgba(10,10,20,1)');
  });

  // lightning
  const lCycle=t%240;
  if(lCycle<10){
    const flash=(10-lCycle)/10;
    sctx.fillStyle=`rgba(200,210,255,${flash*0.3})`;
    sctx.fillRect(0,0,W,H);
    if(lCycle<5){
      const lx=(0.25+Math.sin(Math.floor(t/240)*2.7)*0.35)*W;
      // bolt
      sctx.save();
      sctx.shadowBlur=40;sctx.shadowColor='rgba(180,210,255,0.9)';
      sctx.strokeStyle=`rgba(230,240,255,${flash*0.9})`;sctx.lineWidth=1.5;sctx.lineCap='round';sctx.lineJoin='round';
      sctx.beginPath();
      const pts=[[lx,H*0.08],[lx-W*0.018,H*0.3],[lx+W*0.012,H*0.34],[lx-W*0.008,H*0.58],[lx+W*0.006,H*0.62]];
      pts.forEach(([px,py],i)=>i?sctx.lineTo(px,py):sctx.moveTo(px,py));
      sctx.stroke();
      // branch
      sctx.beginPath();sctx.moveTo(lx+W*0.012,H*0.34);
      sctx.lineTo(lx+W*0.04,H*0.52);sctx.stroke();
      sctx.restore();
    }
  }

  // ground
  sctx.fillStyle='#02030a';sctx.fillRect(0,H*0.72,W,H*0.28);
  // distant buildings silhouette
  const bCol='rgba(4,4,14,0.95)';
  [[0.05,0.15,0.06,0.12],[0.12,0.22,0.05,0.16],[0.22,0.18,0.04,0.1],[0.35,0.25,0.07,0.14],
   [0.6,0.2,0.05,0.12],[0.72,0.15,0.06,0.1],[0.82,0.22,0.04,0.14],[0.9,0.18,0.05,0.1]].forEach(([bx,bh,bw,base])=>{
    sctx.fillStyle=bCol;
    sctx.fillRect((bx-bw/2)*W,H*(0.72-bh),bw*W,H*bh+4);
    // windows
    sctx.fillStyle='rgba(255,220,100,0.12)';
    for(let wr=0;wr<3;wr++) for(let wc=0;wc<2;wc++){
      if(Math.random()>0.4)
        sctx.fillRect((bx-bw/2)*W+wc*bw*W*0.35+bw*W*0.15, H*(0.72-bh)+wr*H*bh*0.25+H*bh*0.12, bw*W*0.18, H*bh*0.1);
    }
  });
  drawHorizonHaze(H*0.72,'rgba(60,80,140,0.2)',1);

  // heavy rain
  RAIN.forEach(p=>{
    p.y+=p.speed*1.6;p.x+=p.speed*0.4;
    if(p.y>1){p.y=-0.04;p.x=Math.random();}
    if(p.x>1)p.x=Math.random()*0.2;
    sctx.save();sctx.globalAlpha=p.alpha*0.65;
    sctx.strokeStyle='rgba(140,170,255,1)';sctx.lineWidth=p.w*0.75;sctx.lineCap='round';
    sctx.beginPath();sctx.moveTo(p.x*W,p.y*H);
    sctx.lineTo(p.x*W+p.len*W*0.22,p.y*H+p.len*H*0.88);sctx.stroke();sctx.restore();
  });
}

/* ─── SNOW ─── */
function drawSnow(t) {
  sctx.fillStyle=skyGrad([[0,'#18202e'],[0.4,'#1e2a3a'],[0.75,'#243248'],[1,'#1e2e50']]);
  sctx.fillRect(0,0,W,H);

  // few dim stars
  STARS.slice(0,60).forEach(s=>{
    const tw=Math.sin(t*0.0008+s.phase);
    sctx.save();sctx.globalAlpha=s.a*(0.2+tw*0.15);
    sctx.fillStyle='#ccd8f0';
    sctx.beginPath();sctx.arc(s.x*W,s.y*H*0.55,s.r*0.8,0,Math.PI*2);sctx.fill();
    sctx.restore();
  });

  // cloud cover
  CLOUDS.slice(0,6).forEach(c=>{
    c.x+=c.speed*0.4;if(c.x>1.6)c.x=-0.5;
    drawSmoothCloud(c.x*W,c.y*H*0.55,c.w*W*1.1,c.h*H*1.1,c.alpha*0.38,'rgba(160,180,220,1)');
  });

  // snowy ground — soft white
  const gy=H*0.7;
  // base
  sctx.fillStyle=skyGrad([[0,'#d0e0f0'],[0.3,'#b8d0e8'],[1,'#a0bcd8']]);
  sctx.fillRect(0,gy,W,H-gy);
  // snow drifts — smooth waves
  sctx.fillStyle='rgba(225,238,252,0.9)';
  sctx.beginPath();sctx.moveTo(0,H);
  for(let x=0;x<=W;x+=3){
    const y=gy+Math.sin(x/W*Math.PI*3+0.8)*H*0.035+Math.sin(x/W*Math.PI*7)*H*0.012;
    x===0?sctx.moveTo(x,y):sctx.lineTo(x,y);
  }
  sctx.lineTo(W,H);sctx.closePath();sctx.fill();

  // distant mountains
  [[0.15,H*0.16,W*0.38],[0.5,H*0.2,W*0.45],[0.82,H*0.14,W*0.36]].forEach(([mx,mh,mw])=>{
    // body
    sctx.fillStyle='rgba(140,165,200,0.6)';
    sctx.beginPath();sctx.moveTo(mx*W-mw/2,gy+2);sctx.lineTo(mx*W,gy-mh);sctx.lineTo(mx*W+mw/2,gy+2);sctx.closePath();sctx.fill();
    // snow cap
    sctx.fillStyle='rgba(232,242,252,0.92)';
    sctx.beginPath();sctx.moveTo(mx*W,gy-mh);sctx.lineTo(mx*W-mw*0.18,gy-mh*0.62);sctx.lineTo(mx*W+mw*0.18,gy-mh*0.62);sctx.closePath();sctx.fill();
  });

  drawHorizonHaze(gy,'rgba(180,210,240,0.2)',1);

  // snowflakes
  SNOW.forEach(p=>{
    p.y+=p.speed;p.x+=p.drift+Math.sin(t*0.0007+p.phase)*0.00018;
    if(p.y>1){p.y=-0.02;p.x=Math.random();}
    if(p.x<0)p.x=1;if(p.x>1)p.x=0;
    sctx.save();sctx.globalAlpha=p.alpha;
    sctx.fillStyle='rgba(225,238,255,1)';
    sctx.beginPath();sctx.arc(p.x*W,p.y*H,p.r,0,Math.PI*2);sctx.fill();
    sctx.restore();
  });
}

/* ─── CLOUDY ─── */
function drawCloudy(t) {
  const hr=new Date().getHours();
  const isDay=hr>=6&&hr<20;
  sctx.fillStyle=isDay
    ? skyGrad([[0,'#282c38'],[0.4,'#343848'],[0.75,'#3e4458'],[1,'#484e68']])
    : skyGrad([[0,'#080a10'],[0.5,'#0e1018'],[1,'#141622']]);
  sctx.fillRect(0,0,W,H);

  if(!isDay){
    STARS.slice(0,70).forEach(s=>{
      const tw=Math.sin(t*0.0009+s.phase);
      sctx.save();sctx.globalAlpha=s.a*(0.25+tw*0.18);
      sctx.fillStyle='#fff';
      sctx.beginPath();sctx.arc(s.x*W,s.y*H*0.7,s.r*0.75,0,Math.PI*2);sctx.fill();
      sctx.restore();
    });
  }

  // diffused light source behind clouds
  const lx=W*0.58,ly=H*0.2;
  sctx.fillStyle=radGlow(lx,ly,W*0.28,
    isDay?'rgba(200,210,240,0.12)':'rgba(150,165,210,0.07)',
    'rgba(150,165,210,0)');
  sctx.beginPath();sctx.arc(lx,ly,W*0.28,0,Math.PI*2);sctx.fill();

  // layered cloud cover
  CLOUDS.forEach((c,i)=>{
    c.x+=c.speed*(i<5?0.6:0.35);if(c.x>1.6)c.x=-0.5;
    const yScale=i<5?0.6:0.75;
    const col=isDay
      ? `rgba(${130+i*8},${135+i*7},${155+i*6},1)`
      : `rgba(${18+i*4},${20+i*4},${28+i*5},1)`;
    drawSmoothCloud(c.x*W,c.y*H*yScale,c.w*W*1.25,c.h*H*1.4,c.alpha*(isDay?0.7:0.85),col);
  });

  // ground
  const gy=H*0.72;
  sctx.fillStyle=isDay
    ? skyGrad([[0,'#2a3228'],[1,'#181e16']])
    : skyGrad([[0,'#0c1008'],[1,'#060804']]);
  sctx.fillRect(0,gy,W,H-gy);
  sctx.fillStyle=isDay?'rgba(20,30,18,0.9)':'rgba(6,10,5,0.95)';
  sctx.beginPath();sctx.moveTo(0,H);
  for(let x=0;x<=W;x+=4){
    const y=gy+Math.sin(x/W*Math.PI*2.5)*H*0.03+Math.sin(x/W*Math.PI*6)*H*0.015;
    x===0?sctx.moveTo(x,y):sctx.lineTo(x,y);
  }
  sctx.lineTo(W,H);sctx.closePath();sctx.fill();
  drawHorizonHaze(gy,isDay?'rgba(140,160,200,0.1)':'rgba(60,80,120,0.08)',1);
}

/* ─── FOG ─── */
function drawFog(t) {
  sctx.fillStyle=skyGrad([[0,'#1a1c22'],[0.5,'#22242e'],[1,'#2a2c38']]);
  sctx.fillRect(0,0,W,H);

  // ghostly trees barely visible through fog
  sctx.save();sctx.globalAlpha=0.08;
  sctx.fillStyle='rgba(30,35,28,1)';
  [[0.08,0.68,0.1],[0.2,0.71,0.08],[0.35,0.73,0.07],[0.62,0.72,0.09],[0.78,0.69,0.1],[0.9,0.71,0.08]].forEach(([tx,ty,th])=>{
    sctx.fillRect(tx*W-th*H*0.06,ty*H,th*H*0.12,H*(1-ty));
    sctx.beginPath();sctx.moveTo(tx*W,ty*H-th*H);sctx.lineTo(tx*W-th*H*0.5,ty*H);sctx.lineTo(tx*W+th*H*0.5,ty*H);sctx.closePath();sctx.fill();
  });
  sctx.restore();

  // ground
  sctx.fillStyle='rgba(20,22,20,0.95)';sctx.fillRect(0,H*0.72,W,H*0.28);

  // multiple fog layers at different heights and speeds
  const fogLayers=[
    {y:0.25,h:0.14,speed:0.00012,alpha:0.09},
    {y:0.38,h:0.18,speed:-0.00008,alpha:0.12},
    {y:0.52,h:0.2,speed:0.00015,alpha:0.15},
    {y:0.64,h:0.22,speed:-0.0001,alpha:0.18},
    {y:0.72,h:0.18,speed:0.00018,alpha:0.22},
    {y:0.82,h:0.16,speed:-0.00014,alpha:0.18},
  ];
  fogLayers.forEach(layer=>{
    const offset=Math.sin(t*layer.speed+layer.y*10)*W*0.04;
    const g=sctx.createLinearGradient(0,layer.y*H-layer.h*H/2,0,layer.y*H+layer.h*H/2);
    g.addColorStop(0,'rgba(170,175,188,0)');
    g.addColorStop(0.5,`rgba(170,175,188,${layer.alpha})`);
    g.addColorStop(1,'rgba(170,175,188,0)');
    sctx.fillStyle=g;
    sctx.fillRect(offset,layer.y*H-layer.h*H/2,W,layer.h*H);
  });

  // dense ground fog
  const gfog=sctx.createLinearGradient(0,H*0.62,0,H*0.82);
  gfog.addColorStop(0,'rgba(155,160,175,0)');
  gfog.addColorStop(0.5,'rgba(155,160,175,0.32)');
  gfog.addColorStop(1,'rgba(155,160,175,0)');
  sctx.fillStyle=gfog;sctx.fillRect(0,H*0.62,W,H*0.2);
}

/* ─── MAIN LOOP ─── */
function drawScene() {
  sceneT++;
  sctx.clearRect(0,0,W,H);
  const type=sceneType;
  if(type==='clear'||type==='pcloudy') drawClear(sceneT);
  else if(type==='rain'||type==='drizzle') drawRain(sceneT);
  else if(type==='storm') drawStorm(sceneT);
  else if(type==='snow') drawSnow(sceneT);
  else if(type==='cloudy') drawCloudy(sceneT);
  else if(type==='fog') drawFog(sceneT);
  else drawClear(sceneT);
  sceneAnim=requestAnimationFrame(drawScene);
}
drawScene();

function setScene(type){
  sceneType=type;
}

/* ══════════════════════════════════
   WEATHER WIDGET VISUAL (top left icon)
══════════════════════════════════ */
function buildVisual(type){
  const w=document.getElementById('weatherVisual');w.innerHTML='';
  if(type==='clear'){
    const s=document.createElement('div');s.className='wv-sun';w.appendChild(s);
  } else if(type==='pcloudy'||type==='cloudy'){
    if(type==='pcloudy'){const s=document.createElement('div');s.className='wv-sun';s.style.cssText='width:40px;height:40px;top:2px;left:46px;opacity:.65';w.appendChild(s);}
    const c1=document.createElement('div');c1.className='wv-cloud';c1.style.cssText='width:66px;height:24px;bottom:22px;left:8px;';
    const c2=document.createElement('div');c2.className='wv-cloud';c2.style.cssText='width:80px;height:28px;bottom:8px;left:0';
    w.appendChild(c1);w.appendChild(c2);
  } else if(type==='rain'||type==='drizzle'){
    const c=document.createElement('div');c.className='wv-cloud';c.style.cssText='width:82px;height:28px;top:10px;left:3px;background:rgba(175,185,210,.78)';w.appendChild(c);
    const n=type==='rain'?5:3;
    for(let i=0;i<n;i++){const r=document.createElement('div');r.className='wv-rain';r.style.cssText=`left:${14+i*16}px;top:46px;height:${12+Math.random()*7}px;animation-duration:${.65+Math.random()*.5}s;animation-delay:${-Math.random()*.9}s;`;w.appendChild(r);}
  } else if(type==='storm'){
    const c=document.createElement('div');c.className='wv-cloud';c.style.cssText='width:82px;height:28px;top:6px;left:3px;background:rgba(75,80,110,.82)';w.appendChild(c);
    const l=document.createElement('div');l.className='wv-bolt';w.appendChild(l);
  } else if(type==='snow'){
    const c=document.createElement('div');c.className='wv-cloud';c.style.cssText='width:80px;height:27px;top:10px;left:4px;background:rgba(195,210,235,.7)';w.appendChild(c);
    for(let i=0;i<4;i++){const s=document.createElement('div');s.className='wv-snow';const sz=3+Math.random()*3.5;s.style.cssText=`left:${10+i*20}px;top:52px;width:${sz}px;height:${sz}px;animation-duration:${1.4+Math.random()*.9}s;animation-delay:${-Math.random()*1.4}s;`;w.appendChild(s);}
  } else if(type==='fog'){
    for(let i=0;i<4;i++){const f=document.createElement('div');f.className='wv-fog';f.style.cssText=`width:${55+i*7}px;top:${18+i*17}px;left:${3-i*2}px;animation-delay:${i*.45}s;animation-duration:${2.8+i*.8}s;`;w.appendChild(f);}
  }
}

/* ══════════════════════════════════
   SVG ICONS
══════════════════════════════════ */
function getCondIcon(c,size=22){
  const s=size,h=s/2,q=s/4;
  const icons={
    clear:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><circle cx="${h}" cy="${h}" r="${q}" fill="rgba(255,208,45,.88)"/><g stroke="rgba(255,208,45,.65)" stroke-width="1.4" stroke-linecap="round">${[0,45,90,135,180,225,270,315].map(a=>{const r=a*Math.PI/180,x1=h+Math.cos(r)*(q+1.5),y1=h+Math.sin(r)*(q+1.5),x2=h+Math.cos(r)*(q+4.5),y2=h+Math.sin(r)*(q+4.5);return`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;}).join('')}</g></svg>`,
    pcloudy:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><circle cx="${h-2}" cy="${h-2}" r="${q-1}" fill="rgba(255,198,35,.78)"/><rect x="${s*.14}" y="${s*.44}" width="${s*.72}" height="${s*.28}" rx="${s*.14}" fill="rgba(255,255,255,.72)"/><ellipse cx="${s*.37}" cy="${s*.5}" rx="${s*.22}" ry="${s*.17}" fill="rgba(255,255,255,.72)"/></svg>`,
    cloudy:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><rect x="${s*.1}" y="${s*.37}" width="${s*.8}" height="${s*.32}" rx="${s*.16}" fill="rgba(195,205,225,.68)"/><ellipse cx="${s*.34}" cy="${s*.43}" rx="${s*.24}" ry="${s*.19}" fill="rgba(195,205,225,.68)"/><ellipse cx="${s*.59}" cy="${s*.39}" rx="${s*.19}" ry="${s*.15}" fill="rgba(195,205,225,.63)"/></svg>`,
    drizzle:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><rect x="${s*.1}" y="${s*.2}" width="${s*.8}" height="${s*.28}" rx="${s*.14}" fill="rgba(175,198,228,.62)"/><ellipse cx="${s*.34}" cy="${s*.27}" rx="${s*.22}" ry="${s*.17}" fill="rgba(175,198,228,.62)"/>${[0,1,2].map(i=>`<line x1="${s*(.27+i*.22)}" y1="${s*.58}" x2="${s*(.21+i*.22)}" y2="${s*.76}" stroke="rgba(130,175,255,.75)" stroke-width="1.4" stroke-linecap="round"/>`).join('')}</svg>`,
    rain:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><rect x="${s*.08}" y="${s*.17}" width="${s*.84}" height="${s*.3}" rx="${s*.15}" fill="rgba(145,165,208,.62)"/><ellipse cx="${s*.31}" cy="${s*.24}" rx="${s*.23}" ry="${s*.17}" fill="rgba(145,165,208,.62)"/>${[0,1,2,3].map(i=>`<line x1="${s*(.19+i*.2)}" y1="${s*.57}" x2="${s*(.13+i*.2)}" y2="${s*.8}" stroke="rgba(115,158,255,.82)" stroke-width="1.4" stroke-linecap="round"/>`).join('')}</svg>`,
    storm:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><rect x="${s*.06}" y="${s*.13}" width="${s*.88}" height="${s*.3}" rx="${s*.15}" fill="rgba(95,95,138,.68)"/><ellipse cx="${s*.29}" cy="${s*.21}" rx="${s*.23}" ry="${s*.17}" fill="rgba(95,95,138,.68)"/><polygon points="${s*.47},${s*.49} ${s*.37},${s*.67} ${s*.45},${s*.67} ${s*.35},${s*.85} ${s*.55},${s*.61} ${s*.47},${s*.61}" fill="rgba(255,228,45,.92)"/></svg>`,
    snow:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none"><rect x="${s*.1}" y="${s*.19}" width="${s*.8}" height="${s*.28}" rx="${s*.14}" fill="rgba(195,215,252,.58)"/><ellipse cx="${s*.34}" cy="${s*.25}" rx="${s*.22}" ry="${s*.17}" fill="rgba(195,215,252,.58)"/>${[0,1,2].map(i=>`<circle cx="${s*(.27+i*.22)}" cy="${s*(.67+i*.02)}" r="${s*.038}" fill="rgba(215,235,255,.88)"/>`).join('')}</svg>`,
    fog:`<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" fill="none">${[0,1,2,3].map(i=>`<rect x="${s*.1}" y="${s*(.24+i*.15)}" width="${s*.8}" height="${s*.055}" rx="${s*.028}" fill="rgba(195,205,218,${.38+i*.05})"/>`).join('')}</svg>`
  };
  return icons[c]||icons['clear'];
}

/* ══════════════════════════════════
   SUN ARC
══════════════════════════════════ */
function animateSunArc(sunrise,sunset,tz=0){
  // "Ahora" tiene que medirse en el huso de la ciudad, si no el sol aparece
  // en una posición del arco que no corresponde al lugar consultado.
  const now=new Date(Date.now()+tz*1000);
  const [srH,srM]=sunrise.split(':').map(Number);
  const [ssH,ssM]=sunset.split(':').map(Number);
  const srMin=srH*60+srM,ssMin=ssH*60+ssM,nowMin=now.getUTCHours()*60+now.getUTCMinutes();
  const pct=Math.min(Math.max((nowMin-srMin)/(ssMin-srMin),0),1);
  const tot=ssMin-srMin;
  document.getElementById('dayLength').textContent=`${t('daylength')}: ${Math.floor(tot/60)}h ${tot%60}m`;
  setTimeout(()=>{
    document.getElementById('arcFill').style.strokeDashoffset=(200*(1-pct)).toFixed(1);
    const ang=Math.PI*pct;
    document.getElementById('arcDot').setAttribute('cx',(10+180*pct).toFixed(1));
    document.getElementById('arcDot').setAttribute('cy',(70-Math.sin(ang)*80).toFixed(1));
  },400);
}

/* ══════════════════════════════════
   RENDER
══════════════════════════════════ */
let unit='c',currentCity='';
function toF(c){return Math.round(c*9/5+32);}
function td(c){return unit==='c'?c+'°':toF(c)+'°';}
function wSpeed(km){return unit==='c'?km+' km/h':Math.round(km*.621)+' mph';}
function wDist(km){return unit==='c'?km+' km':Math.round(km*.621)+' mi';}

function render(name){
  const d=CITIES[name];if(!d)return;
  currentCity=name;

  setScene(d.type);
  buildVisual(d.type);

  document.getElementById('cityLabel').textContent=name;
  document.getElementById('countryLabel').textContent=d.country;
  const mt=document.getElementById('mainTemp');
  if(mt.textContent==='—'){
    mt.classList.add('fu');
  }
  mt.textContent=td(d.t);
  document.getElementById('mainCond').textContent=d.cond;
  document.getElementById('mainH').textContent='H '+td(d.h);
  document.getElementById('mainL').textContent='L '+td(d.l);

  document.getElementById('diFeels').textContent=td(d.feels);
  document.getElementById('diFeelsSub').textContent=Math.abs(d.t-d.feels)<=2?t('similar'):d.feels<d.t?t('colder'):t('warmer');
  document.getElementById('diHum').textContent=d.hum+'%';
  document.getElementById('diHumSub').textContent=d.hum<40?t('dry'):d.hum<60?t('comfortable'):t('humid');
  document.getElementById('diWind').textContent=wSpeed(d.wind);
  document.getElementById('diWindSub').textContent=d.windDir+' · '+(d.wind<10?t('calm'):d.wind<30?t('moderate'):t('strong'));
  document.getElementById('diVis').textContent=wDist(d.vis);
  document.getElementById('diVisSub').textContent=d.vis>=10?t('excellent'):d.vis>=5?t('good'):t('poor');

  document.getElementById('hourlyRow').innerHTML=d.hourly.map((h,i)=>`
    <div class="hi${i===0?' now':''}">
      <div class="hi-t">${h.t}</div>
      <div class="hi-ic">${getCondIcon(h.c,20)}</div>
      <div class="hi-tmp">${td(h.temp)}</div>
      <div class="hi-pre">${h.pre?h.pre+'%':''}</div>
    </div>`).join('');
  initHourlyDrag();

  document.getElementById('forecastList').innerHTML=d.daily.map(fc=>`
    <div class="fc">
      <span class="fc-d">${fc.d}</span>
      <div class="fc-ic">${getCondIcon(fc.c,18)}</div>
      <span class="fc-ds">${fc.desc}</span>
      <span class="fc-lo">${td(fc.lo)}</span>
      <div class="fc-bw"><div class="fc-bf" style="width:${fc.pct}%"></div></div>
      <span class="fc-hi">${td(fc.hi)}</span>
      <span class="fc-ch">›</span>
    </div>`).join('');
  document.getElementById('dayDetail').style.display='none';
  bindForecastClicks();

  // AQI 0 es un valor válido, así que hay que comparar contra null y no usar ||
  const hayAqi=d.aqi!=null;
  document.getElementById('aqiNum').textContent=hayAqi?d.aqi:'—';
  document.getElementById('aqiWord').textContent=hayAqi
    ?(d.aqi<=50?t('aqiGood'):d.aqi<=100?t('aqiModerate'):d.aqi<=150?t('aqiSensitive')
      :d.aqi<=200?t('aqiUnhealthy'):t('aqiHazardous')):'—';
  if(hayAqi) setTimeout(()=>{document.getElementById('aqiDot').style.left=Math.min(d.aqi/400*100,100)+'%';},300);

  document.getElementById('sunriseVal').textContent=d.sunrise;
  document.getElementById('sunsetVal').textContent=d.sunset;
  animateSunArc(d.sunrise,d.sunset,d.tz);

  // Escala oficial OMS: 0-2 bajo, 3-5 moderado, 6-7 alto, 8-10 muy alto, 11+ extremo
  const hayUv=d.uv!=null;
  const uvNivel=v=>v<3?['uvLow','uvNoProt']:v<6?['uvModerate','uvSpf30']
                   :v<8?['uvHigh','uvSpf50']:v<11?['uvVeryHigh','uvLimit']
                   :['uvExtreme','uvIndoors'];
  document.getElementById('uvNum').textContent=hayUv?d.uv:'—';
  document.getElementById('uvWord').textContent=hayUv?t(uvNivel(d.uv)[0]):'—';
  document.getElementById('uvSub').textContent=hayUv?t(uvNivel(d.uv)[1]):'—';

  document.querySelectorAll('.saved-item').forEach(el=>el.classList.toggle('active',el.dataset.city===name));

  // ── HERO QUICK STATS ──
  document.getElementById('hs-feels').textContent = td(d.feels);
  document.getElementById('hs-wind').textContent = wSpeed(d.wind) + ' ' + d.windDir;
  const nextRain = d.hourly.find(h=>h.pre>0);
  document.getElementById('hs-rain').textContent = nextRain
    ? `${nextRain.pre}% ${t('at')} ${nextRain.t}` : t('noRain');
  document.getElementById('hs-hum').textContent = d.hum+'%';

  // ── HERO HOURLY BAR ──
  renderHeroHourly(d.hourly);
}

/* ══════════════════════════════════
   HERO HOURLY BAR
══════════════════════════════════ */
let hhOffset = 0;
let hhCurrentHourly = [];
let hhSelected = 0;

function renderHeroHourly(hourly) {
  if(!hourly || !hourly.length) return;
  hhOffset = 0;
  hhSelected = 0;
  hhCurrentHourly = hourly;
  buildHeroHourly();
}

function getHHVisible() {
  const container = document.getElementById('hhScroll');
  if(!container) return 4;
  return Math.max(1, Math.floor(container.offsetWidth / 74));
}

function buildHeroHourly() {
  const container = document.getElementById('hhScroll');
  if(!container || !hhCurrentHourly.length) return;
  const visible = getHHVisible();
  const slice = hhCurrentHourly.slice(hhOffset, hhOffset + visible);

  container.innerHTML = slice.map((h, i) => {
    const globalIdx = hhOffset + i;
    const isSelected = globalIdx === hhSelected;
    return `<div class="hh-item${isSelected ? ' hh-now' : ''}" data-idx="${globalIdx}">
      <div class="hh-time">${h.t}</div>
      <div class="hh-icon">${getCondIcon(h.c, 22)}</div>
      <div class="hh-tmp">${td(h.temp)}</div>
      <div class="hh-rain">${h.pre ? h.pre + '%' : ''}</div>
    </div>`;
  }).join('');

  // click handlers on each hour item
  container.querySelectorAll('.hh-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      hhSelected = idx;
      const h = hhCurrentHourly[idx];
      if(!h) return;
      // update main temp display to show selected hour
      document.getElementById('mainTemp').textContent = td(h.temp);
      document.getElementById('mainCond').textContent = h.t === 'Now' ? CITIES[currentCity]?.cond || '' : h.t;
      // change background scene to match this hour's weather
      setScene(h.c);
      buildVisual(h.c);
      buildHeroHourly(); // re-render to update highlight
    });
  });

  const prev = document.getElementById('hhPrev');
  const next = document.getElementById('hhNext');
  if(prev) prev.style.opacity = hhOffset === 0 ? '0.3' : '1';
  if(next) next.style.opacity = hhOffset >= hhCurrentHourly.length - visible ? '0.3' : '1';
}

document.getElementById('hhPrev').addEventListener('click', () => {
  if(hhOffset <= 0) return;
  hhOffset--;
  buildHeroHourly();
});

document.getElementById('hhNext').addEventListener('click', () => {
  const visible = getHHVisible();
  if(hhOffset >= hhCurrentHourly.length - visible) return;
  hhOffset++;
  buildHeroHourly();
});

/* ── AUTO-ADVANCE: check every minute if the current "Now" 
   slot has moved to the next 3h block ── */
function checkHourlyAutoAdvance() {
  if(!hhCurrentHourly.length) return;
  const now = new Date();
  // find which index matches "now" based on real time
  let bestIdx = 0;
  let bestDiff = Infinity;
  hhCurrentHourly.forEach((h, i) => {
    // reconstruct approximate date from label
    if(h.t === 'Now') { bestIdx = i; bestDiff = 0; return; }
    const hNum = parseInt(h.t.split(':')[0]);
    const nowH = now.getHours();
    const diff = Math.abs(hNum - nowH);
    if(diff < bestDiff) { bestDiff = diff; bestIdx = i; }
  });

  // if the "now" slot changed and user is on the current slot, advance
  if(hhSelected === 0 && bestIdx > 0) {
    hhSelected = bestIdx;
    // keep hhOffset so the new "now" is visible
    const visible = getHHVisible();
    if(bestIdx >= hhOffset + visible) hhOffset = bestIdx;
    buildHeroHourly();
  }
}
setInterval(checkHourlyAutoAdvance, 60 * 1000); // check every minute

/* ══════════════════════════════════
   HOURLY DRAG / SWIPE
══════════════════════════════════ */
function initHourlyDrag(){
  const el=document.getElementById('hourlyRow');
  let isDown=false,startX=0,scrollLeft=0;

  el.addEventListener('mousedown',e=>{
    isDown=true;el.classList.add('dragging');
    startX=e.pageX-el.offsetLeft;scrollLeft=el.scrollLeft;
  });
  el.addEventListener('mouseleave',()=>{isDown=false;el.classList.remove('dragging');});
  el.addEventListener('mouseup',()=>{isDown=false;el.classList.remove('dragging');});
  el.addEventListener('mousemove',e=>{
    if(!isDown)return;e.preventDefault();
    const x=e.pageX-el.offsetLeft;
    el.scrollLeft=scrollLeft-(x-startX)*1.2;
  });

  // touch support
  let touchStartX=0,touchScrollLeft=0;
  el.addEventListener('touchstart',e=>{
    touchStartX=e.touches[0].pageX;touchScrollLeft=el.scrollLeft;
  },{passive:true});
  el.addEventListener('touchmove',e=>{
    const dx=touchStartX-e.touches[0].pageX;
    el.scrollLeft=touchScrollLeft+dx;
  },{passive:true});
}

/* ══════════════════════════════════
   FORECAST CLICK
══════════════════════════════════ */
function bindForecastClicks(){
  const rows=document.querySelectorAll('.fc');
  const detail=document.getElementById('dayDetail');
  let openIdx=-1;
  rows.forEach((row,i)=>{
    row.addEventListener('click',()=>{
      if(openIdx===i){detail.style.display='none';row.classList.remove('sel');openIdx=-1;return;}
      rows.forEach(r=>r.classList.remove('sel'));row.classList.add('sel');openIdx=i;
      const d=CITIES[currentCity];if(!d)return;
      const fc=d.daily[i];if(!fc)return;
      detail.style.display='block';
      detail.innerHTML=`<div class="dd"><div class="dd-grid">
        <div class="dd-i"><div class="dd-l">High</div><div class="dd-v">${td(fc.hi)}</div></div>
        <div class="dd-i"><div class="dd-l">Low</div><div class="dd-v">${td(fc.lo)}</div></div>
        <div class="dd-i"><div class="dd-l">Rain chance</div><div class="dd-v">${fc.pct}%</div></div>
        <div class="dd-i"><div class="dd-l">Condition</div><div class="dd-v" style="font-size:13px">${fc.desc}</div></div>
        <div class="dd-i"><div class="dd-l">Day</div><div class="dd-v" style="font-size:13px">${fc.d}</div></div>
        <div class="dd-i"><div class="dd-l">Icon</div><div class="dd-v">${getCondIcon(fc.c,28)}</div></div>
      </div></div>`;
      detail.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
  });
}

/* ══════════════════════════════════
   SAVED LIST
══════════════════════════════════ */
let savedCities=['Buenos Aires','New York','London','Tokyo','Sydney','Reykjavik'];

function renderSavedList(){
  document.getElementById('savedList').innerHTML=savedCities.map(c=>{
    const data=CITIES[c];
    return`<div class="saved-item" data-city="${c}" role="button" tabindex="0"
      aria-label="${c}">
      <span class="si-city">${c}</span>
      <span class="si-temp">${data?td(data.t):'—'}</span>
    </div>`;
  }).join('');
}

/* El listener va una sola vez y por delegación. Antes se registraba dentro de
   renderSavedList(), que corre en cada fetch: los handlers se acumulaban y un
   clic terminaba disparando una petición por cada búsqueda previa. */
const listaGuardados=document.getElementById('savedList');
listaGuardados.addEventListener('click',e=>{
  const item=e.target.closest('.saved-item');
  if(item)fetchWeather(item.dataset.city);
});
listaGuardados.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const item=e.target.closest('.saved-item');
  if(item){e.preventDefault();fetchWeather(item.dataset.city);}
});

/* ══════════════════════════════════
   SEARCH
══════════════════════════════════ */
const POPULAR=['Buenos Aires','New York','London','Tokyo','Sydney','Paris','Berlin','Madrid','Rome','Dubai','Singapore','Toronto','Mexico City','São Paulo','Mumbai','Beijing','Seoul','Bangkok','Istanbul','Moscow','Los Angeles','Chicago','Barcelona','Amsterdam','Miami','Santiago','Lima','Bogotá','Cairo','Lagos','Nairobi','Johannesburg','Casablanca','Riyadh','Karachi','Jakarta','Manila','Kuala Lumpur','Taipei','Osaka','Melbourne','Auckland','Vienna','Prague','Warsaw','Stockholm','Oslo','Helsinki','Athens','Lisbon','Dublin','Zurich','Brussels','Copenhagen','Budapest','Kyiv','Córdoba','Rosario'];
const searchInput=document.getElementById('searchInput');
const searchDropdown=document.getElementById('searchDropdown');

function renderDropdown(q){
  const query=q.trim().toLowerCase();
  const results=query.length===0?POPULAR.slice(0,10).map(n=>({name:n})):POPULAR.filter(n=>n.toLowerCase().includes(query)).slice(0,12).map(n=>({name:n}));
  if(results.length===0){
    searchDropdown.innerHTML=`<div class="sdi"><span style="color:rgba(255,255,255,.25)">Press Enter to search "${q}"</span></div>`;
  } else {
    searchDropdown.innerHTML=results.map(c=>`<div class="sdi" data-city="${c.name}"><span>${c.name}</span></div>`).join('');
  }
  searchDropdown.classList.add('open');
}
function closeDropdown(){searchDropdown.classList.remove('open');}
searchInput.addEventListener('focus',()=>renderDropdown(searchInput.value));
searchInput.addEventListener('input',()=>renderDropdown(searchInput.value));
searchInput.addEventListener('keydown',e=>{
  if(e.key==='Enter'){const q=searchInput.value.trim();if(q){fetchWeather(q);searchInput.value='';closeDropdown();}}
  if(e.key==='Escape')closeDropdown();
});
searchDropdown.addEventListener('click',e=>{
  const item=e.target.closest('.sdi');
  if(item&&item.dataset.city){fetchWeather(item.dataset.city);searchInput.value='';closeDropdown();}
});
document.addEventListener('click',e=>{if(!e.target.closest('.sw'))closeDropdown();});
document.getElementById('searchBtn').addEventListener('click',()=>{
  const q=searchInput.value.trim();if(q){fetchWeather(q);searchInput.value='';closeDropdown();}
});

/* ══════════════════════════════════
   UNITS
══════════════════════════════════ */
document.getElementById('btnC').addEventListener('click',()=>{setUnidad('c');});
document.getElementById('btnF').addEventListener('click',()=>{setUnidad('f');});

function setUnidad(u){
  unit=u;
  const c=document.getElementById('btnC'), f=document.getElementById('btnF');
  c.classList.toggle('active',u==='c'); f.classList.toggle('active',u==='f');
  c.setAttribute('aria-pressed',String(u==='c'));
  f.setAttribute('aria-pressed',String(u==='f'));
  if(currentCity)render(currentCity);
  renderSavedList();          // los chips también muestran temperatura
  guardarPrefs();
}

/* ══════════════════════════════════
   LANGUAGES
══════════════════════════════════ */
const LANGS=[
  {code:'en',name:'English',flag:'🇬🇧'},{code:'es',name:'Español',flag:'🇪🇸'},
  {code:'pt',name:'Português',flag:'🇧🇷'},{code:'fr',name:'Français',flag:'🇫🇷'},
  {code:'de',name:'Deutsch',flag:'🇩🇪'},{code:'it',name:'Italiano',flag:'🇮🇹'},
  {code:'nl',name:'Nederlands',flag:'🇳🇱'},{code:'pl',name:'Polski',flag:'🇵🇱'},
  {code:'ru',name:'Русский',flag:'🇷🇺'},{code:'tr',name:'Türkçe',flag:'🇹🇷'},
  {code:'ar',name:'العربية',flag:'🇸🇦'},{code:'zh',name:'中文',flag:'🇨🇳'},
  {code:'ja',name:'日本語',flag:'🇯🇵'},{code:'ko',name:'한국어',flag:'🇰🇷'},
  {code:'hi',name:'हिन्दी',flag:'🇮🇳'},{code:'sv',name:'Svenska',flag:'🇸🇪'},
  {code:'no',name:'Norsk',flag:'🇳🇴'},{code:'da',name:'Dansk',flag:'🇩🇰'},
  {code:'fi',name:'Suomi',flag:'🇫🇮'},{code:'uk',name:'Українська',flag:'🇺🇦'},
  {code:'cs',name:'Čeština',flag:'🇨🇿'},{code:'ro',name:'Română',flag:'🇷🇴'},
  {code:'hu',name:'Magyar',flag:'🇭🇺'},{code:'el',name:'Ελληνικά',flag:'🇬🇷'},
  {code:'he',name:'עברית',flag:'🇮🇱'},{code:'th',name:'ภาษาไทย',flag:'🇹🇭'},
  {code:'vi',name:'Tiếng Việt',flag:'🇻🇳'},{code:'id',name:'Bahasa Indonesia',flag:'🇮🇩'},
  {code:'ms',name:'Bahasa Melayu',flag:'🇲🇾'},{code:'fa',name:'فارسی',flag:'🇮🇷'},
];
const STR={
  en:{search:'Search any city...',feels:'Real feel',hum:'Humidity',wind:'Wind',vis:'Visibility',hourly:'Hourly forecast',day7:'7-day forecast',aqi:'Air quality',sun:'Sun',sunrise:'Sunrise',sunset:'Sunset',daylength:'Day length',uv:'UV Index',scroll:'scroll'},
  es:{search:'Buscar ciudad...',feels:'Sensación',hum:'Humedad',wind:'Viento',vis:'Visibilidad',hourly:'Por hora',day7:'7 días',aqi:'Calidad del aire',sun:'Sol',sunrise:'Amanecer',sunset:'Atardecer',daylength:'Horas de luz',uv:'Índice UV',scroll:'bajar'},
  pt:{search:'Buscar cidade...',feels:'Sensação',hum:'Umidade',wind:'Vento',vis:'Visibilidade',hourly:'Previsão horária',day7:'7 dias',aqi:'Qualidade do ar',sun:'Sol',sunrise:'Nascer',sunset:'Pôr do sol',daylength:'Duração do dia',uv:'Índice UV',scroll:'rolar'},
  fr:{search:'Rechercher...',feels:'Ressenti',hum:'Humidité',wind:'Vent',vis:'Visibilité',hourly:'Heure par heure',day7:'7 jours',aqi:"Qualité de l'air",sun:'Soleil',sunrise:'Lever',sunset:'Coucher',daylength:'Durée du jour',uv:'Indice UV',scroll:'défiler'},
  de:{search:'Stadt suchen...',feels:'Gefühlt',hum:'Luftfeuchte',wind:'Wind',vis:'Sichtweite',hourly:'Stündlich',day7:'7 Tage',aqi:'Luftqualität',sun:'Sonne',sunrise:'Aufgang',sunset:'Untergang',daylength:'Tageslänge',uv:'UV-Index',scroll:'scrollen'},
};
/* Claves nuevas: descripciones, errores y escalas que antes estaban escritas
   a mano en inglés dentro del render. Solo se cargan en en/es; para los otros
   26 idiomas t() ya cae a inglés en vez de mostrar undefined. */
Object.assign(STR.en,{
  now:'Now',today:'Today',at:'at',noRain:'None expected',
  similar:'Similar',colder:'Colder',warmer:'Warmer',
  dry:'Dry',comfortable:'Comfortable',humid:'Humid',
  calm:'Calm',moderate:'Moderate',strong:'Strong',
  excellent:'Excellent',good:'Good',poor:'Poor',
  aqiGood:'Good',aqiModerate:'Moderate',aqiSensitive:'Sensitive',
  aqiUnhealthy:'Unhealthy',aqiHazardous:'Hazardous',
  uvLow:'Low',uvModerate:'Moderate',uvHigh:'High',uvVeryHigh:'Very high',uvExtreme:'Extreme',
  uvNoProt:'No protection needed',uvSpf30:'SPF 30+',uvSpf50:'SPF 50+',
  uvLimit:'Limit midday exposure',uvIndoors:'Avoid being outside',
  loading:'Loading…',locating:'Finding your location…',
  errNotFound:'Couldn’t find "%s"',
  errKey:'Invalid API key',
  errLimit:'Too many requests — try again in a minute',
  errOffline:'No internet connection',
  errGeneric:'Something went wrong. Try again.'
});
Object.assign(STR.es,{
  now:'Ahora',today:'Hoy',at:'a las',noRain:'Sin lluvia',
  similar:'Similar',colder:'Más frío',warmer:'Más cálido',
  dry:'Seco',comfortable:'Agradable',humid:'Húmedo',
  calm:'Calmo',moderate:'Moderado',strong:'Fuerte',
  excellent:'Excelente',good:'Buena',poor:'Baja',
  aqiGood:'Buena',aqiModerate:'Moderada',aqiSensitive:'Sensibles',
  aqiUnhealthy:'Insalubre',aqiHazardous:'Peligrosa',
  uvLow:'Bajo',uvModerate:'Moderado',uvHigh:'Alto',uvVeryHigh:'Muy alto',uvExtreme:'Extremo',
  uvNoProt:'Sin protección',uvSpf30:'FPS 30+',uvSpf50:'FPS 50+',
  uvLimit:'Evitá el mediodía',uvIndoors:'No te expongas al sol',
  loading:'Cargando…',locating:'Buscando tu ubicación…',
  errNotFound:'No encontramos "%s"',
  errKey:'La clave de la API no es válida',
  errLimit:'Demasiadas consultas — probá en un minuto',
  errOffline:'Sin conexión a internet',
  errGeneric:'Algo falló. Intentá de nuevo.'
});

function t(key){return(STR[currentLang]||STR.en)[key]||STR.en[key]||key;}
let currentLang='en';
function applyLang(){
  // UI labels
  searchInput.placeholder = t('search');
  const feels = document.getElementById('lbl-feels');
  const hum   = document.getElementById('lbl-hum');
  const wind  = document.getElementById('lbl-wind');
  const vis   = document.getElementById('lbl-vis');
  const hourly= document.getElementById('lbl-hourly');
  const day7  = document.getElementById('lbl-7day');
  const aqi   = document.getElementById('lbl-aqi');
  const sun   = document.getElementById('lbl-sun');
  const sunri = document.getElementById('lbl-sunrise');
  const sunse = document.getElementById('lbl-sunset');
  const uv    = document.getElementById('lbl-uv');
  const sh    = document.getElementById('scrollHint');
  const hsf   = document.getElementById('hs-lbl-feels');
  const hsw   = document.getElementById('hs-lbl-wind');

  if(feels)  feels.textContent  = t('feels');
  if(hum)    hum.textContent    = t('hum');
  if(wind)   wind.textContent   = t('wind');
  if(vis)    vis.textContent    = t('vis');
  if(hourly) hourly.textContent = t('hourly');
  if(day7)   day7.textContent   = t('day7');
  if(aqi)    aqi.textContent    = t('aqi');
  if(sun)    sun.textContent    = t('sun');
  if(sunri)  sunri.textContent  = t('sunrise');
  if(sunse)  sunse.textContent  = t('sunset');
  if(uv)     uv.textContent     = t('uv');
  if(sh)     sh.textContent     = t('scroll');
  if(hsf)    hsf.textContent    = t('feels');
  if(hsw)    hsw.textContent    = t('wind');

  // Re-fetch current city so descriptions come in the new language
  if(currentCity) fetchWeather(currentCity);
}
function buildLangList(filter=''){
  return LANGS.filter(l=>!filter||l.name.toLowerCase().includes(filter.toLowerCase()))
    .map(l=>`<div class="li${l.code===currentLang?' active':''}" data-code="${l.code}"><span class="lif">${l.flag}</span><span class="lin">${l.name}</span><span class="lic">${l.code.toUpperCase()}</span></div>`).join('');
}
const langWrap=document.getElementById('langWrap');
const langDropdown=document.getElementById('langDropdown');
const langBtn=document.getElementById('langBtn');
langBtn.addEventListener('click',()=>{
  const open=langDropdown.classList.contains('open');
  if(open){langDropdown.classList.remove('open');langWrap.classList.remove('open');}
  else{
    langDropdown.innerHTML=`<div class="lsw"><input class="lsi" id="lfi" placeholder="Filter..."></div><div id="ll">${buildLangList()}</div>`;
    langDropdown.classList.add('open');langWrap.classList.add('open');
    document.getElementById('lfi').addEventListener('input',e=>{document.getElementById('ll').innerHTML=buildLangList(e.target.value);});
  }
});
langDropdown.addEventListener('click',e=>{
  const item=e.target.closest('.li');if(!item)return;
  currentLang=item.dataset.code;
  const lang=LANGS.find(l=>l.code===currentLang);
  document.getElementById('langFlag').textContent=lang.flag;
  document.getElementById('langName').textContent=lang.code.toUpperCase();
  langDropdown.classList.remove('open');langWrap.classList.remove('open');
  applyLang();
  document.documentElement.lang=currentLang;
  guardarPrefs();
  // el idioma viaja en la petición: hay que releer para traducir la condición
  if(currentCity)fetchWeather(currentCity);
});
document.addEventListener('click',e=>{if(!e.target.closest('.lw')){langDropdown.classList.remove('open');langWrap.classList.remove('open');}});

/* ══════════════════════════════════
   API
══════════════════════════════════ */
const API_KEY='dc4e968c5a4b1a217355da34671b70f5';
const CITIES={};

const OWM='https://api.openweathermap.org/data/2.5';

/* Convierte PM2.5 (µg/m³) al índice AQI de la EPA (escala 0-500),
   que es la que dibuja la barra del panel de calidad del aire. */
function aqiFromPM25(pm){
  const tramos=[[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],
                [55.5,150.4,151,200],[150.5,250.4,201,300],
                [250.5,350.4,301,400],[350.5,500.4,401,500]];
  for(const [cLo,cHi,iLo,iHi] of tramos){
    if(pm<=cHi) return Math.round((iHi-iLo)/(cHi-cLo)*(pm-cLo)+iLo);
  }
  return 500;
}

/* AQI y UV son endpoints aparte y por coordenadas. Si alguno falla, la app
   sigue funcionando: el panel queda en "—" en vez de romper todo el render. */
async function fetchExtras(lat,lon){
  const extras={};
  const [aire,uv]=await Promise.allSettled([
    fetch(`${OWM}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`),
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index`)
  ]);
  try{
    if(aire.status==='fulfilled'&&aire.value.ok){
      const j=await aire.value.json();
      const pm=j.list?.[0]?.components?.pm2_5;
      if(pm!=null) extras.aqi=aqiFromPM25(pm);
    }
  }catch{}
  try{
    if(uv.status==='fulfilled'&&uv.value.ok){
      const j=await uv.value.json();
      const v=j.current?.uv_index;
      if(v!=null) extras.uv=Math.round(v*10)/10;
    }
  }catch{}
  return extras;
}

let cargando=false;
async function fetchWeather(cityName){
  if(cargando) return;
  cargando=true;
  setEstado('cargando');
  try{
    const q=encodeURIComponent(cityName);
    const [rA,rF]=await Promise.all([
      fetch(`${OWM}/weather?q=${q}&appid=${API_KEY}&units=metric&lang=${currentLang}`),
      fetch(`${OWM}/forecast?q=${q}&appid=${API_KEY}&units=metric&lang=${currentLang}`)
    ]);

    if(rA.status===404){setEstado('error',t('errNotFound').replace('%s',cityName));return;}
    if(rA.status===401){setEstado('error',t('errKey'));return;}
    if(rA.status===429){setEstado('error',t('errLimit'));return;}
    if(!rA.ok||!rF.ok){setEstado('error',t('errGeneric'));return;}

    const actual=await rA.json();
    const forecast=await rF.json();
    if(String(actual.cod)!=='200'){setEstado('error',t('errNotFound').replace('%s',cityName));return;}

    const extras=await fetchExtras(actual.coord.lat,actual.coord.lon);
    const realName=actual.name;
    CITIES[realName]=mapAPIData(actual,forecast,extras);
    if(!savedCities.includes(realName)&&savedCities.length<14)savedCities.push(realName);
    guardarPrefs();
    renderSavedList();
    render(realName);
    setEstado('ok');
  }catch(err){
    console.error(err);
    setEstado('error',navigator.onLine?t('errGeneric'):t('errOffline'));
  }finally{
    cargando=false;
  }
}

function mapAPIData(actual,forecast,extra={}){
  const tz=actual.timezone||0;          // offset de la ciudad, en segundos
  const nowCity=Date.now()+tz*1000;     // "ahora" visto desde esa ciudad
  function owmType(id){
    if(id>=200&&id<300)return'storm';if(id>=300&&id<600)return'rain';
    if(id>=600&&id<700)return'snow';if(id>=700&&id<800)return'fog';
    if(id===800)return'clear';if(id===801||id===802)return'pcloudy';return'cloudy';
  }
  function owmIcon(id){
    if(id>=200&&id<300)return'storm';if(id>=300&&id<400)return'drizzle';
    if(id>=500&&id<600)return'rain';if(id>=600&&id<700)return'snow';
    if(id>=700&&id<800)return'fog';if(id===800)return'clear';
    if(id===801||id===802)return'pcloudy';return'cloudy';
  }
  // La hora se formatea en el huso de la ciudad consultada, no en el del navegador.
  // OWM devuelve el offset en segundos, así que corremos el timestamp y leemos en UTC.
  function ts(unix){
    const d=new Date((unix+tz)*1000);
    return d.getUTCHours()+':'+String(d.getUTCMinutes()).padStart(2,'0');
  }

  // Interpolate forecast list (every 3h) into 30-min steps
  const raw = forecast.list;
  const hourly = [];

  for(let i = 0; i < raw.length; i++) {
    const a = raw[i];
    const b = raw[i+1];
    const stepsPerSlot = 6; // 6 × 30min = 3h

    for(let s = 0; s < stepsPerSlot; s++) {
      if(i === raw.length - 1 && s > 0) break; // no extrapolation past last point
      const frac = s / stepsPerSlot;
      const dt = new Date((a.dt + tz) * 1000 + s * 30 * 60 * 1000);
      const diffMin = (dt.getTime() - nowCity) / 60000;

      // skip entries more than 1 minute in the past
      if(diffMin < -1) continue;

      const temp = b
        ? Math.round(a.main.temp + (b.main.temp - a.main.temp) * frac)
        : Math.round(a.main.temp);
      const pre = b
        ? Math.round(a.pop * 100 + (b.pop * 100 - a.pop * 100) * frac)
        : Math.round(a.pop * 100);

      const h = dt.getUTCHours();
      const m = dt.getUTCMinutes();
      const isNow = hourly.length === 0;
      const label = isNow ? t('now') : h + ':' + String(m).padStart(2,'0');

      hourly.push({
        t: label,
        c: owmIcon(a.weather[0].id),
        temp,
        pre: Math.max(0, Math.min(100, pre))
      });
    }
  }
  // Nombres de día traducidos con Intl en vez de la lista fija en inglés.
  // timeZone UTC porque el timestamp ya viene corrido al huso de la ciudad.
  let diaCorto;
  try{ diaCorto=new Intl.DateTimeFormat(currentLang,{weekday:'short',timeZone:'UTC'}); }
  catch{ diaCorto=new Intl.DateTimeFormat('en',{weekday:'short',timeZone:'UTC'}); }
  const dayMap={};
  forecast.list.forEach(item=>{
    const date=new Date((item.dt+tz)*1000);
    const key=date.toISOString().slice(0,10);
    const pop=Math.round((item.pop||0)*100);
    if(!dayMap[key]){
      dayMap[key]={d:diaCorto.format(date),c:owmIcon(item.weather[0].id),
                   desc:item.weather[0].main,lo:item.main.temp_min,
                   hi:item.main.temp_max,pct:pop};
    }else{
      dayMap[key].lo=Math.min(dayMap[key].lo,item.main.temp_min);
      dayMap[key].hi=Math.max(dayMap[key].hi,item.main.temp_max);
      dayMap[key].pct=Math.max(dayMap[key].pct,pop);   // antes se quedaba con el primer slot
    }
  });
  const daily=Object.values(dayMap).slice(0,7)
    .map((d,i)=>({...d,d:i===0?t('today'):d.d,lo:Math.round(d.lo),hi:Math.round(d.hi)}));
  const id=actual.weather[0].id;
  return{
    country:actual.sys.country,type:owmType(id),
    t:Math.round(actual.main.temp),feels:Math.round(actual.main.feels_like),
    h:Math.round(actual.main.temp_max),l:Math.round(actual.main.temp_min),
    cond:actual.weather[0].description.split(' ').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),
    hum:actual.main.humidity,wind:Math.round(actual.wind.speed*3.6),
    windDir:(['N','NE','E','SE','S','SW','W','NW'])[Math.round(actual.wind.deg/45)%8],
    vis:Math.round((actual.visibility||10000)/1000),pres:actual.main.pressure,
    sunrise:ts(actual.sys.sunrise),sunset:ts(actual.sys.sunset),
    tz,lat:actual.coord.lat,lon:actual.coord.lon,
    uv:extra.uv??null,aqi:extra.aqi??null,
    hourly,daily
  };
}

/* ══════════════════════════════════
   ESTADO VISIBLE
══════════════════════════════════ */
/* Antes un error solo llegaba a console.error: para el usuario la app
   simplemente no reaccionaba. Ahora hay feedback en pantalla. */
function setEstado(tipo,msg=''){
  const box=document.getElementById('status');
  const txt=document.getElementById('statusText');
  if(!box) return;
  document.body.classList.toggle('is-loading',tipo==='cargando');
  if(tipo==='cargando'){
    txt.textContent=msg||t('loading');
    box.className='status status--load';
  }else if(tipo==='error'){
    txt.textContent=msg||t('errGeneric');
    box.className='status status--err';
    clearTimeout(setEstado._to);
    setEstado._to=setTimeout(()=>box.className='status',5000);
  }else{
    box.className='status';
  }
}

/* ══════════════════════════════════
   PREFERENCIAS
══════════════════════════════════ */
const CLAVE='weather-app:prefs';

function guardarPrefs(){
  try{
    localStorage.setItem(CLAVE,JSON.stringify({
      cities:savedCities,unit,lang:currentLang,last:currentCity
    }));
  }catch{}   // modo privado o storage lleno: no es motivo para romper nada
}

function cargarPrefs(){
  try{
    const p=JSON.parse(localStorage.getItem(CLAVE)||'{}');
    if(Array.isArray(p.cities)&&p.cities.length) savedCities=p.cities.slice(0,14);
    if(p.unit==='f'){
      unit='f';
      const c=document.getElementById('btnC'), f=document.getElementById('btnF');
      f.classList.add('active'); c.classList.remove('active');
      f.setAttribute('aria-pressed','true'); c.setAttribute('aria-pressed','false');
    }
    if(p.lang&&STR[p.lang]) currentLang=p.lang;
    return p.last||null;
  }catch{ return null; }
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
async function init(){
  const ultima=cargarPrefs();
  applyLang();
  document.documentElement.lang=currentLang;
  renderSavedList();

  // 1) la última ciudad vista, 2) geolocalización, 3) fallback
  if(ultima){ fetchWeather(ultima); return; }

  if(!navigator.geolocation){ fetchWeather('Buenos Aires'); return; }

  setEstado('cargando',t('locating'));
  navigator.geolocation.getCurrentPosition(
    async pos=>{
      const {latitude:lat,longitude:lon}=pos.coords;
      try{
        const r=await fetch(`${OWM}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=${currentLang}`);
        const j=await r.json();
        if(r.ok&&j.name){ fetchWeather(j.name); return; }
      }catch{}
      fetchWeather('Buenos Aires');
    },
    ()=>fetchWeather('Buenos Aires'),          // permiso denegado o error
    {timeout:8000,maximumAge:600000}
  );
}

init();
fetchWeather('Buenos Aires');