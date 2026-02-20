import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// STRIDE v5 — Interactive charts, scroll animations, time navigation, food log
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
};

const WEIGHTS = [
  {week:0,kg:80.5,date:"Jan 5"},{week:1,kg:77.6,date:"Jan 12"},{week:2,kg:76.2,date:"Jan 19"},
  {week:3,kg:74.9,date:"Jan 26"},{week:4,kg:73.7,date:"Feb 2"},{week:5,kg:73.2,date:"Feb 9"},{week:6,kg:71.8,date:"Feb 16"},
];
const W_STEPS = [{w:1,v:3728},{w:2,v:5547},{w:3,v:6784},{w:4,v:5262},{w:5,v:7000},{w:6,v:8362}];
const W_NUTR = [
  {w:1,cal:747,pro:72,carb:76,fat:18,fib:9,sug:24,calF:"Low",fibF:"Low",comp:48,flat:46},
  {w:2,cal:968,pro:134,carb:44,fat:28,fib:9,sug:14,calF:"Low",fibF:"Low",comp:65,flat:64},
  {w:3,cal:1154,pro:163,carb:39,fat:39,fib:7,sug:17,calF:"Low",fibF:"Low",comp:71,flat:69},
  {w:4,cal:1203,pro:167,carb:49,fat:36,fib:10,sug:22,calF:"On target",fibF:"Low",comp:77,flat:75},
  {w:5,cal:1226,pro:165,carb:59,fat:36,fib:10,sug:20,calF:"On target",fibF:"Low",comp:76,flat:74},
  {w:6,cal:1370,pro:160,carb:83,fat:48,fib:15,sug:44,calF:"On target",fibF:"Low",comp:76,flat:74},
];
const DAILY_W7 = [
  {day:"Mon",dt:"Feb 16",cal:1275,pro:159,carb:76,fat:35,fib:17,sug:35,comp:86,flat:83,steps:5988,sleep:7,gym:true,wt:71.8},
  {day:"Tue",dt:"Feb 17",cal:1319,pro:153,carb:102,fat:33,fib:22,sug:47,comp:91,flat:88,steps:470,sleep:7,gym:false,wt:null},
  {day:"Wed",dt:"Feb 18",cal:1238,pro:176,carb:64,fat:31,fib:11,sug:25,comp:79,flat:77,steps:2153,sleep:6.5,gym:true,wt:null},
  {day:"Thu",dt:"Feb 19",cal:1208,pro:163,carb:70,fat:30,fib:8,sug:29,comp:76,flat:74,steps:5903,sleep:6.5,gym:false,wt:null},
];
const DAILY_ALL = [
  {w:1,d:"Mon",dt:"Jan 6",cal:879,pro:98,carb:95,fat:20,fib:8,sug:30,steps:1281,comp:58,gym:true,sleep:5},
  {w:1,d:"Tue",dt:"Jan 7",cal:797,pro:72,carb:88,fat:16,fib:7,sug:22,steps:4306,comp:56,gym:false,sleep:6},
  {w:1,d:"Wed",dt:"Jan 8",cal:682,pro:77,carb:68,fat:14,fib:9,sug:18,steps:2882,comp:50,gym:true,sleep:5.5},
  {w:1,d:"Thu",dt:"Jan 9",cal:555,pro:49,carb:65,fat:12,fib:6,sug:28,steps:5796,comp:29,gym:false,sleep:6},
  {w:1,d:"Fri",dt:"Jan 10",cal:831,pro:78,carb:82,fat:22,fib:10,sug:25,steps:2435,comp:51,gym:false,sleep:6},
  {w:1,d:"Sat",dt:"Jan 11",cal:555,pro:44,carb:58,fat:18,fib:8,sug:20,steps:3475,comp:33,gym:false,sleep:6},
  {w:1,d:"Sun",dt:"Jan 12",cal:928,pro:85,carb:78,fat:24,fib:12,sug:22,steps:5922,comp:59,gym:false,sleep:6},
  {w:2,d:"Mon",dt:"Jan 13",cal:580,pro:56,carb:40,fat:20,fib:6,sug:10,steps:2501,comp:44,gym:true,sleep:6},
  {w:2,d:"Tue",dt:"Jan 14",cal:860,pro:109,carb:38,fat:25,fib:8,sug:12,steps:6154,comp:65,gym:false,sleep:6},
  {w:2,d:"Wed",dt:"Jan 15",cal:944,pro:141,carb:32,fat:28,fib:10,sug:8,steps:4945,comp:75,gym:true,sleep:6},
  {w:2,d:"Thu",dt:"Jan 16",cal:801,pro:117,carb:42,fat:22,fib:7,sug:15,steps:7141,comp:58,gym:false,sleep:5.5},
  {w:2,d:"Fri",dt:"Jan 17",cal:1108,pro:165,carb:48,fat:30,fib:12,sug:14,steps:3366,comp:65,gym:true,sleep:6},
  {w:2,d:"Sat",dt:"Jan 18",cal:1208,pro:181,carb:52,fat:35,fib:11,sug:18,steps:4476,comp:72,gym:false,sleep:8},
  {w:2,d:"Sun",dt:"Jan 19",cal:1278,pro:171,carb:56,fat:38,fib:9,sug:20,steps:10247,comp:79,gym:false,sleep:6},
  {w:3,d:"Mon",dt:"Jan 20",cal:1243,pro:167,carb:35,fat:42,fib:6,sug:14,steps:7217,comp:72,gym:true,sleep:5.5},
  {w:3,d:"Tue",dt:"Jan 21",cal:1220,pro:152,carb:45,fat:40,fib:8,sug:16,steps:1706,comp:84,gym:false,sleep:6},
  {w:3,d:"Wed",dt:"Jan 22",cal:1130,pro:174,carb:30,fat:35,fib:5,sug:12,steps:5024,comp:71,gym:true,sleep:6},
  {w:3,d:"Thu",dt:"Jan 23",cal:1119,pro:166,carb:38,fat:36,fib:7,sug:18,steps:8437,comp:67,gym:false,sleep:6},
  {w:3,d:"Fri",dt:"Jan 24",cal:814,pro:104,carb:42,fat:28,fib:6,sug:20,steps:4192,comp:50,gym:true,sleep:6},
  {w:3,d:"Sat",dt:"Jan 25",cal:1273,pro:201,carb:40,fat:45,fib:9,sug:22,steps:12544,comp:72,gym:false,sleep:7},
  {w:3,d:"Sun",dt:"Jan 26",cal:1279,pro:177,carb:44,fat:48,fib:8,sug:18,steps:8365,comp:79,gym:false,sleep:6},
  {w:4,d:"Mon",dt:"Jan 27",cal:1171,pro:148,carb:45,fat:38,fib:10,sug:18,steps:2319,comp:79,gym:true,sleep:6},
  {w:4,d:"Tue",dt:"Jan 28",cal:1149,pro:173,carb:40,fat:32,fib:8,sug:22,steps:4724,comp:71,gym:false,sleep:6},
  {w:4,d:"Wed",dt:"Jan 29",cal:1450,pro:164,carb:60,fat:48,fib:12,sug:28,steps:2612,comp:82,gym:true,sleep:6},
  {w:4,d:"Thu",dt:"Jan 30",cal:1119,pro:187,carb:38,fat:28,fib:9,sug:18,steps:6413,comp:72,gym:false,sleep:6},
  {w:4,d:"Fri",dt:"Jan 31",cal:1202,pro:163,carb:52,fat:36,fib:11,sug:20,steps:6999,comp:82,gym:true,sleep:6},
  {w:4,d:"Sat",dt:"Feb 1",cal:1164,pro:165,carb:50,fat:34,fib:10,sug:24,steps:3934,comp:75,gym:false,sleep:6},
  {w:4,d:"Sun",dt:"Feb 2",cal:1167,pro:166,carb:58,fat:38,fib:10,sug:22,steps:9836,comp:79,gym:false,sleep:6.5},
  {w:5,d:"Mon",dt:"Feb 3",cal:1224,pro:193,carb:48,fat:32,fib:8,sug:16,steps:2616,comp:76,gym:true,sleep:6},
  {w:5,d:"Tue",dt:"Feb 4",cal:1190,pro:177,carb:52,fat:34,fib:10,sug:18,steps:8986,comp:76,gym:false,sleep:5.5},
  {w:5,d:"Wed",dt:"Feb 5",cal:1260,pro:157,carb:62,fat:38,fib:12,sug:22,steps:6518,comp:82,gym:true,sleep:4.25},
  {w:5,d:"Thu",dt:"Feb 6",cal:1276,pro:172,carb:58,fat:36,fib:10,sug:20,steps:5651,comp:80,gym:false,sleep:5.5},
  {w:5,d:"Fri",dt:"Feb 7",cal:1288,pro:159,carb:68,fat:40,fib:11,sug:24,steps:4039,comp:72,gym:true,sleep:5.5},
  {w:5,d:"Sat",dt:"Feb 8",cal:1303,pro:197,carb:55,fat:35,fib:12,sug:18,steps:8882,comp:81,gym:false,sleep:7},
  {w:5,d:"Sun",dt:"Feb 9",cal:1038,pro:103,carb:72,fat:38,fib:8,sug:22,steps:12307,comp:66,gym:false,sleep:6.5},
  {w:6,d:"Mon",dt:"Feb 10",cal:1629,pro:198,carb:85,fat:52,fib:18,sug:35,steps:8017,comp:82,gym:true,sleep:7},
  {w:6,d:"Tue",dt:"Feb 11",cal:1315,pro:143,carb:78,fat:42,fib:14,sug:38,steps:7432,comp:90,gym:false,sleep:7},
  {w:6,d:"Wed",dt:"Feb 12",cal:1727,pro:216,carb:90,fat:55,fib:20,sug:42,steps:9885,comp:87,gym:true,sleep:4},
  {w:6,d:"Thu",dt:"Feb 13",cal:1997,pro:209,carb:105,fat:62,fib:16,sug:55,steps:7442,comp:94,gym:false,sleep:6},
  {w:6,d:"Fri",dt:"Feb 14",cal:587,pro:74,carb:48,fat:18,fib:6,sug:30,steps:9879,comp:43,gym:true,sleep:7},
  {w:6,d:"Sat",dt:"Feb 15",cal:907,pro:93,carb:72,fat:32,fib:10,sug:48,steps:6845,comp:56,gym:false,sleep:7},
  {w:6,d:"Sun",dt:"Feb 16",cal:1426,pro:187,carb:102,fat:48,fib:18,sug:58,steps:9033,comp:81,gym:false,sleep:7},
];

