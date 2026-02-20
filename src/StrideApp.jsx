import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════
// STRIDE — 14-Week Transformation Cockpit
// Full tab routing, animated charts on entry, responsive
// ═══════════════════════════════════════════════════════════════════

const C = {
  bg: "#070B14", bgAlt: "#0C0F15",
  surface: "rgba(14,19,32,0.72)", surfaceSolid: "#0E1320",
  card: "rgba(18,23,33,0.65)", cardHover: "rgba(24,30,42,0.75)",
  cardBorder: "rgba(255,255,255,0.04)", cardBorderHover: "rgba(184,255,87,0.12)",
  mint: "#B8FF57", mintSoft: "rgba(184,255,87,0.10)",
  mintMed: "rgba(184,255,87,0.20)", mintHard: "rgba(184,255,87,0.35)",
  red: "#FF5470", redSoft: "rgba(255,84,112,0.10)",
  blue: "#5B8CFF", blueSoft: "rgba(91,140,255,0.10)",
  orange: "#FFB547", orangeSoft: "rgba(255,181,71,0.10)",
  cyan: "#57FFD8", cyanSoft: "rgba(87,255,216,0.10)",
  purple: "#A78BFA", purpleSoft: "rgba(167,139,250,0.10)",
  text: "#EFF1F5", text2: "#8B95A8", text3: "#4B5468",
  border: "rgba(255,255,255,0.04)",
  grad1: "linear-gradient(135deg, #B8FF57 0%, #57FFD8 50%, #5B8CFF 100%)",
  grad2: "linear-gradient(135deg, #57FFD8 0%, #5B8CFF 50%, #A97CFF 100%)",
  grad3: "linear-gradient(135deg, #B8FF57 0%, #57FFD8 100%)",
};

