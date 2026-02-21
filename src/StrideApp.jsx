import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// STRIDE v6 — AI Coach, Tooltips, Animated Countups, Collapsible Nav, Meal-categorized Food Log
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

// DATA — Hardcoded fallback (used when stride-data.json is unavailable)
const FALLBACK_WEIGHTS = [
  {week:0,kg:80.5,date:"Jan 5"},{week:1,kg:77.6,date:"Jan 12"},{week:2,kg:76.2,date:"Jan 19"},
  {week:3,kg:74.9,date:"Jan 26"},{week:4,kg:73.7,date:"Feb 2"},{week:5,kg:73.2,date:"Feb 9"},{week:6,kg:71.8,date:"Feb 16"},
];
const FALLBACK_W_NUTR = [
  {w:1,cal:747,pro:72,carb:76,fat:18,fib:9,sug:24,calF:"Low",fibF:"Low",comp:48,flat:46},
  {w:2,cal:968,pro:134,carb:44,fat:28,fib:9,sug:14,calF:"Low",fibF:"Low",comp:65,flat:64},
  {w:3,cal:1154,pro:163,carb:39,fat:39,fib:7,sug:17,calF:"Low",fibF:"Low",comp:71,flat:69},
  {w:4,cal:1203,pro:167,carb:49,fat:36,fib:10,sug:22,calF:"On target",fibF:"Low",comp:77,flat:75},
  {w:5,cal:1226,pro:165,carb:59,fat:36,fib:10,sug:20,calF:"On target",fibF:"Low",comp:76,flat:74},
  {w:6,cal:1370,pro:160,carb:83,fat:48,fib:15,sug:44,calF:"On target",fibF:"Low",comp:76,flat:74},
];
const FALLBACK_DAILY_ALL = [
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
const FALLBACK_DAILY_W7 = [
  {day:"Mon",dt:"Feb 16",cal:1275,pro:159,carb:76,fat:35,fib:17,sug:35,comp:86,flat:83,steps:5988,sleep:7,gym:true,wt:71.8},
  {day:"Tue",dt:"Feb 17",cal:1319,pro:153,carb:102,fat:33,fib:22,sug:47,comp:91,flat:88,steps:470,sleep:7,gym:false,wt:null},
  {day:"Wed",dt:"Feb 18",cal:1238,pro:176,carb:64,fat:31,fib:11,sug:25,comp:79,flat:77,steps:2153,sleep:6.5,gym:true,wt:null},
  {day:"Thu",dt:"Feb 19",cal:1208,pro:163,carb:70,fat:30,fib:8,sug:29,comp:76,flat:74,steps:5903,sleep:6.5,gym:false,wt:null},
];

// FOOD LOG fallback
const FALLBACK_FOOD_LOG = {
  "Feb 19": {
    breakfast: [{name:"Greek Yogurt 0% Fat",amount:"200g",cal:118,pro:20,carb:8,fat:0},{name:"Almonds",amount:"20g",cal:116,pro:4,carb:4,fat:10}],
    lunch: [{name:"Grilled Chicken Breast",amount:"200g",cal:330,pro:62,carb:0,fat:7},{name:"Brown Rice",amount:"100g cooked",cal:112,pro:2.6,carb:24,fat:0.9},{name:"Mixed Salad w/ Olive Oil",amount:"1 bowl",cal:185,pro:4,carb:12,fat:14}],
    snack: [{name:"Whey Protein Shake",amount:"1 scoop",cal:120,pro:24,carb:3,fat:1},{name:"Apple",amount:"1 medium",cal:95,pro:0.5,carb:25,fat:0.3}],
    dinner: [{name:"Cottage Cheese",amount:"150g",cal:148,pro:18,carb:6,fat:5}],
  },
};

// Tooltip definitions
const TIPS = {
  compliance: "Measures adherence to Phase 1 targets. Average of progress toward Calories (1,200 kcal), Protein (140g), and Fiber (30g), each capped at 100%. ≥ 90% = perfect execution. < 70% = risk of muscle loss.",
  flatStomach: "Focuses on digestive health and bloating reduction. Same as Compliance but with a stricter Fiber target (35g vs 30g) for gut clearance. ≥ 90% = optimal digestion. < 70% = likely under 20g fiber, expect bloating.",
  steps: "Daily step target for Phase 1: 8,000–10,000. Walking burns fat without increasing cortisol like intense cardio.",
  protein: "130–160g daily to preserve muscle during a caloric deficit. Protein is the most important macro for body composition.",
};

// Transform real-time proxy data → app format
function transformProxyData(days, weightEntries, todayStr) {
  if (!days || days.length === 0) return null;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = (iso) => { const d=new Date(iso+"T00:00:00"); return `${m[d.getMonth()]} ${d.getDate()}`; };
  const programStart = new Date("2026-01-05");
  const getWeek = (iso) => Math.floor((new Date(iso+"T00:00:00") - programStart) / (7*86400000)) + 1;
  const getDow = (iso) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(iso+"T00:00:00").getDay()];
  const todayWeek = getWeek(todayStr);

  // Build daily data
  const dailyAll = days.filter(d => (d.calories||0) > 0).map(d => ({
    w: getWeek(d.date), d: getDow(d.date), dt: fmt(d.date),
    cal: d.calories||0, pro: d.protein||0, carb: d.carbs||0, fat: d.fat||0,
    fib: d.fiber||0, sug: d.sugar||0, steps: d.steps||0,
    comp: computeSimpleCompliance(d), flat: computeSimpleCompliance(d) - 2,
    gym: false, sleep: 0,
  }));

  const dailyW7 = dailyAll.filter(d => d.w === todayWeek);

  // Weights — use entries from proxy, fallback to hardcoded
  let weights = weightEntries.map(w => ({ week: getWeek(w.date), kg: w.weight, date: fmt(w.date) }));
  if (weights.length === 0 || weights[0].week !== 0) {
    weights.unshift({ week: 0, kg: 80.5, date: "Jan 5" });
  }
  const useWeights = weights.length > 1 ? weights : FALLBACK_WEIGHTS;

  // Weekly aggregates
  const weekMap = {};
  dailyAll.forEach(d => { if (!weekMap[d.w]) weekMap[d.w] = []; weekMap[d.w].push(d); });
  const avg = (arr, k) => Math.round(arr.reduce((a,d) => a+(d[k]||0), 0) / arr.length);
  const wNutr = Object.entries(weekMap).map(([w, days]) => ({
    w: parseInt(w), cal: avg(days,'cal'), pro: avg(days,'pro'), carb: avg(days,'carb'),
    fat: avg(days,'fat'), fib: avg(days,'fib'), sug: avg(days,'sug'),
    calF: avg(days,'cal') >= 1200 && avg(days,'cal') <= 1500 ? "On target" : avg(days,'cal') < 1200 ? "Low" : "High",
    fibF: avg(days,'fib') >= 20 ? "On target" : "Low",
    comp: avg(days,'comp'), flat: avg(days,'comp') - 2,
  })).sort((a,b) => a.w - b.w);

  // Steps by week
  const wSteps = Object.entries(weekMap).map(([w, days]) => {
    const stepDays = days.filter(d => (d.steps||0) > 0);
    return stepDays.length ? { w: parseInt(w), v: avg(stepDays, 'steps') } : null;
  }).filter(Boolean);

  // Averages
  const logged = dailyAll.filter(d => d.cal > 0);
  const n = logged.length || 1;
  const averages = {
    cal: Math.round(logged.reduce((a,d) => a+d.cal, 0) / n),
    pro: Math.round(logged.reduce((a,d) => a+d.pro, 0) / n),
    carb: Math.round(logged.reduce((a,d) => a+d.carb, 0) / n),
    fat: Math.round(logged.reduce((a,d) => a+d.fat, 0) / n),
    fib: Math.round(logged.reduce((a,d) => a+d.fib, 0) / n),
    sug: Math.round(logged.reduce((a,d) => a+d.sug, 0) / n),
  };

  const lastWeight = useWeights[useWeights.length - 1] || { kg: 80.5, week: 0 };
  const totalLost = (80.5 - lastWeight.kg).toFixed(1);
  const lostPct = ((80.5 - lastWeight.kg) / 80.5 * 100).toFixed(1);
  const todayData = dailyW7[dailyW7.length - 1] || dailyAll[dailyAll.length - 1] || FALLBACK_DAILY_W7[FALLBACK_DAILY_W7.length-1];

  return {
    WEIGHTS: useWeights, W_STEPS: wSteps, W_NUTR: wNutr,
    DAILY_ALL: dailyAll, DAILY_W7: dailyW7,
    AVGS: averages, FOOD_LOG: FALLBACK_FOOD_LOG,
    today: todayData, lastW: lastWeight,
    lost: totalLost, lostPct: lostPct,
    startKg: 80.5, currentWeek: todayWeek,
  };
}

function computeSimpleCompliance(d) {
  const calScore = Math.min(100, ((d.calories||0) / 1350) * 100);
  const proScore = Math.min(100, ((d.protein||0) / 140) * 100);
  const fibScore = Math.min(100, ((d.fiber||0) / 20) * 100);
  return Math.round((calScore + proScore + fibScore) / 3);
}