const FOOD_LOG = {
  "Feb 19": [
    {name:"Grilled Chicken Breast",amount:"200g",cal:330,pro:62,carb:0,fat:7},
    {name:"Greek Yogurt 0% Fat",amount:"200g",cal:118,pro:20,carb:8,fat:0},
    {name:"Whey Protein Shake",amount:"1 scoop",cal:120,pro:24,carb:3,fat:1},
    {name:"Mixed Salad w/ Olive Oil",amount:"1 bowl",cal:185,pro:4,carb:12,fat:14},
    {name:"Brown Rice",amount:"100g cooked",cal:112,pro:2.6,carb:24,fat:0.9},
    {name:"Cottage Cheese",amount:"150g",cal:148,pro:18,carb:6,fat:5},
    {name:"Almonds",amount:"20g",cal:116,pro:4,carb:4,fat:10},
    {name:"Apple",amount:"1 medium",cal:95,pro:0.5,carb:25,fat:0.3},
  ],
  "Feb 18": [
    {name:"Scrambled Eggs (3)",amount:"3 large",cal:220,pro:18,carb:2,fat:15},
    {name:"Grilled Chicken Breast",amount:"250g",cal:412,pro:78,carb:0,fat:9},
    {name:"Whey Protein Shake",amount:"1 scoop",cal:120,pro:24,carb:3,fat:1},
    {name:"Broccoli steamed",amount:"200g",cal:68,pro:5.6,carb:14,fat:0.8},
    {name:"Tuna in Water",amount:"1 can",cal:120,pro:28,carb:0,fat:1},
    {name:"Sweet Potato",amount:"150g",cal:135,pro:2,carb:32,fat:0.2},
    {name:"Cottage Cheese",amount:"150g",cal:148,pro:18,carb:6,fat:5},
  ],
  "Feb 17": [
    {name:"Overnight Oats w/ Protein",amount:"1 serving",cal:340,pro:32,carb:42,fat:6},
    {name:"Grilled Chicken Breast",amount:"200g",cal:330,pro:62,carb:0,fat:7},
    {name:"Greek Yogurt 0% Fat",amount:"170g",cal:100,pro:17,carb:7,fat:0},
    {name:"Banana",amount:"1 medium",cal:105,pro:1.3,carb:27,fat:0.4},
    {name:"Salmon Fillet",amount:"150g",cal:280,pro:30,carb:0,fat:17},
    {name:"Mixed Vegetables",amount:"200g",cal:80,pro:4,carb:16,fat:0.5},
    {name:"Protein Bar",amount:"1 bar",cal:200,pro:20,carb:22,fat:8},
  ],
  "Feb 16": [
    {name:"Grilled Chicken Breast",amount:"200g",cal:330,pro:62,carb:0,fat:7},
    {name:"Whey Protein Shake",amount:"2 scoops",cal:240,pro:48,carb:6,fat:2},
    {name:"Greek Yogurt 0% Fat",amount:"200g",cal:118,pro:20,carb:8,fat:0},
    {name:"Avocado",amount:"half",cal:120,pro:1.5,carb:6,fat:11},
    {name:"Brown Rice",amount:"150g cooked",cal:168,pro:3.9,carb:36,fat:1.4},
    {name:"Tuna in Water",amount:"1 can",cal:120,pro:28,carb:0,fat:1},
    {name:"Mixed Salad w/ Olive Oil",amount:"1 bowl",cal:185,pro:4,carb:12,fat:14},
  ],
};