// ─── DATA ─────────────────────────────────────────────────────────
const WEIGHTS = [
  { week:0, kg:80.5 },{ week:1, kg:77.6 },{ week:2, kg:76.2 },
  { week:3, kg:74.9 },{ week:4, kg:73.7 },{ week:5, kg:73.2 },{ week:6, kg:71.8 },
];
const W_STEPS = [
  { w:1, v:3728 },{ w:2, v:5547 },{ w:3, v:6784 },
  { w:4, v:5262 },{ w:5, v:7000 },{ w:6, v:8362 },
];
const W_NUTR = [
  { w:1, cal:747, pro:72, carb:76, fat:18, fib:9, sug:24, calF:"Low", fibF:"Low", comp:48, flat:46 },
  { w:2, cal:968, pro:134, carb:44, fat:28, fib:9, sug:14, calF:"Low", fibF:"Low", comp:65, flat:64 },
  { w:3, cal:1154, pro:163, carb:39, fat:39, fib:7, sug:17, calF:"Low", fibF:"Low", comp:71, flat:69 },
  { w:4, cal:1203, pro:167, carb:49, fat:36, fib:10, sug:22, calF:"On target", fibF:"Low", comp:77, flat:75 },
  { w:5, cal:1226, pro:165, carb:59, fat:36, fib:10, sug:20, calF:"On target", fibF:"Low", comp:76, flat:74 },
  { w:6, cal:1370, pro:160, carb:83, fat:48, fib:15, sug:44, calF:"On target", fibF:"Low", comp:76, flat:74 },
];
const DAILY_W7 = [
  { day:"Mon", dt:"Feb 16", cal:1275, pro:159, carb:76, fat:35, fib:17, sug:35, comp:86, flat:83, steps:5988, sleep:7, gym:true, wt:71.8 },
  { day:"Tue", dt:"Feb 17", cal:1319, pro:153, carb:102, fat:33, fib:22, sug:47, comp:91, flat:88, steps:470, sleep:7, gym:false, wt:null },
  { day:"Wed", dt:"Feb 18", cal:1238, pro:176, carb:64, fat:31, fib:11, sug:25, comp:79, flat:77, steps:2153, sleep:6.5, gym:true, wt:null },
  { day:"Thu", dt:"Feb 19", cal:1208, pro:163, carb:70, fat:30, fib:8, sug:29, comp:76, flat:74, steps:5903, sleep:6.5, gym:false, wt:null },
];
const DAILY_ALL = [
  { w:1, d:"Mon", cal:879, pro:98, steps:1281, comp:58, gym:true, sleep:5 },
  { w:1, d:"Tue", cal:797, pro:72, steps:4306, comp:56, gym:false, sleep:6 },
  { w:1, d:"Wed", cal:682, pro:77, steps:2882, comp:50, gym:true, sleep:5.5 },
  { w:1, d:"Thu", cal:555, pro:49, steps:5796, comp:29, gym:false, sleep:6 },
  { w:1, d:"Fri", cal:831, pro:78, steps:2435, comp:51, gym:false, sleep:6 },
  { w:1, d:"Sat", cal:555, pro:44, steps:3475, comp:33, gym:false, sleep:6 },
  { w:1, d:"Sun", cal:928, pro:85, steps:5922, comp:59, gym:false, sleep:6 },
  { w:2, d:"Mon", cal:580, pro:56, steps:2501, comp:44, gym:true, sleep:6 },
  { w:2, d:"Tue", cal:860, pro:109, steps:6154, comp:65, gym:false, sleep:6 },
  { w:2, d:"Wed", cal:944, pro:141, steps:4945, comp:75, gym:true, sleep:6 },
  { w:2, d:"Thu", cal:801, pro:117, steps:7141, comp:58, gym:false, sleep:5.5 },
  { w:2, d:"Fri", cal:1108, pro:165, steps:3366, comp:65, gym:true, sleep:6 },
  { w:2, d:"Sat", cal:1208, pro:181, steps:4476, comp:72, gym:false, sleep:8 },
  { w:2, d:"Sun", cal:1278, pro:171, steps:10247, comp:79, gym:false, sleep:6 },
  { w:3, d:"Mon", cal:1243, pro:167, steps:7217, comp:72, gym:true, sleep:5.5 },
  { w:3, d:"Tue", cal:1220, pro:152, steps:1706, comp:84, gym:false, sleep:6 },
  { w:3, d:"Wed", cal:1130, pro:174, steps:5024, comp:71, gym:true, sleep:6 },
  { w:3, d:"Thu", cal:1119, pro:166, steps:8437, comp:67, gym:false, sleep:6 },
  { w:3, d:"Fri", cal:814, pro:104, steps:4192, comp:50, gym:true, sleep:6 },
  { w:3, d:"Sat", cal:1273, pro:201, steps:12544, comp:72, gym:false, sleep:7 },
  { w:3, d:"Sun", cal:1279, pro:177, steps:8365, comp:79, gym:false, sleep:6 },
  { w:4, d:"Mon", cal:1171, pro:148, steps:2319, comp:79, gym:true, sleep:6 },
  { w:4, d:"Tue", cal:1149, pro:173, steps:4724, comp:71, gym:false, sleep:6 },
  { w:4, d:"Wed", cal:1450, pro:164, steps:2612, comp:82, gym:true, sleep:6 },
  { w:4, d:"Thu", cal:1119, pro:187, steps:6413, comp:72, gym:false, sleep:6 },
  { w:4, d:"Fri", cal:1202, pro:163, steps:6999, comp:82, gym:true, sleep:6 },
  { w:4, d:"Sat", cal:1164, pro:165, steps:3934, comp:75, gym:false, sleep:6 },
  { w:4, d:"Sun", cal:1167, pro:166, steps:9836, comp:79, gym:false, sleep:6.5 },
  { w:5, d:"Mon", cal:1224, pro:193, steps:2616, comp:76, gym:true, sleep:6 },
  { w:5, d:"Tue", cal:1190, pro:177, steps:8986, comp:76, gym:false, sleep:5.5 },
  { w:5, d:"Wed", cal:1260, pro:157, steps:6518, comp:82, gym:true, sleep:4.25 },
  { w:5, d:"Thu", cal:1276, pro:172, steps:5651, comp:80, gym:false, sleep:5.5 },
  { w:5, d:"Fri", cal:1288, pro:159, steps:4039, comp:72, gym:true, sleep:5.5 },
  { w:5, d:"Sat", cal:1303, pro:197, steps:8882, comp:81, gym:false, sleep:7 },
  { w:5, d:"Sun", cal:1038, pro:103, steps:12307, comp:66, gym:false, sleep:6.5 },
  { w:6, d:"Mon", cal:1629, pro:198, steps:8017, comp:82, gym:true, sleep:7 },
  { w:6, d:"Tue", cal:1315, pro:143, steps:7432, comp:90, gym:false, sleep:7 },
  { w:6, d:"Wed", cal:1727, pro:216, steps:9885, comp:87, gym:true, sleep:4 },
  { w:6, d:"Thu", cal:1997, pro:209, steps:7442, comp:94, gym:false, sleep:6 },
  { w:6, d:"Fri", cal:587, pro:74, steps:9879, comp:43, gym:true, sleep:7 },
  { w:6, d:"Sat", cal:907, pro:93, steps:6845, comp:56, gym:false, sleep:7 },
  { w:6, d:"Sun", cal:1426, pro:187, steps:9033, comp:81, gym:false, sleep:7 },
];
const AVGS = { cal:1124, pro:145, carb:60, fat:34, fib:11, sug:24 };
const today = DAILY_W7[3];
const lastW = WEIGHTS[WEIGHTS.length-1];
const lost = (80.5-lastW.kg).toFixed(1);
const lostPct = ((80.5-lastW.kg)/80.5*100).toFixed(1);

// ─── ANIMATED HOOK ────────────────────────────────────────────────
function useAnimateOnMount(dep) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(false); const t = setTimeout(()=>setVis(true), 30); return ()=>clearTimeout(t); }, [dep]);
  return vis;
}

// ─── SVG COMPONENTS ───────────────────────────────────────────────
function Spark({ data, color=C.mint, w=200, h=50, fill=true, sw=2, animate=true, visible=true }) {
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*w, h-((v-mn)/rng)*h*.82-h*.09]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fd=`${d} L${w},${h} L0,${h} Z`;
  const gid=useMemo(()=>`s${Math.random().toString(36).slice(2,7)}`,[]);
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];l+=Math.sqrt(dx*dx+dy*dy);}return l;},[pts]);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block',overflow:'visible'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      {fill && <path d={fd} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        style={animate?{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:`stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)`}:{}}/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={3.5} fill={color}
        style={{opacity:visible?1:0,transition:'opacity .3s ease 1s'}}>
        <animate attributeName="r" values="3;4.5;3" dur="2.5s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