// Transform JSON from sync → app format
function transformSyncData(json, todayLive) {
  if (!json || !json.daily || json.daily.length === 0) return null;
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = (iso) => { const d=new Date(iso+"T00:00:00"); return `${m[d.getMonth()]} ${d.getDate()}`; };

  // Current week
  const currentWeek = json.meta?.currentWeek || 7;

  // Transform daily → DAILY_ALL format
  const dailyAll = json.daily.filter(d=>d.calories>0).map(d => ({
    w: d.week, d: d.day, dt: fmt(d.date),
    cal: d.calories||0, pro: d.protein||0, carb: d.carbs||0, fat: d.fat||0,
    fib: d.fiber||0, sug: d.sugar||0, steps: d.steps||0,
    comp: d.compliance||0, flat: d.flatStomach||0,
    gym: d.gym||false, sleep: d.sleep||0,
  }));

  // Current week days → DAILY_W7
  const dailyW7 = json.daily.filter(d => d.week === currentWeek && d.calories > 0).map(d => ({
    day: d.day, dt: fmt(d.date),
    cal: d.calories||0, pro: d.protein||0, carb: d.carbs||0, fat: d.fat||0,
    fib: d.fiber||0, sug: d.sugar||0,
    comp: d.compliance||0, flat: d.flatStomach||0,
    steps: d.steps||0, sleep: d.sleep||0, gym: d.gym||false, wt: null,
  }));

  // Weights
  const weights = (json.weight?.timeline || []).map(w => ({
    week: w.week, kg: w.weight, date: fmt(w.date),
  }));
  // Ensure week 0 start weight exists
  if (weights.length === 0 || weights[0].week !== 0) {
    weights.unshift({ week: 0, kg: json.meta?.startWeight || 80.5, date: fmt(json.meta?.programStart || "2026-01-05") });
  }
  // If we only have the start weight (sync didn't get weight measurements), use fallback weights
  const useWeights = weights.length > 1 ? weights : FALLBACK_WEIGHTS;

  // Weekly nutrition
  const wNutr = (json.weekly || []).filter(w => w.daysLogged > 0).map(w => ({
    w: w.week, cal: w.cal, pro: w.protein, carb: w.carbs, fat: w.fat, fib: w.fiber, sug: w.sugar,
    calF: w.calFlag||"", fibF: w.fiberFlag||"",
    comp: w.compliance, flat: w.flatStomach,
  }));

  // Weekly steps
  const wSteps = (json.weekly || []).filter(w => w.steps).map(w => ({ w: w.week, v: w.steps }));

  // Averages
  const avgs = json.runningAverages || {};
  const averages = {
    cal: avgs.calories||0, pro: avgs.protein||0, carb: avgs.carbs||0,
    fat: avgs.fat||0, fib: avgs.fiber||0, sug: avgs.sugar||0,
  };

  // Merge live proxy data for today
  if (todayLive && todayLive.calories > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayFmt = fmt(todayStr);
    const todayDow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
    const liveDay = {
      w: currentWeek, d: todayDow, dt: todayFmt, day: todayDow,
      cal: todayLive.calories, pro: todayLive.protein||0, carb: todayLive.carbs||0,
      fat: todayLive.fat||0, fib: todayLive.fiber||0, sug: todayLive.sugar||0,
      steps: todayLive.steps||0, comp: 0, flat: 0, gym: false, sleep: 0, wt: null,
    };
    const calS = Math.min(100, (liveDay.cal / 1350) * 100);
    const proS = Math.min(100, (liveDay.pro / 140) * 100);
    const fibS = Math.min(100, (liveDay.fib / 20) * 100);
    liveDay.comp = Math.round((calS + proS + fibS) / 3);
    liveDay.flat = Math.max(0, liveDay.comp - 2);
    const todayIdxW7 = dailyW7.findIndex(dd => dd.dt === todayFmt);
    if (todayIdxW7 >= 0) dailyW7[todayIdxW7] = {...dailyW7[todayIdxW7], ...liveDay};
    else dailyW7.push(liveDay);
    const todayIdxAll = dailyAll.findIndex(dd => dd.dt === todayFmt);
    if (todayIdxAll >= 0) dailyAll[todayIdxAll] = {...dailyAll[todayIdxAll], ...liveDay};
    else dailyAll.push(liveDay);
  }

  // Merge weight from proxy
  if (todayLive?._weightEntries?.length > 0) {
    const proxyW = todayLive._weightEntries.map(we => ({
      week: Math.max(1, Math.floor((new Date(we.date+"T00:00:00") - new Date("2026-01-05T00:00:00")) / (7*86400000)) + 1),
      kg: we.weight, date: fmt(we.date),
    }));
    useWeights.length = 0;
    useWeights.push({ week: 0, kg: json.meta?.startWeight || 80.5, date: fmt("2026-01-05") });
    proxyW.forEach(we => useWeights.push(we));
  }

  // Derived
  const lastWeight = useWeights[useWeights.length - 1] || { kg: 80.5, week: 0 };
  const startKg = json.meta?.startWeight || 80.5;
  const totalLost = (startKg - lastWeight.kg).toFixed(1);
  const lostPct = ((startKg - lastWeight.kg) / startKg * 100).toFixed(1);
  const todayData = dailyW7[dailyW7.length - 1] || dailyAll[dailyAll.length - 1] || FALLBACK_DAILY_W7[FALLBACK_DAILY_W7.length-1];

  return {
    WEIGHTS: useWeights, W_STEPS: wSteps.length > 0 ? wSteps : [{w:currentWeek,v:0}], W_NUTR: wNutr,
    DAILY_ALL: dailyAll, DAILY_W7: dailyW7,
    AVGS: averages, FOOD_LOG: {},
    today: todayData, lastW: lastWeight,
    lost: totalLost, lostPct: lostPct,
    startKg, currentWeek,
  };
}

// Build fallback data object (same shape as transformed)
function buildFallbackData() {
  const lastW = FALLBACK_WEIGHTS[FALLBACK_WEIGHTS.length-1];
  const todayData = FALLBACK_DAILY_W7[FALLBACK_DAILY_W7.length-1];
  return {
    WEIGHTS: FALLBACK_WEIGHTS,
    W_STEPS: [{w:1,v:3728},{w:2,v:5547},{w:3,v:6784},{w:4,v:5262},{w:5,v:7000},{w:6,v:8362}],
    W_NUTR: FALLBACK_W_NUTR,
    DAILY_ALL: FALLBACK_DAILY_ALL,
    DAILY_W7: FALLBACK_DAILY_W7,
    AVGS: {cal:1124,pro:145,carb:60,fat:34,fib:11,sug:24},
    FOOD_LOG: FALLBACK_FOOD_LOG,
    today: todayData, lastW: lastW,
    lost: (80.5-lastW.kg).toFixed(1),
    lostPct: ((80.5-lastW.kg)/80.5*100).toFixed(1),
    startKg: 80.5, currentWeek: 7,
  };
}

// Compute popular foods from food log
function computePopularFoods(foodLog) {
  const allFoods = Object.values(foodLog).flatMap(m => [...(m.breakfast||[]),...(m.lunch||[]),...(m.snack||[]),...(m.dinner||[])]);
  const freq = {};
  allFoods.forEach(f => {
    if (!freq[f.name]) freq[f.name] = {...f,count:0,totalCal:0,totalPro:0};
    freq[f.name].count++; freq[f.name].totalCal+=f.cal; freq[f.name].totalPro+=f.pro;
  });
  return Object.values(freq).sort((a,b)=>b.count-a.count).slice(0,8).map(f=>({...f,avgCal:Math.round(f.totalCal/f.count),avgPro:Math.round(f.totalPro/f.count)}));
}

// Compute insights from data
function computeInsights(data) {
  if (!data || !data.DAILY_ALL || !data.DAILY_W7 || !data.WEIGHTS) {
    return { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} };
  }
  const allDays = [...data.DAILY_ALL, ...data.DAILY_W7.map(d=>({...d,w:data.currentWeek||7}))];
  if (allDays.length === 0) return { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} };
  const reversed = [...allDays].reverse(); let streak=0;
  for (const d of reversed) { if ((d.comp||0)>=70) streak++; else break; }
  const recentW = data.WEIGHTS.slice(-3);
  const velocity = recentW.length>1 ? Math.abs((recentW[0].kg-recentW[recentW.length-1].kg)/(recentW.length-1)).toFixed(1) : "0.8";
  const proteinRate = Math.round(allDays.filter(d=>(d.pro||0)>=130).length/allDays.length*100);
  const dayTotals = {};
  allDays.forEach(d => { const day=d.day||d.d; if(!dayTotals[day]) dayTotals[day]={s:0,c:0}; dayTotals[day].s+=(d.steps||0); dayTotals[day].c++; });
  const mostActive = Object.entries(dayTotals).map(([day,v])=>({day,avg:Math.round(v.s/v.c)})).sort((a,b)=>b.avg-a.avg)[0] || {day:"Sun",avg:0};
  return { streak, velocity, proteinRate, mostActive };
}

// HOOKS
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useAnimateOnMount(dep) {
  const [vis, setVis] = useState(false);
  useEffect(() => { setVis(false); const t = setTimeout(()=>setVis(true), 30); return ()=>clearTimeout(t); }, [dep]);
  return vis;
}

// Animated number countup
function CountUp({ to, duration=800, prefix="", suffix="", decimals=0, color, style={} }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { setStarted(true); obs.unobserve(el); } }, { threshold: 0.3 });
    obs.observe(el); return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setVal(ease * to);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, to, duration]);
  return <span ref={ref} style={{fontFamily:'var(--mono)',fontWeight:800,color,...style}}>{prefix}{decimals?val.toFixed(decimals):Math.round(val)}{suffix}</span>;
}

// SCROLL-ANIMATED CARD
function AnimCard({ children, style={}, glow, delay=0 }) {
  const [ref, inView] = useInView(0.08);
  return (
    <div ref={ref} style={{background:C.card,borderRadius:20,padding:22,border:`1px solid ${C.cardBorder}`,
      backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',position:'relative',overflow:'hidden',
      transition:`border-color .3s, opacity .55s cubic-bezier(.4,0,.2,1) ${delay}s, transform .55s cubic-bezier(.4,0,.2,1) ${delay}s`,
      opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(16px)', ...style}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=C.cardBorderHover}
      onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
      {glow&&<div style={{position:'absolute',top:-50,right:-50,width:140,height:140,borderRadius:'50%',background:C.mintSoft,filter:'blur(60px)',pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

// TOOLTIP COMPONENT
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{position:'relative',display:'inline-flex',marginLeft:6,cursor:'help'}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
      onClick={()=>setShow(!show)}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      {show && <div style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',
        width:260,padding:'12px 14px',borderRadius:12,background:C.surfaceSolid,border:`1px solid ${C.border}`,
        boxShadow:'0 8px 32px rgba(0,0,0,.5)',zIndex:50,fontSize:11,lineHeight:1.5,color:C.text2,fontWeight:400,
        fontFamily:'var(--sans)',letterSpacing:0}}>
        <div style={{position:'absolute',bottom:-5,left:'50%',transform:'translateX(-50%) rotate(45deg)',width:10,height:10,background:C.surfaceSolid,border:`1px solid ${C.border}`,borderTop:'none',borderLeft:'none'}}/>
        {text}
      </div>}
    </span>
  );
}

// CHART HOVER TOOLTIP
function HoverTip({x,y,w,h,padT,padB,d}) {
  const bw=30,bh=11,tx=Math.min(Math.max(x,bw/2+1),w-bw/2-1),ty=Math.max(2,y-16);
  return (<>
    <line x1={x} y1={padT} x2={x} y2={h-padB} stroke={C.mint} strokeWidth="0.3" strokeDasharray="1.5,2" opacity="0.2"/>
    <rect x={tx-bw/2} y={ty} width={bw} height={bh} rx={3} fill={C.surfaceSolid} fillOpacity="0.9" stroke="rgba(184,255,87,0.08)" strokeWidth="0.3"/>
    <text x={tx} y={ty+5} textAnchor="middle" style={{fontSize:4.5,fill:C.mint,fontFamily:'var(--mono)',fontWeight:600}}>{d.kg}kg</text>
    <text x={tx} y={ty+9.5} textAnchor="middle" style={{fontSize:3,fill:C.text3,fontFamily:'var(--mono)'}}>W{d.week} · {d.date}</text>
  </>);
}

// INTERACTIVE WEIGHT CHART (subtle version)
function WeightChart({ data, w=300, h=100, visible=true }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const mn=Math.min(...data.map(d=>d.kg))-1, mx=Math.max(...data.map(d=>d.kg))+1, rng=mx-mn||1;
  const padT=10, padB=18, ch=h-padT-padB;
  const pts=data.map((d,i)=>({x:data.length>1?(i/(data.length-1))*w:w/2, y:padT+ch-((d.kg-mn)/rng)*ch, ...d}));
  const linePath=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const fillPath=`${linePath} L${pts[pts.length-1].x},${h} L0,${h} Z`;
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;l+=Math.sqrt(dx*dx+dy*dy);}return l;},[data]);
  const gid=useMemo(()=>`wc${Math.random().toString(36).slice(2,7)}`,[]);
  const getClosest = useCallback((clientX) => {
    const svg=svgRef.current; if(!svg)return null;
    const rect=svg.getBoundingClientRect();
    const svgX=((clientX-rect.left)/rect.width)*w;
    let closest=0,minDist=Infinity;
    pts.forEach((p,i)=>{const dist=Math.abs(p.x-svgX);if(dist<minDist){minDist=dist;closest=i;}});
    return closest;
  }, [pts, w]);
  const handleMove = useCallback((clientX) => { const idx=getClosest(clientX); if(idx!==null) setHover({x:pts[idx].x,y:pts[idx].y,idx}); }, [getClosest, pts]);

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
      style={{display:'block',overflow:'visible',cursor:'crosshair',touchAction:'none'}}
      onMouseMove={e=>handleMove(e.clientX)} onMouseLeave={()=>setHover(null)}
      onTouchStart={e=>handleMove(e.touches[0].clientX)}
      onTouchMove={e=>{e.preventDefault();handleMove(e.touches[0].clientX);}}
      onTouchEnd={()=>setTimeout(()=>setHover(null),1500)}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.mint} stopOpacity=".12"/><stop offset="100%" stopColor={C.mint} stopOpacity="0"/></linearGradient></defs>
      {pts.map((p,i)=><text key={i} x={p.x} y={h-2} textAnchor="middle" style={{fontSize:7,fill:C.text3,fontFamily:'var(--mono)',fontWeight:600}}>W{data[i].week}</text>)}
      <path d={fillPath} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>
      <path d={linePath} fill="none" stroke={C.mint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.6}
        style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={hover?.idx===i?2:1}
        fill={hover?.idx===i?C.mint:'rgba(184,255,87,0.2)'}
        stroke={hover?.idx===i?'rgba(255,255,255,0.3)':'none'} strokeWidth={0.5}
        style={{transition:'r .12s, fill .12s'}}>
        {i===pts.length-1&&!hover&&<animate attributeName="r" values="1;1.5;1" dur="2.5s" repeatCount="indefinite"/>}
      </circle>)}
      {hover&&<HoverTip x={hover.x} y={hover.y} w={w} h={h} padT={padT} padB={padB} d={data[hover.idx]}/>}
    </svg>
  );
}