const ALL_FOODS = Object.values(FOOD_LOG).flat();
const POPULAR_FOODS = (() => {
  const freq = {};
  ALL_FOODS.forEach(f => {
    if (!freq[f.name]) freq[f.name] = { ...f, count: 0, totalCal: 0, totalPro: 0 };
    freq[f.name].count++; freq[f.name].totalCal += f.cal; freq[f.name].totalPro += f.pro;
  });
  return Object.values(freq).sort((a,b) => b.count - a.count).slice(0,8).map(f => ({
    ...f, avgCal: Math.round(f.totalCal/f.count), avgPro: Math.round(f.totalPro/f.count),
  }));
})();

const AVGS = {cal:1124,pro:145,carb:60,fat:34,fib:11,sug:24};
const today = DAILY_W7[3];
const lastW = WEIGHTS[WEIGHTS.length-1];
const lost = (80.5-lastW.kg).toFixed(1);
const lostPct = ((80.5-lastW.kg)/80.5*100).toFixed(1);

// ─── HOOKS ───────────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useAnimateOnMount(dep) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(false); const t = setTimeout(()=>setVis(true), 30); return ()=>clearTimeout(t); }, [dep]);
  return vis;
}

// ─── ANIMATED CARD (scroll-triggered) ────────────────────────────
function AnimCard({ children, style={}, glow, delay=0 }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} style={{background:C.card,borderRadius:20,padding:22,border:`1px solid ${C.cardBorder}`,
      backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',position:'relative',overflow:'hidden',
      transition:`border-color .3s, opacity .55s cubic-bezier(.4,0,.2,1) ${delay}s, transform .55s cubic-bezier(.4,0,.2,1) ${delay}s`,
      opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', ...style}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.cardBorderHover}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
      {glow&&<div style={{position:'absolute',top:-50,right:-50,width:140,height:140,borderRadius:'50%',background:C.mintSoft,filter:'blur(60px)',pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

function Card({children, style={}, glow}) {
  return (
    <div style={{background:C.card,borderRadius:20,padding:22,border:`1px solid ${C.cardBorder}`,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',position:'relative',overflow:'hidden',transition:'border-color .3s',...style}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.cardBorderHover}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
      {glow&&<div style={{position:'absolute',top:-50,right:-50,width:140,height:140,borderRadius:'50%',background:C.mintSoft,filter:'blur(60px)',pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

// ─── INTERACTIVE WEIGHT CHART ────────────────────────────────────
function WeightChart({ data, w=300, h=100, visible=true }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const mn=Math.min(...data.map(d=>d.kg))-1, mx=Math.max(...data.map(d=>d.kg))+1, rng=mx-mn||1;
  const padT=10, padB=18, ch=h-padT-padB;
  const pts=data.map((d,i)=>({x:(i/(data.length-1))*w, y:padT+ch-((d.kg-mn)/rng)*ch, ...d}));
  const linePath=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath=`${linePath} L${pts[pts.length-1].x},${h} L0,${h} Z`;
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;l+=Math.sqrt(dx*dx+dy*dy);}return l;},[data]);
  const gid=useMemo(()=>`wc${Math.random().toString(36).slice(2,7)}`,[]);

  const getClosest = useCallback((clientX) => {
    const svg = svgRef.current; if(!svg) return null;
    const rect = svg.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * w;
    let closest=0, minDist=Infinity;
    pts.forEach((p,i)=>{ const dist=Math.abs(p.x-svgX); if(dist<minDist){minDist=dist;closest=i;} });
    return closest;
  }, [pts, w]);

  const handleMove = useCallback((clientX) => {
    const idx = getClosest(clientX);
    if (idx !== null) setHover({x:pts[idx].x, y:pts[idx].y, idx});
  }, [getClosest, pts]);

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{display:'block',overflow:'visible',cursor:'crosshair',touchAction:'none'}}
      onMouseMove={e=>handleMove(e.clientX)} onMouseLeave={()=>setHover(null)}
      onTouchStart={e=>handleMove(e.touches[0].clientX)}
      onTouchMove={e=>{e.preventDefault();handleMove(e.touches[0].clientX);}}
      onTouchEnd={()=>setTimeout(()=>setHover(null),1500)}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.mint} stopOpacity=".18"/><stop offset="100%" stopColor={C.mint} stopOpacity="0"/>
      </linearGradient></defs>
      {[0.25,0.5,0.75].map(f=><line key={f} x1={0} y1={padT+ch*f} x2={w} y2={padT+ch*f} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>)}
      {pts.map((p,i)=><text key={i} x={p.x} y={h-2} textAnchor="middle" style={{fontSize:7,fill:C.text3,fontFamily:'var(--mono)',fontWeight:600}}>W{data[i].week}</text>)}
      <path d={fillPath} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>
      <path d={linePath} fill="none" stroke={C.mint} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={hover?.idx===i?5:3}
        fill={hover?.idx===i?C.mint:i===pts.length-1?C.mint:'rgba(184,255,87,0.5)'}
        stroke={hover?.idx===i?'#fff':'none'} strokeWidth={hover?.idx===i?1.5:0}
        style={{transition:'r .15s, fill .15s',filter:hover?.idx===i?`drop-shadow(0 0 6px ${C.mint})`:'none'}}>
        {i===pts.length-1&&!hover&&<animate attributeName="r" values="3;4.5;3" dur="2.5s" repeatCount="indefinite"/>}
      </circle>)}
      {hover&&<>
        <line x1={hover.x} y1={padT} x2={hover.x} y2={h-padB} stroke={C.mint} strokeWidth="0.8" strokeDasharray="3,3" opacity="0.5"/>
        <rect x={hover.x-38} y={Math.max(0,hover.y-36)} width={76} height={28} rx={8} fill={C.surfaceSolid} stroke={C.mint} strokeWidth="0.8" opacity="0.95"/>
        <text x={hover.x} y={Math.max(0,hover.y-24)} textAnchor="middle" style={{fontSize:10,fill:C.mint,fontFamily:'var(--mono)',fontWeight:700}}>{data[hover.idx].kg} kg</text>
        <text x={hover.x} y={Math.max(0,hover.y-14)} textAnchor="middle" style={{fontSize:7,fill:C.text2,fontFamily:'var(--mono)',fontWeight:500}}>{data[hover.idx].date} · W{data[hover.idx].week}</text>
      </>}
    </svg>
  );
}

function Spark({data,color=C.mint,w=200,h=50,fill=true,sw=2,visible=true}) {
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*w, h-((v-mn)/rng)*h*.82-h*.09]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fd=`${d} L${w},${h} L0,${h} Z`;
  const gid=useMemo(()=>`s${Math.random().toString(36).slice(2,7)}`,[]);
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];l+=Math.sqrt(dx*dx+dy*dy);}return l;},[pts]);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block',overflow:'visible'}}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".18"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      {fill&&<path d={fd} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:`stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)`}}/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={3.5} fill={color} style={{opacity:visible?1:0,transition:'opacity .3s ease 1s'}}>
        <animate attributeName="r" values="3;4.5;3" dur="2.5s" repeatCount="indefinite"/></circle>
    </svg>
  );
}