function Ring({ val, max=100, sz=80, sw=6, color=C.mint, visible=true, children }) {
  const pct=Math.min(val/max,1), r=(sz-sw)/2, circ=2*Math.PI*r, dash=pct*circ;
  return (
    <div style={{position:'relative',width:sz,height:sz}}>
      <svg width={sz} height={sz}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={visible?`${dash} ${circ-dash}`:`0 ${circ}`}
          strokeDashoffset={circ/4} strokeLinecap="round"
          style={{transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1) .15s',filter:`drop-shadow(0 0 6px ${color}44)`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>{children}</div>
    </div>
  );
}

function Arc({ val, max, sz=120, sw=8, color=C.mint, label, unit="", visible=true }) {
  const pct=Math.min(val/max,1), r=(sz-sw*2)/2, circ=Math.PI*r, dash=pct*circ;
  const display=val>=10000?`${(val/1000).toFixed(1)}k`:val>=1000?`${(val/1000).toFixed(1)}k`:Math.round(val);
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
      <div style={{position:'relative',width:sz,height:sz*.55}}>
        <svg width={sz} height={sz*.55} viewBox={`0 0 ${sz} ${sz*.58}`}>
          <path d={`M ${sw} ${sz/2} A ${r} ${r} 0 0 1 ${sz-sw} ${sz/2}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} strokeLinecap="round"/>
          <path d={`M ${sw} ${sz/2} A ${r} ${r} 0 0 1 ${sz-sw} ${sz/2}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={visible?`${dash} ${circ}`:`0 ${circ}`}
            style={{transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1) .2s',filter:`drop-shadow(0 0 8px ${color}44)`}}/>
        </svg>
        <div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',textAlign:'center',opacity:visible?1:0,transition:'opacity .4s ease .5s'}}>
          <div style={{fontSize:sz>100?22:17,fontWeight:800,fontFamily:'var(--mono)',color:C.text,lineHeight:1}}>{display}</div>
          {unit&&<div style={{fontSize:8,color:C.text3,fontWeight:600,marginTop:1}}>{unit}</div>}
        </div>
      </div>
      <span style={{fontSize:10,color:C.text2,fontWeight:600,letterSpacing:.6,textTransform:'uppercase'}}>{label}</span>
    </div>
  );
}

function Bars({ data, max, color=C.mint, h=80, activeIdx=-1, visible=true }) {
  const mx=max||Math.max(...data.map(d=>d.v));
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height:h}}>
      {data.map((d,i)=>{
        const bh=Math.max(3,(d.v/mx)*h*.88);
        const act=i===activeIdx;
        return (
          <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
            <div style={{width:'100%',maxWidth:22,height:visible?bh:0,borderRadius:6,
              background:act?`linear-gradient(180deg,${color},${color}77)`:C.border,
              boxShadow:act?`0 0 12px ${color}33`:'none',
              transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*.06}s`}}/>
            <span style={{fontSize:9,color:act?color:C.text3,fontWeight:600}}>{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ segs, sz=100, sw=10, visible=true }) {
  const r=(sz-sw)/2, circ=2*Math.PI*r, tot=segs.reduce((a,s)=>a+s.v,0);
  let off=0;
  return (
    <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
      {segs.map((s,i)=>{const d=(s.v/tot)*circ, g=circ-d, o=off; off+=d;
        return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.c}
          strokeWidth={sw} strokeDasharray={visible?`${d} ${g}`:`0 ${circ}`}
          strokeDashoffset={-o} strokeLinecap="round" transform={`rotate(-90 ${sz/2} ${sz/2})`}
          style={{transition:`stroke-dasharray .9s cubic-bezier(.4,0,.2,1) ${i*.12}s`}}/>;
      })}
    </svg>
  );
}

function Progress({ val, min, max, color=C.mint, label, unit="g", visible=true }) {
  const pct=Math.min((val/max)*100,120);
  const ok=val>=min&&val<=max, clr=ok?color:val<min?C.orange:C.red;
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
        <span style={{fontSize:12,fontWeight:600,color:C.text2}}>{label}</span>
        <div style={{display:'flex',alignItems:'baseline',gap:4}}>
          <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:C.text}}>{val}</span>
          <span style={{fontSize:10,color:C.text3}}>{unit}</span>
          <span style={{fontSize:10,color:C.text3,marginLeft:4}}>/ {min}–{max}</span>
        </div>
      </div>
      <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.03)',overflow:'hidden'}}>
        <div style={{height:'100%',width:visible?`${Math.min(pct,100)}%`:'0%',borderRadius:3,
          background:`linear-gradient(90deg,${clr}BB,${clr})`,boxShadow:`0 0 8px ${clr}33`,
          transition:'width 1s cubic-bezier(.4,0,.2,1) .1s'}}/>
      </div>
    </div>
  );
}

// ─── UTILITY ─────────────────────────────────────────────────────
function Card({children, style={}, glow, className=""}) {
  return (
    <div className={className} style={{background:C.card,borderRadius:20,padding:22,border:`1px solid ${C.cardBorder}`,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',position:'relative',overflow:'hidden',transition:'border-color .3s',willChange:'transform',...style}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.cardBorderHover}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
      {glow&&<div style={{position:'absolute',top:-50,right:-50,width:140,height:140,borderRadius:'50%',background:C.mintSoft,filter:'blur(60px)',pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

function Tag({children,color=C.mint,bg,grad}){return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:8,background:bg||(color+'16'),color,fontSize:11,fontWeight:700,letterSpacing:.2}}>{children}</span>;}
function Lbl({children}){return <div style={{fontSize:10,color:C.text3,fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',marginBottom:10}}>{children}</div>;}

// ─── ICONS ───────────────────────────────────────────────────────
const I={
  grid:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  fork:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  pulse:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trend:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  target:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  check:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  x:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  down:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>,
  fire:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  shoe:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 16v-2.38C4 11.5 2.97 9.5 3 8c.08-3.07 3.9-4.43 6-1l.75 1.23a2 2 0 0 0 2.15.8L14 8.5c.85-.17 1.7 0 2.38.46l3.85 2.57a1 1 0 0 1 .36 1.12L19.73 16M4 16h16M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/></svg>,
  moon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  dumbbell:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/></svg>,
  weight:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.23A2 2 0 0 0 4 21h16a2 2 0 0 0 1.9-2.77l-2.495-8.77A2 2 0 0 0 17.5 8Z"/></svg>,
  bell:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
};

// ═══════════════════════════════════════════════════════════════════
// TAB CONTENT RENDERERS
// ═══════════════════════════════════════════════════════════════════

function OverviewTab({ vis, isD, isT, isM }) {
  const cols = isD ? 'repeat(3,1fr)' : isT ? 'repeat(2,1fr)' : '1fr';
  const checks=[
    {task:"Protein 130–160g",ok:today.pro>=130,val:`${today.pro}g`},
    {task:"Calories 1,300–1,500",ok:today.cal>=1300&&today.cal<=1500,val:`${today.cal}`},
    {task:"Steps 8,000+",ok:today.steps>=8000,val:today.steps.toLocaleString()},
    {task:"Fiber 20–30g",ok:today.fib>=20,val:`${today.fib}g`},
    {task:"Sugar < 20g",ok:today.sug<=20,val:`${today.sug}g`},
    {task:"Gym session",ok:today.gym,val:today.gym?"Done":"Rest"},
    {task:"Sleep 7+ hrs",ok:today.sleep>=7,val:`${today.sleep}h`},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {/* Weight Hero */}
      <Card glow style={{gridColumn:isD?'1/4':isT?'1/3':'1',padding:isD?28:22}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <Lbl>Current Weight</Lbl>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <span style={{fontSize:isM?36:46,fontWeight:900,fontFamily:'var(--mono)',letterSpacing:-2,lineHeight:1}}>{lastW.kg}</span>
              <span style={{fontSize:16,color:C.text2,fontWeight:600}}>kg</span>
            </div>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <Tag grad='linear-gradient(135deg,#B8FF57,#57FFD8,#5B8CFF)'>{I.down} {lost} kg lost</Tag>
              <Tag color={C.text2} bg="rgba(255,255,255,0.04)">{lostPct}% total</Tag>
            </div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:"Start",v:"80.5",s:"Jan 5"},{l:"Now",v:String(lastW.kg),s:`Wk ${lastW.week}`},{l:"Goal",v:"68.0",s:"~15% BF"}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:'10px 14px',borderRadius:14,background:m.l==="Now"?C.mintSoft:'rgba(255,255,255,0.02)',minWidth:72}}>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:m.l==="Now"?C.mint:C.text}}>{m.v}</div>
                <div style={{fontSize:9,color:C.text3,marginTop:2}}>{m.s}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{marginTop:16}}><Spark data={WEIGHTS.map(d=>d.kg)} gradColors={['#B8FF57','#57FFD8','#5B8CFF']} w={300} h={65} visible={vis}/></div>
      </Card>

      {/* Instrument Panel — always 3 across on desktop/tablet, stack on mobile */}
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'grid',gridTemplateColumns:isM?'1fr':'repeat(3,1fr)',gap:isD?14:12}}>
        <Card style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>Compliance</Lbl>
          <Ring val={today.comp} sz={isD?86:74} sw={6} color={C.mint} visible={vis}>
            <span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)'}}>{today.comp}</span>
          </Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={today.cal} max={1500} label="Calories" unit="kcal" color={today.cal>=1200&&today.cal<=1500?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </Card>

        <Card style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>Flat Stomach</Lbl>
          <Ring val={today.flat} sz={isD?86:74} sw={6} color={C.cyan} visible={vis}>
            <span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)',color:C.cyan}}>{today.flat}</span>
          </Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={today.steps} max={10000} label="Steps" color={today.steps>=8000?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </Card>

        <Card style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>Protein</Lbl>
          <Ring val={Math.round(today.pro/160*100)} sz={isD?86:74} sw={6} color={today.pro>=130?C.mint:C.orange} visible={vis}>
            <span style={{fontSize:18,fontWeight:900,fontFamily:'var(--mono)'}}>{today.pro}<span style={{fontSize:10,fontWeight:600,color:C.text2}}>g</span></span>
          </Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={today.pro} max={160} label="of 160g target" unit="" color={today.pro>=130?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </Card>
      </div>

      {/* Checklist — full width, 2 columns on desktop/tablet */}
      <Card style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Today's Checklist</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'1fr 1fr':isT?'1fr 1fr':'1fr',gap:isD?'0 24px':'0'}}>
        {checks.map((c,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${C.border}`,
            opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.04}s`}}>
            <div style={{width:26,height:26,borderRadius:8,background:c.ok?C.mintSoft:C.redSoft,color:c.ok?C.mint:C.red,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {c.ok?I.check:I.x}
            </div>
            <span style={{flex:1,fontSize:12,fontWeight:500,color:c.ok?C.text:C.text2}}>{c.task}</span>
            <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:c.ok?C.mint:C.red}}>{c.val}</span>
          </div>
        ))}
        </div>
      </Card>
    </div>
  );
}

function NutritionTab({ vis, isD, isT, isM }) {
  const cols = isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const macros=[{name:"Protein",v:today.pro*4,c:C.mint},{name:"Carbs",v:today.carb*4,c:C.blue},{name:"Fat",v:today.fat*9,c:C.orange}];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {/* Macro donut + bars */}
      <Card style={{gridColumn:isD?'1/3':isT?'1/3':'1'}}>
        <Lbl>Today's Macros — {today.dt}</Lbl>
        <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:isM?'wrap':'nowrap'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <Donut segs={macros} sz={isD?130:110} sw={13} visible={vis}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)'}}>{today.cal}</span>
              <span style={{fontSize:8,color:C.text3,fontWeight:700}}>KCAL</span>
            </div>
          </div>
          <div style={{flex:1,minWidth:180}}>
            <Progress label="Calories" val={today.cal} min={1300} max={1500} color={C.mint} unit=" kcal" visible={vis}/>
            <Progress label="Protein" val={today.pro} min={130} max={160} color={C.mint} visible={vis}/>
            <Progress label="Carbs" val={today.carb} min={40} max={70} color={C.blue} visible={vis}/>
            <Progress label="Fat" val={today.fat} min={40} max={55} color={C.orange} visible={vis}/>
            <Progress label="Fiber" val={today.fib} min={20} max={30} color={C.cyan} visible={vis}/>
            <Progress label="Sugar" val={today.sug} min={0} max={20} color={C.purple} visible={vis}/>
          </div>
        </div>
      </Card>

      {/* Running averages */}
      <Card>
        <Lbl>All-Time Averages</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{l:"Calories",v:AVGS.cal,u:"kcal",c:C.mint},{l:"Protein",v:AVGS.pro,u:"g",c:C.mint},{l:"Carbs",v:AVGS.carb,u:"g",c:C.blue},{l:"Fat",v:AVGS.fat,u:"g",c:C.orange},{l:"Fiber",v:AVGS.fib,u:"g",c:C.cyan},{l:"Sugar",v:AVGS.sug,u:"g",c:C.purple}].map((a,i)=>(
            <div key={a.l} style={{textAlign:'center',padding:'12px 8px',borderRadius:14,background:'rgba(255,255,255,0.02)',
              opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.06}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{a.l}</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:a.c}}>{a.v}</div>
              <div style={{fontSize:9,color:C.text3}}>{a.u}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly nutrition table */}
      <Card style={{gridColumn:isD?'1/4':isT?'1/3':'1',overflowX:'auto'}}>
        <Lbl>Weekly Nutrition Averages</Lbl>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr>{["Wk","Cal","Pro","Carb","Fat","Fib","Sug","Score"].map(h=>(
            <th key={h} style={{padding:'10px 6px',color:C.text3,fontWeight:700,textAlign:'center',fontSize:10,letterSpacing:.5,borderBottom:`1px solid ${C.border}`}}>{h}</th>
          ))}</tr></thead>
          <tbody>{W_NUTR.map((w,ri)=>(
            <tr key={w.w} style={{borderBottom:`1px solid ${C.border}`,opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-8px)',transition:`all .35s ease ${ri*.06}s`}}>
              <td style={{padding:'10px 6px',textAlign:'center',fontWeight:700,color:C.mint,fontFamily:'var(--mono)'}}>{w.w}</td>
              {[w.cal,w.pro,w.carb,w.fat,w.fib,w.sug].map((v,i)=>(
                <td key={i} style={{padding:'10px 6px',textAlign:'center',fontFamily:'var(--mono)',fontWeight:600,color:C.text}}>{Math.round(v)}</td>
              ))}
              <td style={{padding:'10px 6px',textAlign:'center'}}>
                <span style={{display:'inline-block',padding:'3px 8px',borderRadius:6,background:w.comp>=70?C.mintSoft:w.comp>=50?C.orangeSoft:C.redSoft,color:w.comp>=70?C.mint:w.comp>=50?C.orange:C.red,fontSize:11,fontWeight:700,fontFamily:'var(--mono)'}}>{w.comp}</span>
              </td>
            </tr>
          ))}</tbody>
        </table>
        <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
          <Tag color={W_NUTR[5].calF==="On target"?C.mint:C.orange}>{W_NUTR[5].calF==="On target"?I.check:I.x} Cal: {W_NUTR[5].calF}</Tag>
          <Tag color={W_NUTR[5].fibF==="Low"?C.red:C.mint}>{W_NUTR[5].fibF==="Low"?I.x:I.check} Fiber: {W_NUTR[5].fibF}</Tag>
        </div>
      </Card>
    </div>
  );
}

function ActivityTab({ vis, isD, isT, isM }) {
  const cols = isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const gymDays = DAILY_ALL.filter(d=>d.gym).length;
  const totalDays = DAILY_ALL.length;
  const avgSleep = (DAILY_ALL.reduce((a,d)=>a+d.sleep,0)/totalDays).toFixed(1);
  const avgSteps = Math.round(DAILY_ALL.reduce((a,d)=>a+d.steps,0)/totalDays);

  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {/* Steps gauge */}
      <Card style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Lbl>Today's Steps</Lbl>
        <Arc val={today.steps} max={10000} label="" sz={isD?140:120} sw={10} color={today.steps>=8000?C.mint:C.orange} visible={vis}/>
        <div style={{marginTop:8,textAlign:'center'}}>
          <Tag color={today.steps>=8000?C.mint:C.orange}>{today.steps>=8000?"On target":"Below target"}</Tag>
        </div>
      </Card>

      {/* Activity stats */}
      <Card>
        <Lbl>All-Time Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:"Gym Days",v:gymDays,u:`/ ${totalDays}`,c:C.mint},{l:"Avg Steps",v:avgSteps.toLocaleString(),u:"/day",c:C.blue},{l:"Avg Sleep",v:avgSleep,u:"hrs",c:C.purple},{l:"Gym Rate",v:`${Math.round(gymDays/totalDays*100)}%`,u:"",c:C.cyan}].map((s,i)=>(
            <div key={s.l} style={{padding:'14px 12px',borderRadius:14,background:'rgba(255,255,255,0.02)',
              opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.08}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{s.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:3}}>
                <span style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:s.c}}>{s.v}</span>
                <span style={{fontSize:10,color:C.text3}}>{s.u}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Steps trend */}
      <Card>
        <Lbl>Weekly Steps Trend</Lbl>
        <Bars data={W_STEPS.map(s=>({v:s.v,label:`W${s.w}`}))} max={12000} color={C.blue} activeIdx={W_STEPS.length-1} visible={vis}/>
        <div style={{textAlign:'center',marginTop:14}}>
          <span style={{fontSize:24,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{W_STEPS[W_STEPS.length-1].v.toLocaleString()}</span>
          <span style={{fontSize:11,color:C.text3,marginLeft:6}}>avg W6</span>
        </div>
      </Card>

      {/* Week 7 daily activity */}
      <Card style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 — Daily Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'repeat(4,1fr)':isT?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {DAILY_W7.map((d,i)=>{
            const isT2=d.dt==="Feb 19";
            return (
              <div key={i} style={{padding:'16px 14px',borderRadius:16,background:isT2?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isT2?C.mintMed:'transparent'}`,
                opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(12px)',transition:`all .4s ease ${i*.08}s`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:13,fontWeight:800,color:isT2?C.mint:C.text}}>{d.day}</span>
                  {isT2&&<Tag color={C.mint}>Today</Tag>}
                </div>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>Steps</div>
                <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{d.steps.toLocaleString()}</div>
                <div style={{display:'flex',gap:8,marginTop:10}}>
                  <div>
                    <div style={{fontSize:9,color:C.text3,fontWeight:600}}>Sleep</div>
                    <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:d.sleep>=7?C.cyan:C.orange}}>{d.sleep}h</div>
                  </div>
                  <div>
                    <div style={{fontSize:9,color:C.text3,fontWeight:600}}>Gym</div>
                    <div style={{color:d.gym?C.mint:C.text3,display:'flex',alignItems:'center',marginTop:2}}>{d.gym?I.check:I.x}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function ProgressTab({ vis, isD, isT }) {
  const cols = isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {/* Weight chart */}
      <Card glow style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Weight Progress</Lbl>
        <div style={{display:'flex',alignItems:'flex-end',gap:isD?20:12,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:40,fontWeight:900,fontFamily:'var(--mono)',letterSpacing:-2,lineHeight:1}}>{lastW.kg}<span style={{fontSize:16,color:C.text2,marginLeft:4}}>kg</span></div>
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <Tag color={C.mint}>{I.down} {lost} kg</Tag>
              <Tag color={C.text2} bg="rgba(255,255,255,0.04)">{lostPct}%</Tag>
            </div>
          </div>
          <div style={{flex:1,minWidth:200}}><Spark data={WEIGHTS.map(d=>d.kg)} gradColors={['#B8FF57','#57FFD8','#5B8CFF']} w={300} h={80} visible={vis}/></div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:16,overflowX:'auto',paddingBottom:4}}>
          {WEIGHTS.map((w,i)=>(
            <div key={i} style={{textAlign:'center',padding:'10px 14px',borderRadius:12,background:i===WEIGHTS.length-1?C.mintSoft:'rgba(255,255,255,0.02)',flexShrink:0,minWidth:60,
              opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(8px)',transition:`all .35s ease ${i*.06}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700}}>W{w.week}</div>
              <div style={{fontSize:15,fontWeight:800,fontFamily:'var(--mono)',color:i===WEIGHTS.length-1?C.mint:C.text,marginTop:2}}>{w.kg}</div>
              {i>0&&<div style={{fontSize:9,color:C.mint,marginTop:2}}>-{(WEIGHTS[i-1].kg-w.kg).toFixed(1)}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Compliance trend */}
      <Card>
        <Lbl>Compliance Trend</Lbl>
        <Bars data={W_NUTR.map(w=>({v:w.comp,label:`W${w.w}`}))} max={100} color={C.mint} activeIdx={W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Best</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{Math.max(...W_NUTR.map(w=>w.comp))}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Latest</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{W_NUTR[5].comp}</div></div>
        </div>
      </Card>

      {/* Flat stomach trend */}
      <Card>
        <Lbl>Flat Stomach Trend</Lbl>
        <Bars data={W_NUTR.map(w=>({v:w.flat,label:`W${w.w}`}))} max={100} color={C.cyan} activeIdx={W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Best</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.cyan}}>{Math.max(...W_NUTR.map(w=>w.flat))}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Latest</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.cyan}}>{W_NUTR[5].flat}</div></div>
        </div>
      </Card>

      {/* Steps trend */}
      <Card>
        <Lbl>Steps Over Weeks</Lbl>
        <Spark data={W_STEPS.map(s=>s.v)} color={C.blue} w={200} h={60} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
          <div><div style={{fontSize:9,color:C.text3}}>W1</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>3.7k</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>W6</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>8.4k</div></div>
        </div>
      </Card>

      {/* Calorie trend */}
      <Card>
        <Lbl>Calorie Avg Over Weeks</Lbl>
        <Spark data={W_NUTR.map(w=>w.cal)} color={C.orange} w={200} h={60} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
          <div><div style={{fontSize:9,color:C.text3}}>W1</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>747</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>W6</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>1,370</div></div>
        </div>
      </Card>

      {/* Goal meter */}
      <Card>
        <Lbl>Goal Progress</Lbl>
        <Ring val={parseFloat(lost)} max={12.5} sz={100} sw={7} color={C.mint} visible={vis}>
          <span style={{fontSize:20,fontWeight:900,fontFamily:'var(--mono)'}}>{Math.round(parseFloat(lost)/12.5*100)}%</span>
        </Ring>
        <div style={{textAlign:'center',marginTop:10}}>
          <div style={{fontSize:12,color:C.text2}}>{lost} of 12.5 kg lost</div>
          <div style={{fontSize:11,color:C.text3,marginTop:4}}>{(12.5-parseFloat(lost)).toFixed(1)} kg remaining</div>
        </div>
      </Card>
    </div>
  );
}

function TargetsTab({ vis, isD, isT }) {
  const cols = isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const phases = [
    { n:1, l:"Fat Loss", wk:"Weeks 1–7", goal:"Aggressive fat loss, protect muscle", cal:"1,300–1,500", pro:"130–160", carb:"40–70", fat:"40–55", sug:"< 20", fib:"20–30", steps:"8k–10k", train:"3x strength + rope", fast:"16:8", active:true },
    { n:2, l:"Lean Out", wk:"Weeks 8–11", goal:"Continue fat loss, rebuild energy", cal:"1,600–1,800", pro:"130–150", carb:"80–130", fat:"45–65", sug:"< 30", fib:"25–35", steps:"8k–12k", train:"3–4x strength", fast:"Optional", active:false },
    { n:3, l:"Abs Reveal", wk:"Weeks 12–14", goal:"Final tightening, visible abs", cal:"1,500–1,650", pro:"140–160", carb:"60–100", fat:"40–55", sug:"< 25", fib:"25–35", steps:"10k+", train:"4x strength + core", fast:"Optional", active:false },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {phases.map((p,pi)=>(
        <Card key={p.n} glow={p.active} style={{gridColumn:isD&&p.active?'1/4':isT&&p.active?'1/3':'1',
          opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(14px)',transition:`all .45s ease ${pi*.1}s`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:12,background:p.active?C.mint:'rgba(255,255,255,0.04)',color:p.active?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0}}>{p.n}</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:p.active?C.mint:C.text}}>{p.l}</div>
              <div style={{fontSize:11,color:C.text3}}>{p.wk}</div>
            </div>
            {p.active && <Tag color={C.mint} bg={C.mintSoft}>Active</Tag>}
          </div>
          <div style={{fontSize:12,color:C.text2,marginBottom:14}}>{p.goal}</div>
          <div style={{display:'grid',gridTemplateColumns:p.active&&isD?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
            {[{l:"Calories",v:p.cal,u:"kcal"},{l:"Protein",v:p.pro,u:"g"},{l:"Carbs",v:p.carb,u:"g"},{l:"Fat",v:p.fat,u:"g"},{l:"Sugar",v:p.sug,u:"g"},{l:"Fiber",v:p.fib,u:"g"},{l:"Steps",v:p.steps,u:"/day"},{l:"Training",v:p.train,u:""}].map(t=>(
              <div key={t.l} style={{padding:'12px 12px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`}}>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>{t.l}</div>
                <div style={{fontSize:13,fontWeight:700,fontFamily:t.l==="Training"?'var(--sans)':'var(--mono)'}}>
                  {t.v}{t.u&&<span style={{fontSize:9,color:C.text3,marginLeft:3}}>{t.u}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Week 7 daily detail */}
      <Card style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 — Daily Breakdown</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {DAILY_W7.map((d,i)=>{
            const isT2=d.dt==="Feb 19";
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:isT2?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isT2?C.mintMed:'transparent'}`,
                opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.06}s`}}>
                <div style={{width:40,height:40,borderRadius:12,background:isT2?C.mint:C.surfaceSolid,color:isT2?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{d.day}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)'}}>{d.cal} kcal</span>
                    {d.gym&&<span style={{color:C.mint,display:'flex',alignItems:'center'}}>{I.dumbbell}</span>}
                    {isT2&&<Tag color={C.mint}>Today</Tag>}
                  </div>
                  <div style={{fontSize:11,color:C.text3,marginTop:3}}>P:{d.pro}g · C:{d.carb}g · F:{d.fat}g · {d.steps.toLocaleString()} steps</div>
                </div>
                <Ring val={d.comp} sz={40} sw={4} color={d.comp>=80?C.mint:d.comp>=60?C.orange:C.red} visible={vis}>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:'var(--mono)'}}>{d.comp}</span>
                </Ring>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function Stride() {
  const [tab, setTab] = useState("overview");
  const [ww, setWw] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  const vis = useAnimateOnMount(tab);

  useEffect(()=>{const h=()=>setWw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  const isM=ww<768, isT=ww>=768&&ww<1024, isD=ww>=1024;
  const NAV=[
    {id:"overview",icon:I.grid,label:"Overview"},
    {id:"nutrition",icon:I.fork,label:"Nutrition"},
    {id:"activity",icon:I.pulse,label:"Activity"},
    {id:"progress",icon:I.trend,label:"Progress"},
    {id:"targets",icon:I.target,label:"Targets"},
  ];

  const renderTab = () => {
    switch(tab) {
      case "overview": return <OverviewTab vis={vis} isD={isD} isT={isT} isM={isM}/>;
      case "nutrition": return <NutritionTab vis={vis} isD={isD} isT={isT} isM={isM}/>;
      case "activity": return <ActivityTab vis={vis} isD={isD} isT={isT} isM={isM}/>;
      case "progress": return <ProgressTab vis={vis} isD={isD} isT={isT}/>;
      case "targets": return <TargetsTab vis={vis} isD={isD} isT={isT}/>;
      default: return null;
    }
  };

  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'var(--sans)',display:isD?'flex':'block'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root{--sans:'Plus Jakarta Sans',-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
      `}</style>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-10%',left:'20%',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${C.mintSoft} 0%,transparent 70%)`,filter:'blur(30px)'}}/>
        <div style={{position:'absolute',bottom:'-15%',right:'5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(77,160,255,.03) 0%,transparent 70%)',filter:'blur(30px)'}}/>
      </div>

      {/* ═══ DESKTOP SIDEBAR ═══ */}
      {isD && (
        <nav style={{width:240,minHeight:'100vh',background:C.surfaceSolid,borderRight:`1px solid ${C.border}`,padding:'28px 16px',display:'flex',flexDirection:'column',position:'sticky',top:0,zIndex:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:36,padding:'0 8px'}}>
            <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#B8FF57,#57FFD8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:C.bg,boxShadow:`0 4px 16px ${C.mint}33`}}>S</div>
            <div>
              <div style={{fontSize:17,fontWeight:800,letterSpacing:-.3}}>Stride</div>
              <div style={{fontSize:10,color:C.text3,fontWeight:600}}>Week 7 · Phase 1</div>
            </div>
          </div>
          <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,padding:'0 14px',marginBottom:8}}>Navigation</div>
          {NAV.map(n=>{
            const act=tab===n.id;
            return (
              <button key={n.id} onClick={()=>setTab(n.id)} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:'12px 14px',borderRadius:14,border:'none',background:act?C.mintSoft:'transparent',color:act?C.mint:C.text2,fontSize:13,fontWeight:act?700:500,cursor:'pointer',transition:'all .2s',marginBottom:2,fontFamily:'var(--sans)',textAlign:'left'}}>
                {n.icon}<span>{n.label}</span>
                {act && <div style={{marginLeft:'auto',width:6,height:6,borderRadius:3,background:C.mint,boxShadow:`0 0 8px ${C.mint}55`}}/>}
              </button>
            );
          })}
          <div style={{marginTop:'auto',padding:'18px 16px',borderRadius:18,background:`linear-gradient(135deg,${C.mintSoft},transparent)`,border:`1px solid ${C.mintSoft}`}}>
            <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Overall Progress</div>
            <div style={{fontSize:24,fontWeight:900,fontFamily:'var(--mono)',color:C.mint}}>-{lost}kg</div>
            <div style={{fontSize:11,color:C.text2,marginTop:2}}>of 12.5 kg goal</div>
            <div style={{height:4,borderRadius:2,background:C.border,marginTop:10,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(parseFloat(lost)/12.5*100).toFixed(0)}%`,borderRadius:2,background:`linear-gradient(90deg,${C.mint}BB,${C.mint})`,transition:'width 1s ease'}}/>
            </div>
          </div>
        </nav>
      )}

      {/* ═══ MAIN ═══ */}
      <div style={{flex:1,position:'relative',zIndex:1,minHeight:'100vh'}}>
        {/* Mobile/Tablet header */}
        {!isD && (
          <header style={{padding:'14px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#B8FF57,#57FFD8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:C.bg,boxShadow:`0 4px 16px ${C.mint}33`}}>S</div>
              <div>
                <div style={{fontSize:10,color:C.text3,fontWeight:600}}>Week 7 · Phase 1</div>
                <div style={{fontSize:16,fontWeight:800,letterSpacing:-.3}}>Stride</div>
              </div>
            </div>
            <div style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative'}}>
              {I.bell}<div style={{position:'absolute',top:6,right:6,width:6,height:6,borderRadius:'50%',background:C.red,border:`2px solid ${C.bg}`}}/>
            </div>
          </header>
        )}

        {/* Desktop header */}
        {isD && (
          <header style={{padding:'24px 36px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:22,fontWeight:800}}>
                {tab==="overview"?"Dashboard":tab==="nutrition"?"Nutrition Tracking":tab==="activity"?"Activity & Training":tab==="progress"?"Progress Analytics":"Phase Targets"}
              </div>
              <div style={{fontSize:12,color:C.text3,marginTop:2}}>Thursday, February 19, 2026</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{padding:'8px 14px',borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,fontSize:12,fontWeight:600,color:C.text2}}>Phase 1 — Fat Loss</div>
              <div style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative'}}>
                {I.bell}<div style={{position:'absolute',top:6,right:6,width:6,height:6,borderRadius:'50%',background:C.red,border:`2px solid ${C.bg}`}}/>
              </div>
            </div>
          </header>
        )}

        {/* Tab content */}
        <div style={{padding:isD?'20px 36px 36px':isM?'14px 16px 100px':'20px 22px 100px'}}>
          {renderTab()}
        </div>
      </div>

      {/* ═══ MOBILE/TABLET BOTTOM NAV ═══ */}
      {!isD && (
        <nav style={{position:'fixed',bottom:0,left:0,right:0,background:`linear-gradient(180deg,${C.bg}00 0%,${C.bg}EE 20%,${C.bg} 100%)`,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:`1px solid ${C.border}`,padding:'6px 4px',paddingBottom:'max(6px, env(safe-area-inset-bottom))',zIndex:100,display:'flex',justifyContent:'space-around'}}>
          {NAV.map(n=>{
            const act=tab===n.id;
            return (
              <button key={n.id} onClick={()=>setTab(n.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 8px',border:'none',background:'none',cursor:'pointer',color:act?C.mint:C.text3,transition:'color .2s',position:'relative',fontFamily:'var(--sans)'}}>
                {act&&<div style={{position:'absolute',top:-6,width:20,height:3,borderRadius:2,background:C.mint,boxShadow:`0 0 10px ${C.mint}55`}}/>}
                <div style={{transform:act?'scale(1.1)':'scale(1)',transition:'transform .2s'}}>{n.icon}</div>
                <span style={{fontSize:9,fontWeight:act?800:500,letterSpacing:.2}}>{n.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