function Spark({data,color=C.mint,w=200,h=50,fill=true,sw=2,visible=true}) {
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>[data.length>1?(i/(data.length-1))*w:w/2, h-((v-mn)/rng)*h*.82-h*.09]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fd=`${d} L${w},${h} L0,${h} Z`;
  const gid=useMemo(()=>`s${Math.random().toString(36).slice(2,7)}`,[]);
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];l+=Math.sqrt(dx*dx+dy*dy);}return l;},[pts]);
  return (<svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block',overflow:'visible'}}>
    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".15"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {fill&&<path d={fd} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>}
    <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.7}
      style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:`stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)`}}/>
    <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r={2.5} fill={color} fillOpacity={0.6} style={{opacity:visible?1:0,transition:'opacity .3s ease 1s'}}>
      <animate attributeName="r" values="2;3;2" dur="2.5s" repeatCount="indefinite"/></circle>
  </svg>);
}

function Ring({val,max=100,sz=80,sw=6,color=C.mint,visible=true,children}) {
  const pct=Math.min(val/max,1),r=(sz-sw)/2,circ=2*Math.PI*r,dash=pct*circ;
  return (<div style={{position:'relative',width:sz,height:sz}}>
    <svg width={sz} height={sz}><circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={C.border} strokeWidth={sw}/>
    <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={sw}
      strokeDasharray={visible?`${dash} ${circ-dash}`:`0 ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
      style={{transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1) .15s',filter:`drop-shadow(0 0 4px ${color}33)`}}/></svg>
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
          style={{transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1) .2s',filter:`drop-shadow(0 0 6px ${color}33)`}}/></svg>
      <div style={{position:'absolute',bottom:2,left:'50%',transform:'translateX(-50%)',textAlign:'center',opacity:visible?1:0,transition:'opacity .4s ease .5s'}}>
        <div style={{fontSize:sz>100?22:17,fontWeight:800,fontFamily:'var(--mono)',color:C.text,lineHeight:1}}>{display}</div>
        {unit&&<div style={{fontSize:8,color:C.text3,fontWeight:600,marginTop:1}}>{unit}</div>}</div>
    </div>
    <span style={{fontSize:10,color:C.text2,fontWeight:600,letterSpacing:.6,textTransform:'uppercase'}}>{label}</span>
  </div>);
}

function Bars({data,max,color=C.mint,h=80,activeIdx=-1,visible=true}) {
  const mx=max||Math.max(...data.map(d=>d.v));
  const [hov, setHov] = useState(-1);
  return (<div style={{display:'flex',alignItems:'flex-end',gap:4,height:h}}>
    {data.map((d,i)=>{const bh=Math.max(3,(d.v/mx)*h*.88), act=i===activeIdx, isHov=i===hov, isOn=act||isHov;
      return (<div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',position:'relative'}}
        onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(-1)}>
        {isHov&&!act&&<div style={{position:'absolute',top:-24,left:'50%',transform:'translateX(-50%)',
          padding:'2px 6px',borderRadius:5,background:C.surfaceSolid,border:`1px solid ${color}22`,
          fontSize:9,fontWeight:600,fontFamily:'var(--mono)',color,whiteSpace:'nowrap',zIndex:5}}>{d.v>=1000?d.v.toLocaleString():d.v}</div>}
        <div style={{width:'100%',maxWidth:22,height:visible?bh:0,borderRadius:6,
          background:isOn?`linear-gradient(180deg,${color},${color}77)`:isHov?`${color}33`:C.border,
          boxShadow:isOn?`0 0 8px ${color}22`:'none',
          transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*.06}s, background .2s`,
          transform:isHov&&!act?'scaleY(1.04)':'scaleY(1)', transformOrigin:'bottom'}}/>
        <span style={{fontSize:9,color:isOn?color:isHov?C.text2:C.text3,fontWeight:isOn?700:600,transition:'color .2s'}}>{d.label}</span>
      </div>);})}
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
        style={{transition:`stroke-dasharray .9s cubic-bezier(.4,0,.2,1) ${i*.12}s`}}/>;})}</svg>);
}

function Progress({val,min,max,color=C.mint,label,unit="g",visible=true}) {
  const pct=Math.min((val/max)*100,120), ok=val>=min&&val<=max, clr=ok?color:val<min?C.orange:C.red;
  return (<div style={{marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
      <span style={{fontSize:12,fontWeight:600,color:C.text2}}>{label}</span>
      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:C.text}}>{val}</span>
        <span style={{fontSize:10,color:C.text3}}>{unit} / {min}–{max}</span></div></div>
    <div style={{height:5,borderRadius:3,background:'rgba(255,255,255,0.03)',overflow:'hidden'}}>
      <div style={{height:'100%',width:visible?`${Math.min(pct,100)}%`:'0%',borderRadius:3,
        background:`linear-gradient(90deg,${clr}BB,${clr})`,boxShadow:`0 0 6px ${clr}22`,
        transition:'width 1s cubic-bezier(.4,0,.2,1) .1s'}}/></div>
  </div>);
}