function Ring({val,max=100,sz=80,sw=6,color=C.mint,visible=true,children}) {
  const pct=Math.min(val/max,1),r=(sz-sw)/2,circ=2*Math.PI*r,dash=pct*circ;
  return (<div style={{position:'relative',width:sz,height:sz}}>
    <svg width={sz} height={sz}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
    <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={sw}
      strokeDasharray={visible?`${dash} ${circ-dash}`:`0 ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
      style={{transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1) .15s',filter:`drop-shadow(0 0 6px ${color}44)`}}/></svg>
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>{children}</div>
  </div>);
}

function Arc({val,max,sz=120,sw=8,color=C.mint,label,unit="",visible=true}) {
  const pct=Math.min(val/max,1),r=(sz-sw*2)/2,circ=Math.PI*r,dash=pct*circ;
  const display=val>=1000?`${(val/1000).toFixed(1)}k`:Math.round(val);
  return (<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
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
  </div>);
}

function Bars({data,max,color=C.mint,h=80,activeIdx=-1,visible=true}) {
  const mx=max||Math.max(...data.map(d=>d.v));
  const [hov, setHov] = useState(-1);
  return (<div style={{display:'flex',alignItems:'flex-end',gap:4,height:h}}>
    {data.map((d,i)=>{
      const bh=Math.max(3,(d.v/mx)*h*.88);
      const act=i===activeIdx, isHov=i===hov, isOn=act||isHov;
      return (<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',position:'relative'}}
        onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(-1)}>
        {isHov&&!act&&<div style={{position:'absolute',top:-28,left:'50%',transform:'translateX(-50%)',
          padding:'3px 8px',borderRadius:6,background:C.surfaceSolid,border:`1px solid ${color}44`,
          fontSize:10,fontWeight:700,fontFamily:'var(--mono)',color,whiteSpace:'nowrap',zIndex:5,
          animation:'fadeSlideUp .2s ease'}}>{d.v>=1000?d.v.toLocaleString():d.v}</div>}
        <div style={{width:'100%',maxWidth:22,height:visible?bh:0,borderRadius:6,
          background:isOn?`linear-gradient(180deg,${color},${color}77)`:isHov?`${color}44`:C.border,
          boxShadow:isOn?`0 0 12px ${color}33`:'none',
          transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*.06}s, background .2s, box-shadow .2s`,
          transform:isHov&&!act?'scaleY(1.06)':'scaleY(1)', transformOrigin:'bottom'}}/>
        <span style={{fontSize:9,color:isOn?color:isHov?C.text2:C.text3,fontWeight:isOn?700:600,transition:'color .2s'}}>{d.label}</span>
      </div>);
    })}
  </div>);
}

function Donut({segs,sz=100,sw=10,visible=true}) {
  const r=(sz-sw)/2,circ=2*Math.PI*r,tot=segs.reduce((a,s)=>a+s.v,0); let off=0;
  return (<svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
    <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
    {segs.map((s,i)=>{const d=(s.v/tot)*circ,g=circ-d,o=off;off+=d;
      return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.c}
        strokeWidth={sw} strokeDasharray={visible?`${d} ${g}`:`0 ${circ}`}
        strokeDashoffset={-o} strokeLinecap="round" transform={`rotate(-90 ${sz/2} ${sz/2})`}
        style={{transition:`stroke-dasharray .9s cubic-bezier(.4,0,.2,1) ${i*.12}s`}}/>;
    })}</svg>);
}

function Progress({val,min,max,color=C.mint,label,unit="g",visible=true}) {
  const pct=Math.min((val/max)*100,120);
  const ok=val>=min&&val<=max, clr=ok?color:val<min?C.orange:C.red;
  return (<div style={{marginBottom:14}}>
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
  </div>);
}

function Tag({children,color=C.mint,bg}){return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:8,background:bg||(color+'16'),color,fontSize:11,fontWeight:700,letterSpacing:.2}}>{children}</span>;}
function Lbl({children}){return <div style={{fontSize:10,color:C.text3,fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',marginBottom:10}}>{children}</div>;}

function TimePicker({value,onChange}) {
  const opts=[{id:"today",l:"Today"},{id:"thisWeek",l:"This Week"},{id:"lastWeek",l:"Last Week"},{id:"month",l:"Month"},{id:"day",l:"Day by Day"}];
  return (<div style={{display:'flex',gap:4,padding:3,borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,flexWrap:'wrap'}}>
    {opts.map(o=>(<button key={o.id} onClick={()=>onChange(o.id)} style={{padding:'6px 12px',borderRadius:9,border:'none',cursor:'pointer',
      background:value===o.id?C.mintSoft:'transparent',color:value===o.id?C.mint:C.text3,
      fontSize:11,fontWeight:value===o.id?700:500,fontFamily:'var(--sans)',transition:'all .2s'}}>{o.l}</button>))}
  </div>);
}

function DayPicker({days,selected,onSelect}) {
  return (<div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
    {days.map((d,i)=>{const sel=selected===i;
      return (<button key={i} onClick={()=>onSelect(i)} style={{flexShrink:0,padding:'8px 12px',borderRadius:12,border:`1px solid ${sel?C.mintMed:'transparent'}`,cursor:'pointer',
        background:sel?C.mintSoft:'rgba(255,255,255,0.02)',color:sel?C.mint:C.text2,fontFamily:'var(--sans)',fontSize:11,fontWeight:sel?700:500,transition:'all .2s',minWidth:58,textAlign:'center'}}>
        <div style={{fontSize:9,color:sel?C.mint:C.text3,fontWeight:700}}>{d.day||d.d}</div>
        <div style={{fontSize:11,fontWeight:700,marginTop:2}}>{d.dt?.split(' ')[1]||''}</div>
      </button>);
    })}
  </div>);
}

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
  bell:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
};

// ─── DATA HELPERS ────────────────────────────────────────────────
function getPeriod(period, dayIdx=0) {
  if (period==="today") return DAILY_W7[DAILY_W7.length-1];
  if (period==="day") return DAILY_W7[dayIdx]||DAILY_W7[0];
  const avg = (arr, key) => Math.round(arr.reduce((a,d)=>a+(d[key]||0),0)/arr.length);
  const avgF = (arr, key) => +(arr.reduce((a,d)=>a+(d[key]||0),0)/arr.length).toFixed(1);
  if (period==="thisWeek") { const d=DAILY_W7; return {day:"Week 7",dt:"Feb 16–19",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'flat'),steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length}; }
  if (period==="lastWeek") { const d=DAILY_ALL.filter(x=>x.w===6); return {day:"Week 6",dt:"Feb 10–16",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'comp')-2,steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length}; }
  if (period==="month") { const d=DAILY_ALL.filter(x=>x.w>=3); return {day:"Last 4 wks",dt:"Jan 20–Feb 19",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'comp')-2,steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length}; }
  return today;
}

const insights = (() => {
  const allDays = [...DAILY_ALL, ...DAILY_W7.map(d=>({...d,w:7}))];
  const bestDay = allDays.reduce((b,d)=>d.comp>b.comp?d:b, allDays[0]);
  const reversed = [...allDays].reverse();
  let streak=0; for(const d of reversed){if(d.comp>=70)streak++;else break;}
  const recentW = WEIGHTS.slice(-3);
  const velocity = recentW.length>1?((recentW[0].kg-recentW[recentW.length-1].kg)/(recentW.length-1)).toFixed(1):0;
  const proteinRate = Math.round(allDays.filter(d=>d.pro>=130).length/allDays.length*100);
  const dayTotals = {};
  allDays.forEach(d=>{const day=d.day||d.d;if(!dayTotals[day])dayTotals[day]={s:0,c:0};dayTotals[day].s+=d.steps;dayTotals[day].c++;});
  const mostActive = Object.entries(dayTotals).map(([day,v])=>({day,avg:Math.round(v.s/v.c)})).sort((a,b)=>b.avg-a.avg)[0];
  return {bestDay,streak,velocity,proteinRate,mostActive};
})();

// TAB RENDERERS

function OverviewTab({vis,isD,isT,isM}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(DAILY_W7.length-1);
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx):getPeriod(period);
  const isAvg=period!=="today"&&period!=="day";
  const label=period==="today"?"Today":period==="day"?d.dt:period==="thisWeek"?"This Week Avg":period==="lastWeek"?"Last Week Avg":"Month Avg";
  const checks=[
    {task:"Protein 130\u2013160g",ok:d.pro>=130,val:`${d.pro}g`},
    {task:`Calories 1,300\u20131,500${isAvg?' avg':''}`,ok:d.cal>=1300&&d.cal<=1500,val:`${d.cal}`},
    {task:"Steps 8,000+",ok:d.steps>=8000,val:d.steps?.toLocaleString()},
    {task:"Fiber 20\u201330g",ok:d.fib>=20,val:`${d.fib}g`},
    {task:"Sugar < 20g",ok:d.sug<=20,val:`${d.sug}g`},
    {task:"Gym session",ok:isAvg?d.gym>=3:d.gym,val:isAvg?`${d.gym} days`:d.gym?"Done":"Rest"},
    {task:"Sleep 7+ hrs",ok:d.sleep>=7,val:`${d.sleep}h`},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}
      </div>
      <AnimCard glow style={{gridColumn:isD?'1/4':isT?'1/3':'1',padding:isD?28:22}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <Lbl>Current Weight</Lbl>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <span style={{fontSize:isM?36:46,fontWeight:900,fontFamily:'var(--mono)',letterSpacing:-2,lineHeight:1}}>{lastW.kg}</span>
              <span style={{fontSize:16,color:C.text2,fontWeight:600}}>kg</span></div>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <Tag color={C.mint}>{I.down} {lost} kg lost</Tag>
              <Tag color={C.text2} bg="rgba(255,255,255,0.04)">{lostPct}% total</Tag></div>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:"Start",v:"80.5",s:"Jan 5"},{l:"Now",v:String(lastW.kg),s:`Wk ${lastW.week}`},{l:"Goal",v:"68.0",s:"~15% BF"}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:'10px 14px',borderRadius:14,background:m.l==="Now"?C.mintSoft:'rgba(255,255,255,0.02)',minWidth:72}}>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:m.l==="Now"?C.mint:C.text}}>{m.v}</div>
                <div style={{fontSize:9,color:C.text3,marginTop:2}}>{m.s}</div></div>))}
          </div>
        </div>
        <div style={{marginTop:16,fontSize:9,color:C.text3,fontWeight:600,marginBottom:4}}>Hover or drag to explore</div>
        <WeightChart data={WEIGHTS} w={300} h={80} visible={vis}/>
      </AnimCard>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'grid',gridTemplateColumns:isM?'1fr':'repeat(3,1fr)',gap:isD?14:12}}>
        <AnimCard delay={0.05} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>{label} Compliance</Lbl>
          <Ring val={d.comp} sz={isD?86:74} sw={6} color={C.mint} visible={vis}><span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)'}}>{d.comp}</span></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.cal} max={1500} label="Calories" unit="kcal" color={d.cal>=1200&&d.cal<=1500?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </AnimCard>
        <AnimCard delay={0.1} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>{label} Flat Stomach</Lbl>
          <Ring val={d.flat} sz={isD?86:74} sw={6} color={C.cyan} visible={vis}><span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)',color:C.cyan}}>{d.flat}</span></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.steps} max={10000} label="Steps" color={d.steps>=8000?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </AnimCard>
        <AnimCard delay={0.15} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl>{label} Protein</Lbl>
          <Ring val={Math.round(d.pro/160*100)} sz={isD?86:74} sw={6} color={d.pro>=130?C.mint:C.orange} visible={vis}>
            <span style={{fontSize:18,fontWeight:900,fontFamily:'var(--mono)'}}>{d.pro}<span style={{fontSize:10,fontWeight:600,color:C.text2}}>g</span></span></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.pro} max={160} label="of 160g target" unit="" color={d.pro>=130?C.mint:C.orange} sz={isD?108:92} visible={vis}/>
        </AnimCard>
      </div>
      <AnimCard delay={0.2} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Quick Insights</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isM?'repeat(2,1fr)':'repeat(4,1fr)',gap:10}}>
          {[{l:"Streak",v:`${insights.streak}d`,sub:"\u226570 compliance",c:C.mint,icon:I.fire},
            {l:"Weight Pace",v:`-${insights.velocity}kg/wk`,sub:"Last 3 weeks",c:C.cyan,icon:I.down},
            {l:"Protein Hits",v:`${insights.proteinRate}%`,sub:"Days \u2265130g",c:insights.proteinRate>=70?C.mint:C.orange,icon:I.target},
            {l:"Most Active",v:insights.mostActive.day,sub:`${insights.mostActive.avg.toLocaleString()} steps`,c:C.blue,icon:I.shoe},
          ].map((s,i)=>(<div key={i} style={{padding:'14px 12px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><div style={{color:s.c}}>{s.icon}</div>
              <span style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8}}>{s.l}</span></div>
            <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:C.text3,marginTop:2}}>{s.sub}</div>
          </div>))}
        </div>
      </AnimCard>
      <AnimCard delay={0.25} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>{label} Checklist</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'1fr 1fr':isT?'1fr 1fr':'1fr',gap:isD?'0 24px':'0'}}>
        {checks.map((c,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${C.border}`,
          opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.04}s`}}>
          <div style={{width:26,height:26,borderRadius:8,background:c.ok?C.mintSoft:C.redSoft,color:c.ok?C.mint:C.red,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{c.ok?I.check:I.x}</div>
          <span style={{flex:1,fontSize:12,fontWeight:500,color:c.ok?C.text:C.text2}}>{c.task}</span>
          <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:c.ok?C.mint:C.red}}>{c.val}</span>
        </div>))}
        </div>
      </AnimCard>
    </div>);
}