function Tag({children,color=C.mint,bg}){return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:8,background:bg||(color+'16'),color,fontSize:11,fontWeight:700,letterSpacing:.2}}>{children}</span>;}
function Lbl({children,tip}){return <div style={{fontSize:10,color:C.text3,fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center'}}>{children}{tip&&<InfoTip text={tip}/>}</div>;}

function TimePicker({value,onChange}) {
  const opts=[{id:"today",l:"Today"},{id:"thisWeek",l:"This Week"},{id:"lastWeek",l:"Last Week"},{id:"month",l:"Month"},{id:"day",l:"Day by Day"}];
  return (<div style={{display:'flex',gap:4,padding:3,borderRadius:12,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,flexWrap:'wrap'}}>
    {opts.map(o=>(<button key={o.id} onClick={()=>onChange(o.id)} style={{padding:'6px 12px',borderRadius:9,border:'none',cursor:'pointer',
      background:value===o.id?C.mintSoft:'transparent',color:value===o.id?C.mint:C.text3,
      fontSize:11,fontWeight:value===o.id?700:500,fontFamily:'var(--sans)',transition:'all .2s'}}>{o.l}</button>))}</div>);
}

function DayPicker({days,selected,onSelect}) {
  return (<div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,scrollbarWidth:'none'}}>
    {days.map((d,i)=>{const sel=selected===i;
      return (<button key={i} onClick={()=>onSelect(i)} style={{flexShrink:0,padding:'8px 12px',borderRadius:12,border:`1px solid ${sel?C.mintMed:'transparent'}`,cursor:'pointer',
        background:sel?C.mintSoft:'rgba(255,255,255,0.02)',color:sel?C.mint:C.text2,fontFamily:'var(--sans)',fontSize:11,fontWeight:sel?700:500,transition:'all .2s',minWidth:58,textAlign:'center'}}>
        <div style={{fontSize:9,color:sel?C.mint:C.text3,fontWeight:700}}>{d.day||d.d}</div>
        <div style={{fontSize:11,fontWeight:700,marginTop:2}}>{d.dt?.split(' ')[1]||''}</div></button>);})}
  </div>);
}

const I={
  grid:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  fork:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  pulse:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trend:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  target:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  coach:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z"/><path d="M17 10c3 1 5 3 5 6H2c0-3 2-5 5-6"/><path d="M12 15v7"/></svg>,
  check:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  x:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  down:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>,
  fire:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14 0-5.5 3-7 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  shoe:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 16v-2.38C4 11.5 2.97 9.5 3 8c.08-3.07 3.9-4.43 6-1l.75 1.23a2 2 0 0 0 2.15.8L14 8.5c.85-.17 1.7 0 2.38.46l3.85 2.57a1 1 0 0 1 .36 1.12L19.73 16M4 16h16M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2"/></svg>,
  dumbbell:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6.5 6.5 11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/></svg>,
  bell:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  collapse:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>,
  expand:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>,
  sparkle:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4M22 5h-4"/></svg>,
};

// DATA HELPERS
function getPeriod(period, dayIdx=0, D) {
  if (!D) return {};
  if (period==="today") return D.DAILY_W7[D.DAILY_W7.length-1] || D.today;
  if (period==="day") return D.DAILY_W7[dayIdx] || D.DAILY_W7[0] || D.today;
  const avg=(arr,key)=>Math.round(arr.reduce((a,d)=>a+(d[key]||0),0)/arr.length);
  const avgF=(arr,key)=>+(arr.reduce((a,d)=>a+(d[key]||0),0)/arr.length).toFixed(1);
  if (period==="thisWeek") {const d=D.DAILY_W7;if(!d.length)return D.today;return{day:`Week ${D.currentWeek}`,dt:"This Week",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'flat')||avg(d,'comp')-2,steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length};}
  if (period==="lastWeek") {const lw=D.currentWeek-1;const d=D.DAILY_ALL.filter(x=>x.w===lw);if(!d.length)return D.today;return{day:`Week ${lw}`,dt:"Last Week",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'comp')-2,steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length};}
  if (period==="month") {const cutoff=Math.max(1,D.currentWeek-4);const d=D.DAILY_ALL.filter(x=>x.w>=cutoff);if(!d.length)return D.today;return{day:"Last 4 wks",dt:"Month",cal:avg(d,'cal'),pro:avg(d,'pro'),carb:avg(d,'carb'),fat:avg(d,'fat'),fib:avg(d,'fib'),sug:avg(d,'sug'),comp:avg(d,'comp'),flat:avg(d,'comp')-2,steps:avg(d,'steps'),sleep:avgF(d,'sleep'),gym:d.filter(x=>x.gym).length};}
  return D.today;
}
// TAB RENDERERS
function OverviewTab({vis,isD,isT,isM,D}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(D.DAILY_W7.length-1);
  const localVis = useAnimateOnMount(`${period}-${dayIdx}`);
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx,D):getPeriod(period,0,D);
  const isAvg=period!=="today"&&period!=="day";
  const label=period==="today"?"Today":period==="day"?d.dt:period==="thisWeek"?"This Week Avg":period==="lastWeek"?"Last Week Avg":"Month Avg";
  const checks=[
    {task:"Protein 130–160g",ok:d.pro>=130,val:`${d.pro}g`},
    {task:`Calories 1,300–1,500${isAvg?' avg':''}`,ok:d.cal>=1300&&d.cal<=1500,val:`${d.cal}`},
    {task:"Steps 8,000+",ok:d.steps>=8000,val:d.steps?.toLocaleString()},
    {task:"Fiber 20–30g",ok:d.fib>=20,val:`${d.fib}g`},
    {task:"Sugar < 20g",ok:d.sug<=20,val:`${d.sug}g`},
    {task:"Gym session",ok:isAvg?d.gym>=3:d.gym,val:isAvg?`${d.gym} days`:d.gym?"Done":"Rest"},
    {task:"Sleep 7+ hrs",ok:d.sleep>=7,val:`${d.sleep}h`},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={D.DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}</div>
      <AnimCard glow style={{gridColumn:isD?'1/4':isT?'1/3':'1',padding:isD?28:22}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <Lbl>Current Weight</Lbl>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <CountUp to={D.lastW?.kg} decimals={1} style={{fontSize:isM?36:46,letterSpacing:-2,lineHeight:1}} color={C.text}/>
              <span style={{fontSize:16,color:C.text2,fontWeight:600}}>kg</span></div>
            <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
              <Tag color={C.mint}>{I.down} {D.lost} kg lost</Tag>
              <Tag color={C.text2} bg="rgba(255,255,255,0.04)">{D.lostPct}% total</Tag></div></div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {[{l:"Start",v:"80.5",s:"Jan 5"},{l:"Now",v:String(D.lastW?.kg),s:`Wk ${D.lastW?.week}`},{l:"Goal",v:"68.0",s:"~15% BF"}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:'10px 14px',borderRadius:14,background:m.l==="Now"?C.mintSoft:'rgba(255,255,255,0.02)',minWidth:72}}>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:m.l==="Now"?C.mint:C.text}}>{m.v}</div>
                <div style={{fontSize:9,color:C.text3,marginTop:2}}>{m.s}</div></div>))}</div></div>
        <div style={{marginTop:16}}><WeightChart data={D.WEIGHTS} w={300} h={80} visible={v}/></div>
      </AnimCard>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'grid',gridTemplateColumns:isM?'1fr':'repeat(3,1fr)',gap:isD?14:12}}>
        <AnimCard delay={0.05} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl tip={TIPS.compliance}>{label} Compliance</Lbl>
          <Ring val={d.comp} sz={isD?86:74} sw={6} color={C.mint} visible={v}><CountUp to={d.comp} style={{fontSize:22}} color={C.text}/></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.cal} max={1500} label="Calories" unit="kcal" color={d.cal>=1200&&d.cal<=1500?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard>
        <AnimCard delay={0.1} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl tip={TIPS.flatStomach}>{label} Flat Stomach</Lbl>
          <Ring val={d.flat} sz={isD?86:74} sw={6} color={C.cyan} visible={v}><CountUp to={d.flat} style={{fontSize:22}} color={C.cyan}/></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.steps} max={10000} label="Steps" color={d.steps>=8000?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard>
        <AnimCard delay={0.15} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl tip={TIPS.protein}>{label} Protein</Lbl>
          <Ring val={Math.round(d.pro/160*100)} sz={isD?86:74} sw={6} color={d.pro>=130?C.mint:C.orange} visible={v}>
            <span style={{fontSize:18,fontWeight:900,fontFamily:'var(--mono)'}}>{d.pro}<span style={{fontSize:10,fontWeight:600,color:C.text2}}>g</span></span></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.pro} max={160} label="of 160g target" unit="" color={d.pro>=130?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard></div>
      <AnimCard delay={0.2} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Quick Insights</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isM?'repeat(2,1fr)':'repeat(4,1fr)',gap:10}}>
          {[{l:"Streak",v:D.insights.streak,suf:"d",sub:"≥70 compliance",c:C.mint,icon:I.fire},
            {l:"Weight Pace",v:parseFloat(D.insights.velocity),suf:"kg/wk",pre:"-",sub:"Last 3 weeks",c:C.cyan,icon:I.down,dec:1},
            {l:"Protein Hits",v:D.insights.proteinRate,suf:"%",sub:"Days ≥130g",c:D.insights.proteinRate>=70?C.mint:C.orange,icon:I.target},
            {l:"Most Active",v:0,text:D.insights.mostActive.day,sub:`${D.insights.mostActive.avg.toLocaleString()} steps`,c:C.blue,icon:I.shoe},
          ].map((s,i)=>(<div key={i} style={{padding:'14px 12px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><div style={{color:s.c}}>{s.icon}</div>
              <span style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8}}>{s.l}</span></div>
            {s.text?<div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:s.c}}>{s.text}</div>
              :<CountUp to={s.v} prefix={s.pre||""} suffix={s.suf||""} decimals={s.dec||0} style={{fontSize:18}} color={s.c}/>}
            <div style={{fontSize:10,color:C.text3,marginTop:2}}>{s.sub}</div>
          </div>))}</div>
      </AnimCard>
      <AnimCard delay={0.25} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>{label} Checklist</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'1fr 1fr':isT?'1fr 1fr':'1fr',gap:isD?'0 24px':'0'}}>
        {checks.map((c,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:`1px solid ${C.border}`,
          opacity:v?1:0,transform:v?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.04}s`}}>
          <div style={{width:26,height:26,borderRadius:8,background:c.ok?C.mintSoft:C.redSoft,color:c.ok?C.mint:C.red,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{c.ok?I.check:I.x}</div>
          <span style={{flex:1,fontSize:12,fontWeight:500,color:c.ok?C.text:C.text2}}>{c.task}</span>
          <span style={{fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:c.ok?C.mint:C.red}}>{c.val}</span>
        </div>))}</div>
      </AnimCard></div>);
}

function NutritionTab({vis,isD,isT,isM,D}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(D.DAILY_W7.length-1);
  const [foodTab, setFoodTab] = useState("log");
  const localVis = useAnimateOnMount(`${period}-${dayIdx}`);
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx,D):getPeriod(period,0,D);
  const isAvg=period!=="today"&&period!=="day";
  const dateLabel=period==="today"?(D.today?.dt||"Today"):period==="day"?(D.DAILY_W7[dayIdx]?.dt||"Today"):period==="thisWeek"?"Week 7 Avg":period==="lastWeek"?"Week 6 Avg":"Month Avg";
  const macros=[{name:"Protein",v:d.pro*4,c:C.mint},{name:"Carbs",v:d.carb*4,c:C.blue},{name:"Fat",v:d.fat*9,c:C.orange}];
  const foodDate=period==="today"?(D.today?.dt||null):period==="day"?(D.DAILY_W7[dayIdx]?.dt||"Today"):null;
  const dayMeals=foodDate?D.FOOD_LOG[foodDate]:null;
  const mealOrder=[{key:"breakfast",label:"Breakfast",icon:"☀"},{key:"lunch",label:"Lunch",icon:"☕"},{key:"snack",label:"Snack",icon:"🍎"},{key:"dinner",label:"Dinner",icon:"🌙"}];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={D.DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}</div>
      <AnimCard style={{gridColumn:isD?'1/3':isT?'1/3':'1'}}>
        <Lbl>{dateLabel} Macros</Lbl>
        <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:isM?'wrap':'nowrap'}}>
          <div style={{position:'relative',flexShrink:0}}>
            <Donut segs={macros} sz={isD?130:110} sw={13} visible={v}/>
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
              <CountUp to={d.cal} style={{fontSize:22}} color={C.text}/>
              <span style={{fontSize:8,color:C.text3,fontWeight:700}}>KCAL</span></div></div>
          <div style={{flex:1,minWidth:180}}>
            <Progress label="Calories" val={d.cal} min={1300} max={1500} color={C.mint} unit=" kcal" visible={v}/>
            <Progress label="Protein" val={d.pro} min={130} max={160} color={C.mint} visible={v}/>
            <Progress label="Carbs" val={d.carb} min={40} max={70} color={C.blue} visible={v}/>
            <Progress label="Fat" val={d.fat} min={40} max={55} color={C.orange} visible={v}/>
            <Progress label="Fiber" val={d.fib} min={20} max={30} color={C.cyan} visible={v}/>
            <Progress label="Sugar" val={d.sug} min={0} max={20} color={C.purple} visible={v}/>
          </div></div>
      </AnimCard>
      <AnimCard delay={0.05}>
        <Lbl>All-Time Averages</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[{l:"Calories",v:D.AVGS.cal,u:"kcal",c:C.mint},{l:"Protein",v:D.AVGS.pro,u:"g",c:C.mint},{l:"Carbs",v:D.AVGS.carb,u:"g",c:C.blue},{l:"Fat",v:D.AVGS.fat,u:"g",c:C.orange},{l:"Fiber",v:D.AVGS.fib,u:"g",c:C.cyan},{l:"Sugar",v:D.AVGS.sug,u:"g",c:C.purple}].map((a,i)=>(
            <div key={a.l} style={{textAlign:'center',padding:'12px 8px',borderRadius:14,background:'rgba(255,255,255,0.02)',opacity:v?1:0,transform:v?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.06}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{a.l}</div>
              <CountUp to={a.v} style={{fontSize:18}} color={a.c}/>
              <div style={{fontSize:9,color:C.text3}}>{a.u}</div></div>))}</div>
      </AnimCard>
      <AnimCard delay={0.1} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Lbl>{foodTab==="log"?"Food Diary":"Most Eaten Foods"}</Lbl>
          <div style={{display:'flex',gap:4,padding:2,borderRadius:8,background:'rgba(255,255,255,0.03)'}}>
            <button onClick={()=>setFoodTab("log")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="log"?C.mintSoft:'transparent',color:foodTab==="log"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>Today's Log</button>
            <button onClick={()=>setFoodTab("popular")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="popular"?C.mintSoft:'transparent',color:foodTab==="popular"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>Top Foods</button></div></div>
        {foodTab==="log"?(dayMeals?(<div style={{display:'flex',flexDirection:'column',gap:12}}>
          {mealOrder.map(meal=>{const items=dayMeals[meal.key]; if(!items||!items.length)return null;
            return (<div key={meal.key}>
              <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:.8,marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                <span>{meal.icon}</span>{meal.label}</div>
              {items.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',borderRadius:12,background:'rgba(255,255,255,0.02)',marginBottom:4,
                opacity:v?1:0,transform:v?'translateX(0)':'translateX(-6px)',transition:`all .3s ease ${i*.03}s`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
                  <div style={{fontSize:9,color:C.text3,marginTop:1}}>{f.amount}</div></div>
                <div style={{display:'flex',gap:isM?6:12,flexShrink:0}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.cal}</div><div style={{fontSize:7,color:C.text3}}>cal</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.pro}</div><div style={{fontSize:7,color:C.text3}}>pro</div></div>
                  {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>{f.carb}</div><div style={{fontSize:7,color:C.text3}}>carb</div></div>}
                  {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>{f.fat}</div><div style={{fontSize:7,color:C.text3}}>fat</div></div>}
                </div></div>))}</div>);})}
          <div style={{display:'flex',justifyContent:'flex-end',gap:14,padding:'8px 12px',borderTop:`1px solid ${C.border}`}}>
            <span style={{fontSize:10,color:C.text3,fontWeight:600}}>Total:</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{Object.values(dayMeals).flat().reduce((a,f)=>a+f.cal,0)} cal</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{Math.round(Object.values(dayMeals).flat().reduce((a,f)=>a+f.pro,0))}g pro</span></div>
        </div>):(<div style={{padding:20,textAlign:'center',color:C.text3,fontSize:12}}>{isAvg?"Switch to Today or Day by Day to see meals.":"No food data for this day."}</div>))
        :(<div style={{display:'grid',gridTemplateColumns:isD?'repeat(2,1fr)':'1fr',gap:8}}>
          {D.POPULAR_FOODS.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`,
            opacity:v?1:0,transform:v?'translateY(0)':'translateY(8px)',transition:`all .3s ease ${i*.04}s`}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.mintSoft,color:C.mint,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{f.count}×</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
              <div style={{fontSize:10,color:C.text3,marginTop:1}}>Avg: {f.avgCal} cal · {f.avgPro}g protein</div></div>
          </div>))}</div>)}
      </AnimCard>
      <AnimCard delay={0.15} style={{gridColumn:isD?'1/4':isT?'1/3':'1',overflowX:'auto'}}>
        <Lbl>Weekly Nutrition Averages</Lbl>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr>{["Wk","Cal","Pro","Carb","Fat","Fib","Sug","Score"].map(h=>(
            <th key={h} style={{padding:'10px 6px',color:C.text3,fontWeight:700,textAlign:'center',fontSize:10,letterSpacing:.5,borderBottom:`1px solid ${C.border}`}}>{h}</th>))}</tr></thead>
          <tbody>{D.W_NUTR.map((w,ri)=>(<tr key={w.w} style={{borderBottom:`1px solid ${C.border}`,opacity:v?1:0,transform:v?'translateX(0)':'translateX(-8px)',transition:`all .35s ease ${ri*.06}s`}}>
            <td style={{padding:'10px 6px',textAlign:'center',fontWeight:700,color:C.mint,fontFamily:'var(--mono)'}}>{w.w}</td>
            {[w.cal,w.pro,w.carb,w.fat,w.fib,w.sug].map((v,i)=>(<td key={i} style={{padding:'10px 6px',textAlign:'center',fontFamily:'var(--mono)',fontWeight:600,color:C.text}}>{Math.round(v)}</td>))}
            <td style={{padding:'10px 6px',textAlign:'center'}}><span style={{display:'inline-block',padding:'3px 8px',borderRadius:6,background:w.comp>=70?C.mintSoft:w.comp>=50?C.orangeSoft:C.redSoft,color:w.comp>=70?C.mint:w.comp>=50?C.orange:C.red,fontSize:11,fontWeight:700,fontFamily:'var(--mono)'}}>{w.comp}</span></td>
          </tr>))}</tbody></table>
      </AnimCard></div>);
}