function NutritionTab({vis,isD,isT,isM}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(DAILY_W7.length-1);
  const [foodTab, setFoodTab] = useState("log");
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx):getPeriod(period);
  const isAvg=period!=="today"&&period!=="day";
  const dateLabel=period==="today"?"Feb 19":period==="day"?(DAILY_W7[dayIdx]?.dt||"Feb 19"):period==="thisWeek"?"Week 7 Avg":period==="lastWeek"?"Week 6 Avg":"Month Avg";
  const macros=[{name:"Protein",v:d.pro*4,c:C.mint},{name:"Carbs",v:d.carb*4,c:C.blue},{name:"Fat",v:d.fat*9,c:C.orange}];
  const foodDate=period==="today"?"Feb 19":period==="day"?(DAILY_W7[dayIdx]?.dt||"Feb 19"):null;
  const dayFoods=foodDate?(FOOD_LOG[foodDate]||[]):[];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}
      </div>
      <AnimCard style={{gridColumn:isD?'1/3':isT?'1/3':'1'}}>
        <Lbl>{dateLabel} Macros</Lbl>
        <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:isM?'wrap':'nowrap'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <Donut segs={macros} sz={isD?130:110} sw={13} visible={vis}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <span style={{fontSize:22,fontWeight:900,fontFamily:'var(--mono)'}}>{d.cal}</span>
              <span style={{fontSize:8,color:C.text3,fontWeight:700}}>KCAL</span></div>
          </div>
          <div style={{flex:1,minWidth:180}}>
            <Progress label="Calories" val={d.cal} min={1300} max={1500} color={C.mint} unit=" kcal" visible={vis}/>
            <Progress label="Protein" val={d.pro} min={130} max={160} color={C.mint} visible={vis}/>
            <Progress label="Carbs" val={d.carb} min={40} max={70} color={C.blue} visible={vis}/>
            <Progress label="Fat" val={d.fat} min={40} max={55} color={C.orange} visible={vis}/>
            <Progress label="Fiber" val={d.fib} min={20} max={30} color={C.cyan} visible={vis}/>
            <Progress label="Sugar" val={d.sug} min={0} max={20} color={C.purple} visible={vis}/>
          </div>
        </div>
      </AnimCard>
      <AnimCard delay={0.05}>
        <Lbl>All-Time Averages</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{l:"Calories",v:AVGS.cal,u:"kcal",c:C.mint},{l:"Protein",v:AVGS.pro,u:"g",c:C.mint},{l:"Carbs",v:AVGS.carb,u:"g",c:C.blue},{l:"Fat",v:AVGS.fat,u:"g",c:C.orange},{l:"Fiber",v:AVGS.fib,u:"g",c:C.cyan},{l:"Sugar",v:AVGS.sug,u:"g",c:C.purple}].map((a,i)=>(
            <div key={a.l} style={{textAlign:'center',padding:'12px 8px',borderRadius:14,background:'rgba(255,255,255,0.02)',
              opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.06}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{a.l}</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:a.c}}>{a.v}</div>
              <div style={{fontSize:9,color:C.text3}}>{a.u}</div></div>))}
        </div>
      </AnimCard>
      <AnimCard delay={0.1} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Lbl>{foodTab==="log"?"Food Diary":"Most Popular Foods"}</Lbl>
          <div style={{display:'flex',gap:4,padding:2,borderRadius:8,background:'rgba(255,255,255,0.03)'}}>
            <button onClick={()=>setFoodTab("log")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="log"?C.mintSoft:'transparent',color:foodTab==="log"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>Today's Log</button>
            <button onClick={()=>setFoodTab("popular")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="popular"?C.mintSoft:'transparent',color:foodTab==="popular"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>Top Foods</button>
          </div>
        </div>
        {foodTab==="log"?(dayFoods.length>0?(<div style={{display:'flex',flexDirection:'column',gap:6}}>
          {dayFoods.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`,
            opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-8px)',transition:`all .3s ease ${i*.04}s`}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
              <div style={{fontSize:10,color:C.text3,marginTop:2}}>{f.amount}</div></div>
            <div style={{display:'flex',gap:isM?8:14,flexShrink:0}}>
              <div style={{textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.cal}</div><div style={{fontSize:8,color:C.text3}}>cal</div></div>
              <div style={{textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.pro}</div><div style={{fontSize:8,color:C.text3}}>pro</div></div>
              {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>{f.carb}</div><div style={{fontSize:8,color:C.text3}}>carb</div></div>}
              {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>{f.fat}</div><div style={{fontSize:8,color:C.text3}}>fat</div></div>}
            </div></div>))}
          <div style={{display:'flex',justifyContent:'flex-end',gap:14,padding:'10px 14px',borderTop:`1px solid ${C.border}`,marginTop:4}}>
            <span style={{fontSize:11,color:C.text3,fontWeight:600}}>Total:</span>
            <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{dayFoods.reduce((a,f)=>a+f.cal,0)} cal</span>
            <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{Math.round(dayFoods.reduce((a,f)=>a+f.pro,0))}g pro</span>
          </div></div>):(<div style={{padding:24,textAlign:'center',color:C.text3,fontSize:12}}>{isAvg?"Food log for individual days. Switch to Today or Day by Day.":"No food data."}</div>))
        :(<div style={{display:'grid',gridTemplateColumns:isD?'repeat(2,1fr)':'1fr',gap:8}}>
          {POPULAR_FOODS.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`,
            opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(8px)',transition:`all .3s ease ${i*.04}s`}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.mintSoft,color:C.mint,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{f.count}\u00d7</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
              <div style={{fontSize:10,color:C.text3,marginTop:1}}>Avg: {f.avgCal} cal \u00b7 {f.avgPro}g protein</div></div>
          </div>))}</div>)}
      </AnimCard>
      <AnimCard delay={0.15} style={{gridColumn:isD?'1/4':isT?'1/3':'1',overflowX:'auto'}}>
        <Lbl>Weekly Nutrition Averages</Lbl>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr>{["Wk","Cal","Pro","Carb","Fat","Fib","Sug","Score"].map(h=>(
            <th key={h} style={{padding:'10px 6px',color:C.text3,fontWeight:700,textAlign:'center',fontSize:10,letterSpacing:.5,borderBottom:`1px solid ${C.border}`}}>{h}</th>))}</tr></thead>
          <tbody>{W_NUTR.map((w,ri)=>(<tr key={w.w} style={{borderBottom:`1px solid ${C.border}`,opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-8px)',transition:`all .35s ease ${ri*.06}s`}}>
            <td style={{padding:'10px 6px',textAlign:'center',fontWeight:700,color:C.mint,fontFamily:'var(--mono)'}}>{w.w}</td>
            {[w.cal,w.pro,w.carb,w.fat,w.fib,w.sug].map((v,i)=>(<td key={i} style={{padding:'10px 6px',textAlign:'center',fontFamily:'var(--mono)',fontWeight:600,color:C.text}}>{Math.round(v)}</td>))}
            <td style={{padding:'10px 6px',textAlign:'center'}}><span style={{display:'inline-block',padding:'3px 8px',borderRadius:6,background:w.comp>=70?C.mintSoft:w.comp>=50?C.orangeSoft:C.redSoft,color:w.comp>=70?C.mint:w.comp>=50?C.orange:C.red,fontSize:11,fontWeight:700,fontFamily:'var(--mono)'}}>{w.comp}</span></td>
          </tr>))}</tbody></table>
      </AnimCard>
    </div>);
}