function ActivityTab({vis,isD,isT,isM,D}) {
  const [period, setPeriod] = useState("today");
  const [dayIdx, setDayIdx] = useState(D.DAILY_W7.length-1);
  const localVis = useAnimateOnMount(`${period}-${dayIdx}`);
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=period==="day"?getPeriod("day",dayIdx,D):getPeriod(period,0,D);
  const label=period==="today"?"Today":period==="day"?d.dt:period==="thisWeek"?"This Week":period==="lastWeek"?"Last Week":"Month";
  const gymDays=D.DAILY_ALL.filter(x=>x.gym).length, totalDays=D.DAILY_ALL.length;
  const avgSleep=(D.DAILY_ALL.reduce((a,x)=>a+x.sleep,0)/totalDays).toFixed(1);
  const avgSteps=Math.round(D.DAILY_ALL.reduce((a,x)=>a+x.steps,0)/totalDays);
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'flex',flexDirection:'column',gap:8}}>
        <TimePicker value={period} onChange={setPeriod}/>
        {period==="day"&&<DayPicker days={D.DAILY_W7} selected={dayIdx} onSelect={setDayIdx}/>}</div>
      <AnimCard style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Lbl tip={TIPS.steps}>{label} Steps</Lbl>
        <Arc val={d.steps} max={10000} label="" sz={isD?140:120} sw={10} color={d.steps>=8000?C.mint:C.orange} visible={v}/>
        <div style={{marginTop:8}}><Tag color={d.steps>=8000?C.mint:C.orange}>{d.steps>=8000?"On target":"Below target"}</Tag></div>
      </AnimCard>
      <AnimCard delay={0.05}>
        <Lbl>All-Time Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:"Gym Days",v:gymDays,u:`/ ${totalDays}`,c:C.mint},{l:"Avg Steps",v:avgSteps.toLocaleString(),u:"/day",c:C.blue},{l:"Avg Sleep",v:avgSleep,u:"hrs",c:C.purple},{l:"Gym Rate",v:`${Math.round(gymDays/totalDays*100)}%`,u:"",c:C.cyan}].map((s,i)=>(
            <div key={s.l} style={{padding:'14px 12px',borderRadius:14,background:'rgba(255,255,255,0.02)',opacity:v?1:0,transform:v?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.08}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{s.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:3}}><span style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:s.c}}>{s.v}</span><span style={{fontSize:10,color:C.text3}}>{s.u}</span></div>
            </div>))}</div>
      </AnimCard>
      <AnimCard delay={0.1}>
        <Lbl>Weekly Steps Trend</Lbl>
        <Bars data={D.W_STEPS.map(s=>({v:s.v,label:`W${s.w}`}))} max={12000} color={C.blue} activeIdx={D.W_STEPS.length-1} visible={v}/>
        <div style={{textAlign:'center',marginTop:14}}><CountUp to={(D.W_STEPS[D.W_STEPS.length-1]||{v:0}).v} style={{fontSize:24}} color={C.blue}/><span style={{fontSize:11,color:C.text3,marginLeft:6}}>avg W{D.currentWeek}</span></div>
      </AnimCard>
      <AnimCard delay={0.15} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 — Daily Activity</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isD?'repeat(4,1fr)':isT?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {D.DAILY_W7.map((dd,i)=>{const isToday=i===D.DAILY_W7.length-1;
            return (<div key={i} style={{padding:'16px 14px',borderRadius:16,background:isToday?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isToday?C.mintMed:'transparent'}`,
              cursor:'pointer',opacity:v?1:0,transform:v?'translateY(0)':'translateY(12px)',transition:`all .4s ease ${i*.08}s`}}
              onMouseEnter={e=>{if(!isToday){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor=C.cardBorderHover;}}}
              onMouseLeave={e=>{if(!isToday){e.currentTarget.style.background='rgba(255,255,255,0.02)';e.currentTarget.style.borderColor='transparent';}}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <span style={{fontSize:13,fontWeight:800,color:isToday?C.mint:C.text}}>{dd.day}</span>
                {isToday&&<Tag color={C.mint}>Today</Tag>}</div>
              <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{dd.steps.toLocaleString()}</div>
              <div style={{fontSize:9,color:C.text3,marginTop:2}}>steps</div>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <div><div style={{fontSize:9,color:C.text3}}>Sleep</div><div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',color:dd.sleep>=7?C.cyan:C.orange}}>{dd.sleep}h</div></div>
                <div><div style={{fontSize:9,color:C.text3}}>Gym</div><div style={{color:dd.gym?C.mint:C.text3,display:'flex',alignItems:'center',marginTop:2}}>{dd.gym?I.check:I.x}</div></div>
              </div></div>);})}
        </div>
      </AnimCard></div>);
}

function ProgressTab({vis,isD,isT,D}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const velocity=D.insights.velocity, remaining=12.5-parseFloat(D.lost), weeksLeft=Math.ceil(remaining/parseFloat(velocity||0.8));
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <AnimCard glow style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Weight Progress</Lbl>
        <div style={{display:'flex',alignItems:'flex-end',gap:isD?20:12,flexWrap:'wrap'}}>
          <div>
            <CountUp to={D.lastW?.kg} decimals={1} style={{fontSize:40,letterSpacing:-2,lineHeight:1}} color={C.text}/><span style={{fontSize:16,color:C.text2,marginLeft:4}}>kg</span>
            <div style={{display:'flex',gap:8,marginTop:8}}><Tag color={C.mint}>{I.down} {D.lost} kg</Tag><Tag color={C.text2} bg="rgba(255,255,255,0.04)">{D.lostPct}%</Tag></div></div>
          <div style={{flex:1,minWidth:200}}><WeightChart data={D.WEIGHTS} w={300} h={100} visible={vis}/></div></div>
        <div style={{display:'flex',gap:8,marginTop:16,overflowX:'auto',paddingBottom:4}}>
          {D.WEIGHTS.map((w,i)=>(<div key={i} style={{textAlign:'center',padding:'8px 12px',borderRadius:10,background:i===D.WEIGHTS.length-1?C.mintSoft:'rgba(255,255,255,0.02)',flexShrink:0,minWidth:52,
            opacity:vis?1:0,transform:vis?'translateY(0)':'translateY(8px)',transition:`all .35s ease ${i*.06}s`}}>
            <div style={{fontSize:8,color:C.text3,fontWeight:700}}>W{w.week}</div>
            <div style={{fontSize:13,fontWeight:800,fontFamily:'var(--mono)',color:i===D.WEIGHTS.length-1?C.mint:C.text,marginTop:2}}>{w.kg}</div>
            {i>0&&<div style={{fontSize:8,color:C.mint,marginTop:1}}>-{(D.WEIGHTS[i-1].kg-w.kg).toFixed(1)}</div>}
          </div>))}</div>
      </AnimCard>
      <AnimCard delay={0.05}><Lbl tip={TIPS.compliance}>Compliance Trend</Lbl>
        <Bars data={D.W_NUTR.map(w=>({v:w.comp,label:`W${w.w}`}))} max={100} color={C.mint} activeIdx={D.W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3}}>Best</div><CountUp to={Math.max(...D.W_NUTR.map(w=>w.comp))} style={{fontSize:17}} color={C.mint}/></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>Latest</div><CountUp to={D.W_NUTR[5].comp} style={{fontSize:17}} color={C.mint}/></div></div>
      </AnimCard>
      <AnimCard delay={0.1}><Lbl tip={TIPS.flatStomach}>Flat Stomach Trend</Lbl>
        <Bars data={D.W_NUTR.map(w=>({v:w.flat,label:`W${w.w}`}))} max={100} color={C.cyan} activeIdx={D.W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3}}>Best</div><CountUp to={Math.max(...D.W_NUTR.map(w=>w.flat))} style={{fontSize:17}} color={C.cyan}/></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>Latest</div><CountUp to={D.W_NUTR[5].flat} style={{fontSize:17}} color={C.cyan}/></div></div>
      </AnimCard>
      <AnimCard delay={0.15}><Lbl>Steps Over Weeks</Lbl>
        <Spark data={D.W_STEPS.map(s=>s.v)} color={C.blue} w={200} h={60} visible={vis}/></AnimCard>
      <AnimCard delay={0.2}><Lbl>Calorie Avg Over Weeks</Lbl>
        <Spark data={D.W_NUTR.map(w=>w.cal)} color={C.orange} w={200} h={60} visible={vis}/></AnimCard>
      <AnimCard delay={0.25}><Lbl>Projected Finish</Lbl>
        <div style={{textAlign:'center'}}>
          <CountUp to={weeksLeft} style={{fontSize:32}} color={C.cyan}/><span style={{fontSize:14,color:C.text3,marginLeft:4}}>weeks to go</span>
          <div style={{fontSize:10,color:C.text3,marginTop:8}}>At -{velocity} kg/week pace</div></div>
      </AnimCard></div>);
}

function TargetsTab({vis,isD,isT,D}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const phases=[
    {n:1,l:"Fat Loss",wk:"Weeks 1–7",goal:"Aggressive fat loss, protect muscle",cal:"1,300–1,500",pro:"130–160",carb:"40–70",fat:"40–55",sug:"< 20",fib:"20–30",steps:"8k–10k",train:"3x strength + rope",active:true},
    {n:2,l:"Lean Out",wk:"Weeks 8–11",goal:"Continue fat loss, rebuild energy",cal:"1,600–1,800",pro:"130–150",carb:"80–130",fat:"45–65",sug:"< 30",fib:"25–35",steps:"8k–12k",train:"3–4x strength",active:false},
    {n:3,l:"Abs Reveal",wk:"Weeks 12–14",goal:"Final tightening, visible abs",cal:"1,500–1,650",pro:"140–160",carb:"60–100",fat:"40–55",sug:"< 25",fib:"25–35",steps:"10k+",train:"4x strength + core",active:false},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {phases.map((p,pi)=>(<AnimCard key={p.n} glow={p.active} delay={pi*0.08} style={{gridColumn:isD&&p.active?'1/4':isT&&p.active?'1/3':'1'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:12,background:p.active?C.mint:'rgba(255,255,255,0.04)',color:p.active?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0}}>{p.n}</div>
          <div><div style={{fontSize:15,fontWeight:800,color:p.active?C.mint:C.text}}>{p.l}</div><div style={{fontSize:11,color:C.text3}}>{p.wk}</div></div>
          {p.active&&<Tag color={C.mint} bg={C.mintSoft}>Active</Tag>}</div>
        <div style={{fontSize:12,color:C.text2,marginBottom:14}}>{p.goal}</div>
        <div style={{display:'grid',gridTemplateColumns:p.active&&isD?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {[{l:"Calories",v:p.cal,u:"kcal"},{l:"Protein",v:p.pro,u:"g"},{l:"Carbs",v:p.carb,u:"g"},{l:"Fat",v:p.fat,u:"g"},{l:"Sugar",v:p.sug,u:"g"},{l:"Fiber",v:p.fib,u:"g"},{l:"Steps",v:p.steps,u:"/day"},{l:"Training",v:p.train,u:""}].map(t=>(
            <div key={t.l} style={{padding:'12px 12px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>{t.l}</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:t.l==="Training"?'var(--sans)':'var(--mono)'}}>{t.v}{t.u&&<span style={{fontSize:9,color:C.text3,marginLeft:3}}>{t.u}</span>}</div></div>))}</div>
      </AnimCard>))}
      <AnimCard delay={0.25} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Week 7 — Daily Breakdown</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {D.DAILY_W7.map((d,i)=>{const isT2=i===D.DAILY_W7.length-1;
            return (<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:isT2?C.mintSoft:'rgba(255,255,255,0.02)',border:`1px solid ${isT2?C.mintMed:'transparent'}`,
              cursor:'pointer',opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.06}s`}}
              onMouseEnter={e=>{if(!isT2){e.currentTarget.style.background='rgba(255,255,255,0.04)';}}}
              onMouseLeave={e=>{if(!isT2){e.currentTarget.style.background='rgba(255,255,255,0.02)';}}}>
              <div style={{width:40,height:40,borderRadius:12,background:isT2?C.mint:C.surfaceSolid,color:isT2?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{d.day}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)'}}>{d.cal} kcal</span>
                  {d.gym&&<span style={{color:C.mint,display:'flex',alignItems:'center'}}>{I.dumbbell}</span>}
                  {isT2&&<Tag color={C.mint}>Today</Tag>}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:3}}>P:{d.pro}g · C:{d.carb}g · F:{d.fat}g · {d.steps.toLocaleString()} steps</div></div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <Ring val={d.comp} sz={40} sw={4} color={d.comp>=80?C.mint:d.comp>=60?C.orange:C.red} visible={vis}>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:'var(--mono)'}}>{d.comp}</span></Ring>
                <span style={{fontSize:7,color:C.text3,fontWeight:600}}>compliance</span>
              </div>
            </div>);})}
        </div>
      </AnimCard></div>);
}

// AI COACH TAB
function CoachTab({vis,isD,isT,isM,D}) {
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEnd = useRef(null);
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const typeColor = {warning:C.orange,success:C.mint,action:C.blue};
  const remaining = {cal:Math.max(0,1400-D.today.cal),pro:Math.max(0,140-D.today.pro),fib:Math.max(0,25-D.today.fib),steps:Math.max(0,8000-D.today.steps)};

  const contextPrompt = `You are a concise, expert fitness coach for Robin on a 14-week fat loss program. Phase 1 (current): aggressive fat loss while protecting muscle.
CURRENT DATA: Today: ${D.today.cal} cal, ${D.today.pro}g protein, ${D.today.carb}g carbs, ${D.today.fat}g fat, ${D.today.fib}g fiber, ${D.today.sug}g sugar, ${D.today.steps} steps, ${D.today.sleep}h sleep, gym: ${D.today.gym?"yes":"no"}.
Targets: 1300-1500 cal, 130-160g protein, 40-70g carbs, 40-55g fat, 20-30g fiber, <20g sugar, 8000+ steps.
Weight: ${D.lastW?.kg}kg (started 80.5, goal 68, lost ${D.lost}kg). Week ${D.lastW?.week+1}/14. Velocity: -${D.insights.velocity}kg/wk.
Week 6 avgs: ${D.W_NUTR[5].cal} cal, ${D.W_NUTR[5].pro}g pro. Streak: ${D.insights.streak}d. Protein rate: ${D.insights.proteinRate}%.
Most eaten: ${D.POPULAR_FOODS.slice(0,5).map(f=>f.name).join(', ')}.
Be concise (2-4 sentences), practical, reference actual numbers. Suggest specific foods with macros when relevant.`;

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  const getOfflineTip = (q) => {
    const ql = q.toLowerCase();
    if (ql.includes("eat")||ql.includes("dinner")||ql.includes("meal")||ql.includes("food")||ql.includes("lunch")||ql.includes("snack")||ql.includes("breakfast"))
      return `You still need ~${remaining.cal} cal and ${remaining.pro}g protein D.today. Try: 150g salmon (280cal, 30g pro) + 200g broccoli (68cal, 6g fiber) + 100g lentils (116cal, 9g pro, 8g fiber). That closes your macro gaps nicely.`;
    if (ql.includes("protein"))
      return `You're at ${D.today.pro}g protein (target: 130-160g). ${D.today.pro>=130?"On track! Keep going.":"Add a whey shake (+24g) or 150g chicken (+47g) to close the gap."}`;
    if (ql.includes("step")||ql.includes("walk")||ql.includes("cardio"))
      return `${D.today.steps.toLocaleString()} steps D.today. ${D.today.steps>=8000?"Target hit! Great work.":"Need "+remaining.steps+" more. A brisk 20-min walk adds ~2,500 steps. Try after dinner."}`;
    if (ql.includes("weight")||ql.includes("progress")||ql.includes("how am i"))
      return `You've lost ${D.lost}kg in ${D.lastW?.week+1} weeks (${D.lostPct}% of starting weight). At -${D.insights.velocity}kg/week, you're on pace to reach 68kg in ~${Math.ceil((D.lastW?.kg-68)/parseFloat(D.insights.velocity||0.8))} more weeks. That's solid progress.`;
    if (ql.includes("sleep"))
      return `${D.today.sleep}h sleep D.today. ${D.today.sleep>=7?"Good — sleep above 7h keeps cortisol low and recovery high.":"Below 7h target. Poor sleep raises cortisol and stalls fat loss. Try: no screens 30min before bed, consistent bedtime, cool room."}`;
    if (ql.includes("fiber"))
      return `${D.today.fib}g fiber today (target: 20-30g). ${D.today.fib>=20?"On track!":"Add: 200g broccoli (+5g), 1 tbsp chia seeds (+5g), or 100g lentils (+8g). Fiber aids digestion and reduces bloating."}`;
    if (ql.includes("sugar"))
      return `${D.today.sug}g sugar today (target: <20g). ${D.today.sug<=20?"Well controlled!":"Over target. Check for hidden sugars in sauces, flavored yogurt, and fruit juice. Stick to whole fruits instead."}`;
    if (ql.includes("calorie")||ql.includes("cal"))
      return `${D.today.cal} calories today (target: 1,300-1,500). ${D.today.cal>=1300&&D.today.cal<=1500?"Right on target.":D.today.cal<1300?"Slightly under — make sure you're eating enough to protect muscle. Add a protein-rich snack.":"Slightly over. Not a disaster, but watch portions at dinner."}`;
    if (ql.includes("gym")||ql.includes("train")||ql.includes("workout")||ql.includes("exercise"))
      return `${D.today.gym?"You trained today — great!":"Rest day."} Phase 1 calls for 3x strength + rope per week. Focus on compound lifts (squat, deadlift, bench, row) to preserve muscle in a deficit. Keep rest periods 60-90s.`;
    if (ql.includes("target")||ql.includes("hit")||ql.includes("score")||ql.includes("compliance"))
      return `Compliance today: ${D.today.comp}/100. ${D.today.comp>=90?"Excellent execution!":D.today.comp>=70?"Good but room to improve.":"Below 70 — focus on protein and fiber."} Your streak is ${D.insights.streak} days ≥70. Protein hit rate: ${D.insights.proteinRate}% of all days.`;
    if (ql.includes("cheat")||ql.includes("break")||ql.includes("off day"))
      return `One off day won't ruin your progress. You've lost ${D.lost}kg already. The key is consistency: your ${D.insights.streak}-day streak shows commitment. If you go over, just get back on track tomorrow. Don't compensate by under-eating.`;
    if (ql.includes("plateau")||ql.includes("stuck")||ql.includes("stall"))
      return `At -${D.insights.velocity}kg/week, you're still losing well. Plateaus usually last 1-2 weeks and break naturally. Keep hitting protein (${D.insights.proteinRate}% hit rate), stay consistent, and trust the process. If it persists 3+ weeks, consider a 2-day refeed at maintenance calories.`;
    return `Today: ${D.today.cal} cal (${D.today.cal>=1300&&D.today.cal<=1500?"on target":"needs attention"}), ${D.today.pro}g protein (${D.today.pro>=130?"good":"low"}), ${D.today.fib}g fiber (${D.today.fib>=20?"ok":"add veg"}), ${D.today.steps} steps (${D.today.steps>=8000?"hit":"need more"}). Compliance: ${D.today.comp}/100. Streak: ${D.insights.streak} days. You're doing well — keep at it.`;
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = {role:"user",content:text};
    setMessages(prev => [...prev, userMsg]);
    setChatMsg(""); setLoading(true);
    // Try API with short timeout, fall back to smart offline tips
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"}, signal: controller.signal,
        body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:contextPrompt,
          messages:[...messages,userMsg].map(m=>({role:m.role,content:m.content}))}),
      });
      clearTimeout(timeout);
      const data = await resp.json();
      const reply = data.content?.map(i=>i.text||"").join("");
      if (reply) { setMessages(prev => [...prev, {role:"assistant",content:reply}]); }
      else { setMessages(prev => [...prev, {role:"assistant",content:getOfflineTip(text)}]); }
    } catch (e) {
      clearTimeout(timeout);
      setMessages(prev => [...prev, {role:"assistant",content:getOfflineTip(text)}]);
    }
    setLoading(false);
  };

  const staticTips = [
    {title:"Fiber Gap",tip:`At ${D.today.fib}g fiber — add broccoli or chia seeds to reach 20g.`,type:"action"},
    {title:D.today.pro>=130?"Protein On Track":"Protein Low",tip:D.today.pro>=130?`${D.today.pro}g protein — solid.`:`${D.today.pro}g protein — below 130g, add a shake.`,type:D.today.pro>=130?"success":"warning"},
    {title:"Step Check",tip:`${D.today.steps.toLocaleString()} steps. ${D.today.steps>=8000?"Target hit!":"Walk 20 min to close gap."}`,type:D.today.steps>=8000?"success":"action"},
    {title:"Sugar Watch",tip:`${D.today.sug}g sugar${D.today.sug>20?" — over 20g limit.":" — controlled."}`,type:D.today.sug>20?"warning":"success"},
    {title:"Weekly Trend",tip:`Compliance at ${D.W_NUTR[5].comp}/100. ${D.W_NUTR[5].comp>=75?"Strong.":"Focus protein & fiber."}`,type:D.W_NUTR[5].comp>=75?"success":"action"},
  ];
  const quickQ = ["What should I eat for dinner?","How's my progress?","Am I hitting my targets?","Tips for better sleep"];

  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <AnimCard style={{gridColumn:isD?'1/2':isT?'1/3':'1',display:'flex',flexDirection:'column',minHeight:isM?360:440}}>
        <Lbl>Chat with Coach</Lbl>
        <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:8,marginBottom:12,paddingRight:4}}>
          {messages.length===0&&<div style={{fontSize:11,color:C.text3,lineHeight:1.5,padding:'8px 0'}}>Ask me anything about your nutrition, training, or progress. I have full context on your data.</div>}
          {messages.map((m,i)=>(
            <div key={i} style={{alignSelf:m.role==="user"?'flex-end':'flex-start',maxWidth:'85%',padding:'10px 14px',borderRadius:m.role==="user"?'14px 14px 4px 14px':'14px 14px 14px 4px',
              background:m.role==="user"?C.mintSoft:'rgba(255,255,255,0.03)',border:`1px solid ${m.role==="user"?C.mintMed:C.border}`,
              fontSize:12,lineHeight:1.5,color:m.role==="user"?C.mint:C.text2,whiteSpace:'pre-wrap'}}>{m.content}</div>
          ))}
          {loading&&<div style={{alignSelf:'flex-start',padding:'10px 14px',borderRadius:14,background:'rgba(255,255,255,0.03)',fontSize:12,color:C.text3}}>Thinking...</div>}
          <div ref={chatEnd}/>
        </div>
        {messages.length===0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
          {quickQ.map(q=>(<button key={q} onClick={()=>sendMessage(q)} style={{padding:'6px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'rgba(255,255,255,0.02)',color:C.text2,fontSize:10,fontWeight:500,cursor:'pointer',fontFamily:'var(--sans)',transition:'border-color .2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.mintMed} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{q}</button>))}</div>}
        <div style={{display:'flex',gap:8}}>
          <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(chatMsg);}}}
            placeholder="Ask your coach..." style={{flex:1,padding:'10px 14px',borderRadius:12,border:`1px solid ${C.border}`,background:'rgba(255,255,255,0.03)',color:C.text,fontSize:12,fontFamily:'var(--sans)',outline:'none'}}/>
          <button onClick={()=>sendMessage(chatMsg)} disabled={loading||!chatMsg.trim()} style={{padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',
            background:chatMsg.trim()?`linear-gradient(135deg,${C.mint},${C.cyan})`:C.border,color:C.bg,fontSize:11,fontWeight:700,fontFamily:'var(--sans)',opacity:loading?0.5:1}}>Send</button>
        </div>
      </AnimCard>
      <AnimCard delay={0.05} style={{gridColumn:isD?'2/4':isT?'1/3':'1'}}>
        <Lbl>Today's Analysis</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {staticTips.map((t,i)=>(<div key={i} style={{padding:'12px 14px',borderRadius:12,background:'rgba(255,255,255,0.02)',border:`1px solid ${C.border}`,borderLeft:`3px solid ${typeColor[t.type]||C.mint}`,
            opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-8px)',transition:`all .35s ease ${i*.06}s`}}>
            <div style={{fontSize:11,fontWeight:700,color:typeColor[t.type]||C.mint,marginBottom:3}}>{t.title}</div>
            <div style={{fontSize:11,color:C.text2,lineHeight:1.4}}>{t.tip}</div></div>))}</div>
      </AnimCard>
      <AnimCard delay={0.1}>
        <Lbl>Remaining Today</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[{l:"Calories",v:remaining.cal,u:"kcal",c:C.mint,max:200},{l:"Protein",v:remaining.pro,u:"g",c:C.mint,max:30},{l:"Fiber",v:remaining.fib,u:"g",c:C.cyan,max:17},{l:"Steps",v:remaining.steps,u:"",c:C.blue,max:2100}].map(r=>(
            <div key={r.l}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
              <span style={{color:C.text2,fontWeight:600}}>{r.l}</span>
              <span style={{fontFamily:'var(--mono)',fontWeight:700,color:r.v<=0?C.mint:C.text}}>{r.v<=0?"✓ Done":r.v.toLocaleString()+" "+r.u+" left"}</span></div>
              <div style={{height:4,borderRadius:2,background:C.border,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,100-r.v/r.max*100)}%`,borderRadius:2,background:r.v<=0?C.mint:`${r.c}88`,transition:'width .8s ease'}}/></div></div>))}</div>
      </AnimCard>
      <AnimCard delay={0.15}>
        <Lbl>Meal Suggestion</Lbl>
        <div style={{fontSize:11,color:C.text2,lineHeight:1.5}}>
          <div style={{fontWeight:700,color:C.mint,marginBottom:8}}>To hit targets tonight:</div>
          {[{n:"150g Salmon Fillet",m:"280 cal · 30g pro · 17g fat"},{n:"200g Steamed Broccoli",m:"68 cal · 6g pro · 6g fiber"},{n:"100g Lentils",m:"116 cal · 9g pro · 8g fiber"}].map(f=>(
            <div key={f.n} style={{padding:'8px 10px',borderRadius:8,background:'rgba(255,255,255,0.02)',marginBottom:4}}>
              <div style={{fontWeight:600,color:C.text,fontSize:11}}>{f.n}</div>
              <div style={{fontSize:9,color:C.text3}}>{f.m}</div></div>))}
          <div style={{marginTop:8,fontSize:9,color:C.text3}}>Adds ~464 cal, 45g protein, 14g fiber</div></div>
      </AnimCard>
    </div>);
}

// MAIN APP

// MAIN APP
export default function Stride() {
  const [tab, setTab] = useState("overview");
  const [ww, setWw] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const notifRef = useRef(null);
  const bellRef = useRef(null);
  const vis = useAnimateOnMount(tab);
  useEffect(()=>{const h=()=>setWw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  // DATA LOADER
  // CONFIGURATION — Set your Cloudflare Worker URL after deploying
  const PROXY_URL = localStorage.getItem('stride_proxy_url') || '';

  const fetchData = useCallback(async () => {
    setSyncing(true);
    let jsonData = null;
    let todayLive = null;

    // Step 1: Load historical data from sync JSON
    try {
      const base = window.location.pathname.replace(/\/$/,'');
      const url = `${base}/data/stride-data.json?t=${Date.now()}`;
      console.log('[Stride] Loading sync JSON...');
      const resp = await fetch(url);
      if (resp.ok) {
        jsonData = await resp.json();
        console.log('[Stride] JSON:', jsonData?.daily?.length || 0, 'days');
        if (jsonData?.meta?.lastSync) setLastSync(jsonData.meta.lastSync);
      }
    } catch (e) { console.log('[Stride] JSON error:', e.message); }

    // Step 2: Fetch TODAY live from proxy (fast — 1-2 requests)
    if (PROXY_URL) {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        console.log('[Stride] Proxy: fetching today...');
        const [todayResp, weightResp] = await Promise.all([
          fetch(`${PROXY_URL}/api/diary?date=${todayStr}`).catch(() => null),
          fetch(`${PROXY_URL}/api/weight`).catch(() => null),
        ]);
        if (todayResp?.ok) todayLive = await todayResp.json();
        if (weightResp?.ok) {
          const wd = await weightResp.json();
          if (wd?.entries?.length > 0) {
            todayLive = todayLive || {};
            todayLive._weightEntries = wd.entries;
          }
        }
        if (todayLive?.calories > 0) {
          setLastSync(new Date().toISOString());
          console.log('[Stride] Today live:', todayLive.calories, 'cal,', todayLive.protein, 'g pro');
        }
      } catch (e) { console.log('[Stride] Proxy error:', e.message); }
    }

    // Step 3: Transform and merge
    if (jsonData?.daily?.length > 0 && jsonData.daily.some(d => (d.calories||0) > 0)) {
      const transformed = transformSyncData(jsonData, todayLive);
      if (transformed && (transformed.DAILY_W7?.length > 0 || transformed.DAILY_ALL?.length > 0)) {
        setLiveData(transformed);
        console.log('[Stride] Data ready:', transformed.DAILY_W7?.length, 'W7 days, weight:', transformed.lastW?.kg);
      }
    }
    setSyncing(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const handleRefresh = async () => {
    setSyncing(true);
    // Try to trigger GitHub Actions sync workflow
    const pat = localStorage.getItem('stride_gh_token');
    if (pat) {
      try {
        await fetch('https://api.github.com/repos/robinchristopherheering/stride_app/actions/workflows/sync.yml/dispatches', {
          method: 'POST',
          headers: { 'Authorization': `token ${pat}`, 'Accept': 'application/vnd.github.v3+json' },
          body: JSON.stringify({ ref: 'main' }),
        });
        // Wait for workflow to start and complete (~30-60s)
        await new Promise(r => setTimeout(r, 45000));
      } catch (e) { /* token missing or invalid */ }
    }
    // Re-fetch data
    await fetchData();
    setSyncing(false);
  };

  // Data source indicator
  const isLive = !!liveData;
  const dataAge = lastSync ? Math.round((Date.now() - new Date(lastSync).getTime()) / 3600000) : null;
  const isStale = !isLive || (dataAge !== null && dataAge > 8);
  const D = useMemo(() => {
    try {
      const base = liveData || buildFallbackData();
      // Ensure critical fields exist
      if (!base.lastW) base.lastW = { kg: 80.5, week: 0, date: "Jan 5" };
      if (!base.today) base.today = base.DAILY_W7?.[base.DAILY_W7.length-1] || {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,comp:0,flat:0,steps:0,sleep:0,gym:false};
      if (!base.WEIGHTS || base.WEIGHTS.length === 0) base.WEIGHTS = [{ kg: 80.5, week: 0, date: "Jan 5" }];
      if (!base.W_NUTR) base.W_NUTR = [];
      if (!base.W_STEPS) base.W_STEPS = [];
      if (!base.DAILY_ALL) base.DAILY_ALL = [];
      if (!base.DAILY_W7) base.DAILY_W7 = [];
      if (!base.lost) base.lost = (80.5 - base.lastW.kg).toFixed(1);
      if (!base.lostPct) base.lostPct = ((80.5 - base.lastW.kg) / 80.5 * 100).toFixed(1);
      if (!base.currentWeek) base.currentWeek = 7;
      console.log('[Stride] Using', liveData ? 'LIVE' : 'FALLBACK', '| today:', base.today?.cal, 'cal | weight:', base.lastW?.kg, 'kg | W7 days:', base.DAILY_W7?.length);
      const insights = computeInsights(base);
      const popularFoods = computePopularFoods(base.FOOD_LOG || {});
      return { ...base, insights, POPULAR_FOODS: popularFoods };
    } catch (e) {
      console.error('[Stride] Data error:', e);
      const fb = buildFallbackData();
      return { ...fb, insights: { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} }, POPULAR_FOODS: [] };
    }
  }, [liveData]);

  const notifications = useMemo(() => [
    {id:"n1",title:"Fiber Gap",tip:`You're at ${D.today.fib}g fiber — add broccoli or chia seeds to reach 20g.`,type:"action",tab:"coach"},
    {id:"n2",title:D.today.pro>=130?"Protein On Track":"Protein Low",tip:D.today.pro>=130?`${D.today.pro}g protein today — great execution.`:`${D.today.pro}g protein is below 130g. Add a shake or chicken.`,type:D.today.pro>=130?"success":"warning",tab:"coach"},
    {id:"n3",title:"Step Check",tip:`${D.today.steps.toLocaleString()} steps. ${D.today.steps>=8000?"Target hit!":"A 20-min walk adds ~2,500 steps."}`,type:D.today.steps>=8000?"success":"action",tab:"activity"},
    {id:"n4",title:"Weekly Trend",tip:`Compliance at ${D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0}/100. ${(D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0)>=75?"Solid.":"Focus on protein & fiber."}`,type:(D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0)>=75?"success":"action",tab:"progress"},
    {id:"n5",title:"Weight Pace",tip:`-${D.insights.velocity}kg/wk over 3 weeks. ${parseFloat(D.insights.velocity)>=0.8?"Sustainable pace.":"Check calorie adherence."}`,type:parseFloat(D.insights.velocity)>=0.8?"success":"warning",tab:"progress"},
  ], [D]);
  const unreadCount = notifications.filter(n => !notifRead[n.id]).length;

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const typeColor = {warning:C.orange,success:C.mint,action:C.blue};

  const NotifPanel = () => (
    <div ref={notifRef} style={{position:'absolute',top:'100%',right:0,marginTop:8,width:320,maxHeight:420,overflowY:'auto',
      background:C.surfaceSolid,border:`1px solid ${C.border}`,borderRadius:16,boxShadow:'0 12px 48px rgba(0,0,0,.6)',zIndex:200,
      animation:'fadeSlideDown .2s ease'}}>
      <div style={{padding:'14px 16px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,fontWeight:700,color:C.text}}>Notifications</span>
        {unreadCount>0&&<button onClick={(e)=>{e.stopPropagation();setNotifRead(Object.fromEntries(notifications.map(n=>[n.id,true])));}} style={{fontSize:10,fontWeight:600,color:C.text3,background:'none',border:'none',cursor:'pointer',padding:'4px 8px',borderRadius:6,transition:'color .2s'}}
          onMouseEnter={e=>e.currentTarget.style.color=C.mint} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>Mark all read</button>}
      </div>
      <div style={{padding:'6px 8px'}}>
        {notifications.map(n => {
          const isRead = !!notifRead[n.id];
          return (
            <button key={n.id} onClick={(e) => { e.stopPropagation(); setNotifRead(p=>({...p,[n.id]:true})); setNotifOpen(false); setTab(n.tab||"coach"); }}
              style={{display:'flex',alignItems:'flex-start',gap:10,width:'100%',padding:'10px 10px',borderRadius:10,border:'none',cursor:'pointer',
                background:isRead?'transparent':'rgba(255,255,255,0.02)',textAlign:'left',fontFamily:'var(--sans)',transition:'background .15s',marginBottom:2}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
              onMouseLeave={e=>e.currentTarget.style.background=isRead?'transparent':'rgba(255,255,255,0.02)'}>
              <div style={{width:7,height:7,borderRadius:'50%',background:isRead?'transparent':typeColor[n.type]||C.mint,flexShrink:0,marginTop:5,transition:'background .2s',
                boxShadow:isRead?'none':`0 0 6px ${(typeColor[n.type]||C.mint)}44`}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:isRead?500:700,color:isRead?C.text3:C.text}}>{n.title}</div>
                <div style={{fontSize:10,color:C.text3,marginTop:2,lineHeight:1.4,opacity:isRead?0.6:1}}>{n.tip}</div>
              </div>
              <div style={{color:C.text3,flexShrink:0,marginTop:2,opacity:0.5}}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          );
        })}
      </div>
      <div style={{padding:'8px 16px 12px',borderTop:`1px solid ${C.border}`}}>
        <button onClick={(e)=>{e.stopPropagation();setNotifOpen(false);setTab("coach");}} style={{width:'100%',padding:'8px',borderRadius:8,border:'none',cursor:'pointer',
          background:C.mintSoft,color:C.mint,fontSize:10,fontWeight:700,fontFamily:'var(--sans)',transition:'opacity .2s'}}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
          Open AI Coach →</button>
      </div>
    </div>
  );

  const isM=ww<768, isT=ww>=768&&ww<1024, isD=ww>=1024;
  const NAV=[{id:"overview",icon:I.grid,label:"Overview"},{id:"nutrition",icon:I.fork,label:"Nutrition"},{id:"activity",icon:I.pulse,label:"Activity"},{id:"progress",icon:I.trend,label:"Progress"},{id:"targets",icon:I.target,label:"Targets"},{id:"coach",icon:I.sparkle,label:"AI Coach"}];
  const renderTab = () => {
    const p = {vis,isD,isT,isM,D};
    switch(tab) {
      case "overview": return <OverviewTab {...p}/>;
      case "nutrition": return <NutritionTab {...p}/>;
      case "activity": return <ActivityTab {...p}/>;
      case "progress": return <ProgressTab {...p}/>;
      case "targets": return <TargetsTab {...p}/>;
      case "coach": return <CoachTab {...p}/>;
      default: return null;
    }
  };
  const navW = navCollapsed ? 64 : 240;
  return (
    <div style={{minHeight:'100vh',background:C.bg,color:C.text,fontFamily:'var(--sans)',display:isD?'flex':'block'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root{--sans:'Plus Jakarta Sans',-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-10%',left:'20%',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${C.mintSoft} 0%,transparent 70%)`,filter:'blur(30px)'}}/>
        <div style={{position:'absolute',bottom:'-15%',right:'5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(77,160,255,.03) 0%,transparent 70%)',filter:'blur(30px)'}}/></div>

      {isD && (
        <nav style={{width:navW,minHeight:'100vh',background:C.surfaceSolid,borderRight:`1px solid ${C.border}`,padding:navCollapsed?'28px 8px':'28px 16px',display:'flex',flexDirection:'column',position:'sticky',top:0,zIndex:10,transition:'width .3s ease, padding .3s ease',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:navCollapsed?20:36,padding:navCollapsed?'0':'0 8px',justifyContent:navCollapsed?'center':'flex-start'}}>
            <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#B8FF57,#57FFD8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:900,color:C.bg,boxShadow:`0 4px 16px ${C.mint}33`,flexShrink:0}}>S</div>
            {!navCollapsed&&<div><div style={{fontSize:17,fontWeight:800,letterSpacing:-.3}}>Stride</div><div style={{fontSize:10,color:C.text3,fontWeight:600}}>Week {D.currentWeek} · Phase 1</div></div>}
          </div>
          {!navCollapsed&&<div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1.5,padding:'0 14px',marginBottom:8}}>Navigation</div>}
          {NAV.map(n=>{const act=tab===n.id;
            return (<button key={n.id} onClick={()=>setTab(n.id)} title={navCollapsed?n.label:""} style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:navCollapsed?'12px 0':'12px 14px',justifyContent:navCollapsed?'center':'flex-start',borderRadius:14,border:'none',background:act?C.mintSoft:'transparent',color:act?C.mint:C.text2,fontSize:13,fontWeight:act?700:500,cursor:'pointer',transition:'all .2s',marginBottom:2,fontFamily:'var(--sans)',textAlign:'left'}}>
              {n.icon}{!navCollapsed&&<span>{n.label}</span>}
              {act&&!navCollapsed&&<div style={{marginLeft:'auto',width:6,height:6,borderRadius:3,background:C.mint,boxShadow:`0 0 8px ${C.mint}55`}}/>}
            </button>);
          })}
          <button onClick={()=>setNavCollapsed(!navCollapsed)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:'10px 0',border:'none',background:'transparent',color:C.text3,cursor:'pointer',marginTop:12,borderRadius:10,transition:'color .2s'}}
            onMouseEnter={e=>e.currentTarget.style.color=C.text2} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>
            {navCollapsed?I.expand:I.collapse}
          </button>
          {!navCollapsed&&<div style={{marginTop:'auto',padding:'18px 16px',borderRadius:18,background:`linear-gradient(135deg,${C.mintSoft},transparent)`,border:`1px solid ${C.mintSoft}`}}>
            <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Overall Progress</div>
            <div style={{fontSize:24,fontWeight:900,fontFamily:'var(--mono)',color:C.mint}}>-{D.lost}kg</div>
            <div style={{fontSize:11,color:C.text2,marginTop:2}}>of 12.5 kg goal</div>
            <div style={{height:4,borderRadius:2,background:C.border,marginTop:10,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${(parseFloat(D.lost)/12.5*100).toFixed(0)}%`,borderRadius:2,background:`linear-gradient(90deg,${C.mint}BB,${C.mint})`,transition:'width 1s ease'}}/></div>
          </div>}
        </nav>
      )}

      <div style={{flex:1,position:'relative',zIndex:1,minHeight:'100vh'}}>
        {!isD && (
          <header style={{padding:'14px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:12,background:'linear-gradient(135deg,#B8FF57,#57FFD8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:C.bg,boxShadow:`0 4px 16px ${C.mint}33`}}>S</div>
              <div><div style={{fontSize:10,color:C.text3,fontWeight:600}}>Week {D.currentWeek} · Phase 1</div><div style={{fontSize:16,fontWeight:800,letterSpacing:-.3}}>Stride</div></div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <button onClick={handleRefresh} title="Refresh" style={{width:32,height:32,borderRadius:10,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:syncing?C.mint:C.text3,cursor:'pointer'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:syncing?'spin 1s linear infinite':'none'}}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></button>
              <div style={{position:'relative'}}>
                <button ref={bellRef} onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative',cursor:'pointer'}}>
                  {I.bell}{unreadCount>0&&<div style={{position:'absolute',top:5,right:5,minWidth:14,height:14,borderRadius:7,background:C.red,border:`2px solid ${C.bg}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',padding:'0 3px'}}>{unreadCount}</div>}
                </button>
                {notifOpen&&<NotifPanel/>}
              </div>
            </div>
          </header>
        )}
        {isD && (
          <header style={{padding:'24px 36px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:22,fontWeight:800}}>
                {tab==="overview"?"Dashboard":tab==="nutrition"?"Nutrition Tracking":tab==="activity"?"Activity & Training":tab==="progress"?"Progress Analytics":tab==="coach"?"AI Coach":"Phase Targets"}</div>
              <div style={{fontSize:12,color:C.text3,marginTop:2}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                {isLive?<span style={{marginLeft:8,fontSize:10,color:C.mint,opacity:0.8}}>· Live data{dataAge!==null?` (${dataAge}h ago)`:''}</span>
                :<span style={{marginLeft:8,fontSize:10,color:C.orange,opacity:0.9}}>· Demo data — sync needed</span>}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{padding:'8px 14px',borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,fontSize:12,fontWeight:600,color:C.text2}}>Phase 1 — Fat Loss</div>
              <button onClick={handleRefresh} title="Refresh stats" style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:syncing?C.mint:C.text2,cursor:'pointer',transition:'color .2s'}}
                onMouseEnter={e=>{if(!syncing)e.currentTarget.style.color=C.mint;}} onMouseLeave={e=>{if(!syncing)e.currentTarget.style.color=C.text2;}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:syncing?'spin 1s linear infinite':'none'}}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              </button>
              <div style={{position:'relative'}}>
                <button ref={bellRef} onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:12,background:C.card,border:`1px solid ${C.cardBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative',cursor:'pointer'}}>
                  {I.bell}{unreadCount>0&&<div style={{position:'absolute',top:5,right:5,minWidth:14,height:14,borderRadius:7,background:C.red,border:`2px solid ${C.bg}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',padding:'0 3px'}}>{unreadCount}</div>}
                </button>
                {notifOpen&&<NotifPanel/>}
              </div>
            </div>
          </header>
        )}
        <div style={{padding:isD?'20px 36px 36px':isM?'14px 16px 100px':'20px 22px 100px'}}>
          {renderTab()}
        </div>
      </div>

      {!isD && (
        <nav style={{position:'fixed',bottom:0,left:0,right:0,background:`linear-gradient(180deg,${C.bg}00 0%,${C.bg}EE 20%,${C.bg} 100%)`,backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',borderTop:`1px solid ${C.border}`,padding:'6px 4px',paddingBottom:'max(6px, env(safe-area-inset-bottom))',zIndex:100,display:'flex',justifyContent:'space-around'}}>
          {NAV.map(n=>{const act=tab===n.id;
            return (<button key={n.id} onClick={()=>setTab(n.id)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 6px',border:'none',background:'none',cursor:'pointer',color:act?C.mint:C.text3,transition:'color .2s',position:'relative',fontFamily:'var(--sans)'}}>
              {act&&<div style={{position:'absolute',top:-6,width:20,height:3,borderRadius:2,background:C.mint,boxShadow:`0 0 10px ${C.mint}55`}}/>}
              <div style={{transform:act?'scale(1.1)':'scale(1)',transition:'transform .2s'}}>{n.icon}</div>
              <span style={{fontSize:8,fontWeight:act?800:500,letterSpacing:.2}}>{n.label}</span>
            </button>);
          })}
        </nav>
      )}
    </div>
  );
}