function ActivityTab({vis,isD,isT,isM}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(DAILY_W7.length-1);
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx):getPeriod(period);
  const label=period==="today"?"Today":period==="day"?d.dt:period==="thisWeek"?"This Week":period==="lastWeek"?"Last Week":"Month";
  const gymDays=DAILY_ALL.filter(x=>x.gym).length, totalDays=DAILY_ALL.length;
  const avgSleep=(DAILY_ALL.reduce((a,x)=>a+x.sleep,0)/totalDays).toFixed(1);
  const avgSteps=Math.round(DAILY_ALL.reduce((a,x)=>a+x.steps,0)/totalDays);
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}
      </div>
      <AnimCard style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Lbl>{label} Steps</Lbl>
        <Arc val={d.steps} max={10000} label="" sz={isD?140:120} sw={10} color={d.steps>=8000?C.mint:C.orange} visible={vis}/>
        <div style={{marginTop:8}}><Tag color={d.steps>=8000?C.mint:C.orange}>{d.steps>=8000?"On target":"Below target"}</Tag></div>
      </AnimCard>
      <AnimCard delay={0.05}>
        <Lbl>All-Time Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:"Gym Days",v:gymDays,u:`/ ${totalDays}`,c:C.mint},{l:"Avg Steps",v:avgSteps.toLocaleString(),u:"/day",c:C.blue},{l:"Avg Sleep",v:avgSleep,u:"hrs",c:C.purple},{l:"Gym Rate",v:`${Math.round(gymDays/totalDays*100)}%`,u:"",c:C.cyan}].map((s,i)=>(
            <div key={s.l} style={{padding:'14px 12px',borderRadius:14,background:'rgba(255,255,255,0.02)',opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.08}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{s.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:3}}><span style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:s.c}}>{s.v}</span><span style={{fontSize:10,color:C.text3}}>{s.u}</span></div>
            </div>))}
        </div>
      </AnimCard>
      <AnimCard delay={0.1}>
        <Lbl>Weekly Steps Trend</Lbl>
        <Bars data={W_STEPS.map(s=>({v:s.v,label:`W${s.w}`}))} max={12000} color={C.blue} activeIdx={W_STEPS.length-1} visible={vis}/>
        <div style={{textAlign:'center',marginTop:14}}><span style={{fontSize:24,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{W_STEPS[W_STEPS.length-1].v.toLocaleString()}</span><span style={{fontSize:11,color:C.text3,marginLeft:6}}>avg W6</span></div>
      </AnimCard>
      <AnimCard delay={0.15} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 \u2014 Daily Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'repeat(4,1fr)':isT?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {DAILY_W7.map((dd,i)=>{const isToday=dd.dt==="Feb 19";
            return (<div key={i} style={{padding:'16px 14px',borderRadius:16,background:isToday?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isToday?C.mintMed:'transparent'}`,
              cursor:'pointer',opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(12px)',transition:`all .4s ease ${i*.08}s`}}
              onMouseEnter={e=>{if(!isToday){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor=C.cardBorderHover;}}}
              onMouseLeave={e=>{if(!isToday){e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='transparent';}}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:800,color:isToday?C.mint:C.text}}>{dd.day}</span>
                {isToday&&<Tag color={C.mint}>Today</Tag>}</div>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>Steps</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{dd.steps.toLocaleString()}</div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Sleep</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:dd.sleep>=7?C.cyan:C.orange}}>{dd.sleep}h</div></div>
                <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Gym</div><div style={{color:dd.gym?C.mint:C.text3,display:'flex',alignItems:'center',marginTop:2}}>{dd.gym?I.check:I.x}</div></div>
              </div></div>);})}
        </div>
      </AnimCard>
    </div>);
}

function ProgressTab({vis,isD,isT}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const velocity=insights.velocity, remaining=12.5-parseFloat(lost), weeksLeft=Math.ceil(remaining/parseFloat(velocity||0.8));
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <AnimCard glow style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Weight Progress</Lbl>
        <div style={{display:'flex',alignItems:'flex-end',gap:isD?20:12,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:40,fontWeight:900,fontFamily:'var(--mono)',letterSpacing:-2,lineHeight:1}}>{lastW.kg}<span style={{fontSize:16,color:C.text2,marginLeft:4}}>kg</span></div>
            <div style={{display:'flex',gap:8,marginTop:8}}><Tag color={C.mint}>{I.down} {lost} kg</Tag><Tag color={C.text2} bg="rgba(255,255,255,0.04)">{lostPct}%</Tag></div>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:9,color:C.text3,fontWeight:600,marginBottom:4}}>Hover or drag to explore</div>
            <WeightChart data={WEIGHTS} w={300} h={100} visible={vis}/>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:16,overflowX:'auto',paddingBottom:4}}>
          {WEIGHTS.map((w,i)=>(<div key={i} style={{textAlign:'center',padding:'10px 14px',borderRadius:12,background:i===WEIGHTS.length-1?C.mintSoft:'rgba(255,255,255,0.02)',flexShrink:0,minWidth:60,
            opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(8px)',transition:`all .35s ease ${i*.06}s`}}>
            <div style={{fontSize:9,color:C.text3,fontWeight:700}}>W{w.week}</div>
            <div style={{fontSize:15,fontWeight:800,fontFamily:'var(--mono)',color:i===WEIGHTS.length-1?C.mint:C.text,marginTop:2}}>{w.kg}</div>
            {i>0&&<div style={{fontSize:9,color:C.mint,marginTop:2}}>-{(WEIGHTS[i-1].kg-w.kg).toFixed(1)}</div>}
          </div>))}
        </div>
      </AnimCard>

      <AnimCard delay={0.05}><Lbl>Compliance Trend</Lbl>
        <Bars data={W_NUTR.map(w=>({v:w.comp,label:`W${w.w}`}))} max={100} color={C.mint} activeIdx={W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Best</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{Math.max(...W_NUTR.map(w=>w.comp))}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Latest</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{W_NUTR[5].comp}</div></div>
        </div>
      </AnimCard>

      <AnimCard delay={0.1}><Lbl>Flat Stomach Trend</Lbl>
        <Bars data={W_NUTR.map(w=>({v:w.flat,label:`W${w.w}`}))} max={100} color={C.cyan} activeIdx={W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Best</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.cyan}}>{Math.max(...W_NUTR.map(w=>w.flat))}</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Latest</div><div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:C.cyan}}>{W_NUTR[5].flat}</div></div>
        </div>
      </AnimCard>

      <AnimCard delay={0.15}><Lbl>Steps Over Weeks</Lbl>
        <Spark data={W_STEPS.map(s=>s.v)} color={C.blue} w={200} h={60} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
          <div><div style={{fontSize:9,color:C.text3}}>W1</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>3.7k</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>W6</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>8.4k</div></div>
        </div>
      </AnimCard>

      <AnimCard delay={0.2}><Lbl>Calorie Avg Over Weeks</Lbl>
        <Spark data={W_NUTR.map(w=>w.cal)} color={C.orange} w={200} h={60} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:12}}>
          <div><div style={{fontSize:9,color:C.text3}}>W1</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>747</div></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>W6</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>1,370</div></div>
        </div>
      </AnimCard>

      <AnimCard delay={0.25}><Lbl>Projected Finish</Lbl>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:32,fontWeight:900,fontFamily:'var(--mono)',color:C.cyan}}>~{weeksLeft}</div>
          <div style={{fontSize:11,color:C.text3,marginTop:2}}>weeks to go</div>
          <div style={{marginTop:12,padding:'10px 16px',borderRadius:12,background:C.cyanSoft,display:'inline-block'}}>
            <span style={{fontSize:12,fontWeight:700,color:C.cyan}}>At -{velocity} kg/week pace</span>
          </div>
        </div>
      </AnimCard>
    </div>
  );
}

function TargetsTab({vis,isD,isT}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const phases=[
    {n:1,l:"Fat Loss",wk:"Weeks 1-7",goal:"Aggressive fat loss, protect muscle",cal:"1,300-1,500",pro:"130-160",carb:"40-70",fat:"40-55",sug:"< 20",fib:"20-30",steps:"8k-10k",train:"3x strength + rope",active:true},
    {n:2,l:"Lean Out",wk:"Weeks 8-11",goal:"Continue fat loss, rebuild energy",cal:"1,600-1,800",pro:"130-150",carb:"80-130",fat:"45-65",sug:"< 30",fib:"25-35",steps:"8k-12k",train:"3-4x strength",active:false},
    {n:3,l:"Abs Reveal",wk:"Weeks 12-14",goal:"Final tightening, visible abs",cal:"1,500-1,650",pro:"140-160",carb:"60-100",fat:"40-55",sug:"< 25",fib:"25-35",steps:"10k+",train:"4x strength + core",active:false},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {phases.map((p,pi)=>(<AnimCard key={p.n} glow={p.active} delay={pi*0.08} style={{gridColumn:isD&&p.active?'1/4':isT&&p.active?'1/3':'1'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:12,background:p.active?C.mint:'rgba(255,255,255,0.04)',color:p.active?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0}}>{p.n}</div>
          <div><div style={{fontSize:15,fontWeight:800,color:p.active?C.mint:C.text}}>{p.l}</div><div style={{fontSize:11,color:C.text3}}>{p.wk}</div></div>
          {p.active&&<Tag color={C.mint} bg={C.mintSoft}>Active</Tag>}
        </div>
        <div style={{fontSize:12,color:C.text2,marginBottom:14}}>{p.goal}</div>
        <div style={{display:'grid',gridTemplateColumns:p.active&&isD?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {[{l:"Calories",v:p.cal,u:"kcal"},{l:"Protein",v:p.pro,u:"g"},{l:"Carbs",v:p.carb,u:"g"},{l:"Fat",v:p.fat,u:"g"},{l:"Sugar",v:p.sug,u:"g"},{l:"Fiber",v:p.fib,u:"g"},{l:"Steps",v:p.steps,u:"/day"},{l:"Training",v:p.train,u:""}].map(t=>(
            <div key={t.l} style={{padding:'12px 12px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>{t.l}</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:t.l==="Training"?'var(--sans)':'var(--mono)'}}>{t.v}{t.u&&<span style={{fontSize:9,color:C.text3,marginLeft:3}}>{t.u}</span>}</div>
            </div>))}
        </div>
      </AnimCard>))}

      <AnimCard delay={0.25} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 - Daily Breakdown</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {DAILY_W7.map((d,i)=>{const isT2=d.dt==="Feb 19";
            return (<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:isT2?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isT2?C.mintMed:'transparent'}`,
              cursor:'pointer',opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.06}s`}}
              onMouseEnter={e=>{if(!isT2){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor=C.cardBorderHover;}}}
              onMouseLeave={e=>{if(!isT2){e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='transparent';}}}>
              <div style={{width:40,height:40,borderRadius:12,background:isT2?C.mint:C.surfaceSolid,color:isT2?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{d.day}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)'}}>{d.cal} kcal</span>
                  {d.gym&&<span style={{color:C.mint,display:'flex',alignItems:'center'}}>{I.dumbbell}</span>}
                  {isT2&&<Tag color={C.mint}>Today</Tag>}
                </div>
                <div style={{fontSize:11,color:C.text3,marginTop:3}}>P:{d.pro}g . C:{d.carb}g . F:{d.fat}g . {d.steps.toLocaleString()} steps</div>
              </div>
              <Ring val={d.comp} sz={40} sw={4} color={d.comp>=80?C.mint:d.comp>=60?C.orange:C.red} visible={vis}>
                <span style={{fontSize:11,fontWeight:800,fontFamily:'var(--mono)'}}>{d.comp}</span>
              </Ring>
            </div>);})}
        </div>
      </AnimCard>
    </div>
  );
}

// MAIN APP
export default function Stride() {
  const [tab, setTab] = useState("overview");
  const [ww, setWw] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  const vis = useAnimateOnMount(tab);
  useEffect(()=>{const h=()=>setWw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const isM=ww<768, isT=ww>=768&&ww<1024, isD=ww>=1024;
  const NAV=[{id:"overview",icon:I.grid,label:"Overview"},{id:"nutrition",icon:I.fork,label:"Nutrition"},{id:"activity",icon:I.pulse,label:"Activity"},{id:"progress",icon:I.trend,label:"Progress"},{id:"targets",icon:I.target,label:"Targets"}];
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
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* Ambient */}
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-10%',left:'20%',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${C.mintSoft} 0%,transparent 70%)`,filter:'blur(30px)'}}/>
        <div style={{position:'absolute',bottom:'-15%',right:'5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(77,160,255,.03) 0%,transparent 70%)',filter:'blur(30px)'}}/>
      </div>

      {/* DESKTOP SIDEBAR */}
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

      {/* MAIN */}
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

      {/* MOBILE/TABLET BOTTOM NAV */}
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

