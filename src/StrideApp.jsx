import { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } from "react";

// STRIDE v6.1 — Updated Feb 22 2026
// Theme system: light (default) and dark mode with glassmorphism
const THEMES = {
  light: {
    mode: 'light',
    bg: "#E0E1EF", bgAlt: "#D8D9E8",
    surface: "rgba(245,245,255,0.68)", surfaceSolid: "#F2F2FA",
    card: "rgba(248,248,255,0.60)", cardHover: "rgba(252,252,255,0.72)",
    cardBorder: "rgba(255,255,255,0.55)", cardBorderHover: "rgba(120,100,200,0.18)",
    // PRIMARY — lavender-purple (the dominant accent, replaces old mint)
    mint: "#7C6BC4", mintDark: "#6A58B0",
    mintSoft: "rgba(124,107,196,0.10)", mintMed: "rgba(124,107,196,0.18)", mintHard: "rgba(124,107,196,0.30)",
    // SECONDARY accents
    red: "#C43838", redSoft: "rgba(196,56,56,0.08)",
    blue: "#4868C0", blueSoft: "rgba(72,104,192,0.08)",
    orange: "#C47898", orangeSoft: "rgba(196,120,152,0.08)",
    cyan: "#4CA8B0", cyanSoft: "rgba(76,168,176,0.08)",
    purple: "#9060D0", purpleSoft: "rgba(144,96,208,0.08)",
    green: "#3C9456", greenSoft: "rgba(60,148,86,0.08)",
    // Text — cool slate
    text: "#2A2C42", text2: "#585E78", text3: "#9098B4",
    border: "rgba(180,185,225,0.22)",
    // Track — solid silver-lavender
    track: "#C4C6D8",
    subtle: "rgba(160,165,210,0.09)", subtleBorder: "rgba(160,165,210,0.14)",
    // Glassmorphism
    glass: "rgba(248,248,255,0.60)", glassBorder: "rgba(255,255,255,0.55)", glassBlur: 32,
    // Brand gradients — lavender pearl
    gradStart: "#9B8CE0", gradEnd: "#7CC4D8",
    // Nav
    navBg: "rgba(248,248,255,0.68)", navBorder: "rgba(180,185,225,0.18)",
    // Modal
    modalBg: "rgba(248,248,255,0.96)", overlayBg: "rgba(25,25,50,0.12)",
    // Scrollbar
    scrollThumb: "rgba(150,155,195,0.24)",
    chartLine: "#C0C4DA",
    // Ambient bg
    bgGradient: "linear-gradient(145deg, #E0E1EF 0%, #D8D2EC 14%, #DCDEED 28%, #E2DAED 42%, #D8DCEE 56%, #DFD8EC 70%, #DBDFEF 85%, #E0E1EF 100%)",
    bgAccent1: "rgba(124,107,196,0.05)", bgAccent2: "rgba(100,160,200,0.04)", bgAccent3: "rgba(150,110,220,0.055)",
  },
  dark: {
    mode: 'dark',
    bg: "#0A0C18", bgAlt: "#0E1020",
    surface: "rgba(16,18,36,0.72)", surfaceSolid: "#12142A",
    card: "rgba(20,22,42,0.55)", cardHover: "rgba(28,30,52,0.65)",
    cardBorder: "rgba(255,255,255,0.06)", cardBorderHover: "rgba(155,140,224,0.18)",
    // PRIMARY — luminous lavender
    mint: "#B8A8F0", mintDark: "#9B8CE0",
    mintSoft: "rgba(184,168,240,0.10)", mintMed: "rgba(184,168,240,0.20)", mintHard: "rgba(184,168,240,0.35)",
    // SECONDARY accents
    red: "#FF6078", redSoft: "rgba(255,96,120,0.10)",
    blue: "#7CA0FF", blueSoft: "rgba(124,160,255,0.10)",
    orange: "#F0A0C0", orangeSoft: "rgba(240,160,192,0.10)",
    cyan: "#6CD8E0", cyanSoft: "rgba(108,216,224,0.10)",
    purple: "#C898FF", purpleSoft: "rgba(200,152,255,0.10)",
    green: "#6CE088", greenSoft: "rgba(108,224,136,0.10)",
    // Text
    text: "#ECEEF8", text2: "#8B92B0", text3: "#505878",
    border: "rgba(255,255,255,0.06)",
    // Track
    track: "rgba(255,255,255,0.05)",
    subtle: "rgba(255,255,255,0.03)", subtleBorder: "rgba(255,255,255,0.05)",
    // Glassmorphism
    glass: "rgba(16,18,36,0.50)", glassBorder: "rgba(255,255,255,0.08)", glassBlur: 24,
    // Brand gradients — luminous lavender pearl
    gradStart: "#B8A8F0", gradEnd: "#6CD8E0",
    // Nav
    navBg: "rgba(16,18,36,0.65)", navBorder: "rgba(255,255,255,0.06)",
    modalBg: "rgba(16,18,36,0.90)", overlayBg: "rgba(0,0,0,0.7)",
    scrollThumb: "rgba(255,255,255,0.05)",
    chartLine: "#252840",
    bgGradient: "linear-gradient(145deg, #0A0C18 0%, #0E0E22 25%, #0A0D1C 50%, #100E24 75%, #0A0C18 100%)",
    bgAccent1: "rgba(184,168,240,0.03)", bgAccent2: "rgba(108,216,224,0.025)", bgAccent3: "rgba(155,140,224,0.035)",
  }
};
const ThemeContext = createContext(null);
function useTheme() { return useContext(ThemeContext); }

// Backward compat: C is now a mutable ref populated by the active theme at render
let C = THEMES.light;

// Local date helper (avoids UTC timezone issues)
const localDateStr = (d) => { d = d || new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

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

// FOOD LOG — populated from real MFP data via proxy, with fallback sample data
const FALLBACK_FOOD_LOG = {
  "2026-02-23": {
    breakfast: [
      {name:"Greek Yogurt (0% Fat)",amount:"200g",cal:118,pro:20,carb:7,fat:0},
      {name:"Chia Seeds",amount:"15g",cal:73,pro:2,carb:1,fat:5},
      {name:"Blueberries",amount:"80g",cal:46,pro:1,carb:10,fat:0},
    ],
    lunch: [
      {name:"Chicken Breast (Grilled)",amount:"200g",cal:330,pro:62,carb:0,fat:7},
      {name:"Steamed Broccoli",amount:"200g",cal:68,pro:6,carb:12,fat:1},
      {name:"Brown Rice",amount:"80g cooked",cal:90,pro:2,carb:19,fat:1},
    ],
    snack: [
      {name:"Protein Shake (Whey Isolate)",amount:"1 scoop + water",cal:120,pro:25,carb:2,fat:1},
      {name:"Apple",amount:"1 medium",cal:95,pro:0,carb:25,fat:0},
    ],
    dinner: [
      {name:"Salmon Fillet",amount:"150g",cal:280,pro:30,carb:0,fat:17},
      {name:"Mixed Green Salad",amount:"150g",cal:22,pro:2,carb:4,fat:0},
      {name:"Olive Oil Dressing",amount:"1 tbsp",cal:40,pro:0,carb:0,fat:4},
    ],
  },
  "2026-02-22": {
    breakfast: [
      {name:"Eggs (Scrambled)",amount:"3 large",cal:234,pro:18,carb:2,fat:16},
      {name:"Spinach",amount:"100g",cal:23,pro:3,carb:4,fat:0},
    ],
    lunch: [
      {name:"Turkey Mince",amount:"200g",cal:280,pro:44,carb:0,fat:10},
      {name:"Lentils (Cooked)",amount:"120g",cal:139,pro:11,carb:24,fat:0},
      {name:"Steamed Broccoli",amount:"150g",cal:51,pro:4,carb:9,fat:1},
    ],
    snack: [
      {name:"Protein Shake (Whey Isolate)",amount:"1 scoop + water",cal:120,pro:25,carb:2,fat:1},
    ],
    dinner: [
      {name:"Chicken Breast (Grilled)",amount:"180g",cal:297,pro:56,carb:0,fat:6},
      {name:"Sweet Potato",amount:"150g",cal:135,pro:2,carb:31,fat:0},
      {name:"Mixed Vegetables",amount:"120g",cal:40,pro:2,carb:8,fat:0},
    ],
  },
  "2026-02-21": {
    breakfast: [
      {name:"Greek Yogurt (0% Fat)",amount:"200g",cal:118,pro:20,carb:7,fat:0},
      {name:"Walnuts",amount:"15g",cal:98,pro:2,carb:1,fat:10},
    ],
    lunch: [
      {name:"Tuna (Canned in Water)",amount:"150g",cal:165,pro:36,carb:0,fat:1},
      {name:"Mixed Green Salad",amount:"150g",cal:22,pro:2,carb:4,fat:0},
      {name:"Olive Oil Dressing",amount:"1 tbsp",cal:40,pro:0,carb:0,fat:4},
      {name:"Whole Grain Bread",amount:"1 slice",cal:80,pro:3,carb:14,fat:1},
    ],
    snack: [
      {name:"Apple",amount:"1 medium",cal:95,pro:0,carb:25,fat:0},
      {name:"Protein Shake (Whey Isolate)",amount:"1 scoop + water",cal:120,pro:25,carb:2,fat:1},
    ],
    dinner: [
      {name:"Cod Fillet (Baked)",amount:"200g",cal:186,pro:40,carb:0,fat:2},
      {name:"Steamed Broccoli",amount:"200g",cal:68,pro:6,carb:12,fat:1},
      {name:"Quinoa",amount:"80g cooked",cal:96,pro:4,carb:17,fat:2},
    ],
  },
  "2026-02-20": {
    breakfast: [
      {name:"Eggs (Scrambled)",amount:"3 large",cal:234,pro:18,carb:2,fat:16},
      {name:"Spinach",amount:"80g",cal:18,pro:2,carb:3,fat:0},
    ],
    lunch: [
      {name:"Chicken Breast (Grilled)",amount:"200g",cal:330,pro:62,carb:0,fat:7},
      {name:"Brown Rice",amount:"80g cooked",cal:90,pro:2,carb:19,fat:1},
      {name:"Steamed Broccoli",amount:"150g",cal:51,pro:4,carb:9,fat:1},
    ],
    snack: [
      {name:"Protein Shake (Whey Isolate)",amount:"1 scoop + water",cal:120,pro:25,carb:2,fat:1},
      {name:"Chia Seeds",amount:"15g",cal:73,pro:2,carb:1,fat:5},
    ],
    dinner: [
      {name:"Salmon Fillet",amount:"130g",cal:242,pro:26,carb:0,fat:15},
      {name:"Mixed Green Salad",amount:"120g",cal:18,pro:1,carb:3,fat:0},
      {name:"Lentils (Cooked)",amount:"100g",cal:116,pro:9,carb:20,fat:0},
    ],
  },
  "2026-02-19": {
    breakfast: [
      {name:"Greek Yogurt (0% Fat)",amount:"200g",cal:118,pro:20,carb:7,fat:0},
      {name:"Blueberries",amount:"100g",cal:57,pro:1,carb:12,fat:0},
    ],
    lunch: [
      {name:"Turkey Mince",amount:"180g",cal:252,pro:40,carb:0,fat:9},
      {name:"Sweet Potato",amount:"150g",cal:135,pro:2,carb:31,fat:0},
      {name:"Steamed Broccoli",amount:"150g",cal:51,pro:4,carb:9,fat:1},
    ],
    snack: [
      {name:"Protein Shake (Whey Isolate)",amount:"1 scoop + water",cal:120,pro:25,carb:2,fat:1},
    ],
    dinner: [
      {name:"Chicken Breast (Grilled)",amount:"160g",cal:264,pro:50,carb:0,fat:6},
      {name:"Mixed Vegetables",amount:"150g",cal:50,pro:3,carb:10,fat:0},
      {name:"Olive Oil Dressing",amount:"1 tbsp",cal:40,pro:0,carb:0,fat:4},
    ],
  },
};
// Ensure today's date has food data (copy most recent fallback entry if needed)
{
  const todayKey = new Date().toISOString().split('T')[0];
  if (!FALLBACK_FOOD_LOG[todayKey]) {
    const dates = Object.keys(FALLBACK_FOOD_LOG).sort().reverse();
    if (dates.length > 0) FALLBACK_FOOD_LOG[todayKey] = FALLBACK_FOOD_LOG[dates[0]];
  }
  // Also fill yesterday if missing
  const y = new Date(); y.setDate(y.getDate()-1);
  const yKey = y.toISOString().split('T')[0];
  if (!FALLBACK_FOOD_LOG[yKey]) {
    const dates = Object.keys(FALLBACK_FOOD_LOG).sort().reverse();
    if (dates.length > 1) FALLBACK_FOOD_LOG[yKey] = FALLBACK_FOOD_LOG[dates[1]];
  }
}

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
    AVGS: averages, FOOD_LOG: {},
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
  const currentWeek = Math.max(json.meta?.currentWeek || 1, Math.floor((new Date() - new Date(json.meta?.programStart || "2026-01-05")) / (7*86400000)) + 1);

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
  let wSteps = (json.weekly || []).filter(w => w.steps).map(w => ({ w: w.week, v: w.steps }));
  // If no weekly steps from proxy, compute from daily data
  if (wSteps.length === 0 && dailyAll.length > 0) {
    const byWeek = {};
    dailyAll.forEach(d => {
      const w = d.w || 1;
      if (!byWeek[w]) byWeek[w] = {total:0,count:0};
      byWeek[w].total += (d.steps||0);
      byWeek[w].count++;
    });
    wSteps = Object.entries(byWeek).map(([w,v]) => ({w:parseInt(w), v:Math.round(v.total/v.count)})).sort((a,b)=>a.w-b.w);
  }

  // Averages — compute from actual daily data for consistency across app
  const computedAvgs = (() => {
    const days = dailyAll.filter(d => d.cal > 0);
    const n = Math.max(1, days.length);
    return {
      cal: Math.round(days.reduce((a,d) => a+d.cal, 0)/n),
      pro: Math.round(days.reduce((a,d) => a+d.pro, 0)/n),
      carb: Math.round(days.reduce((a,d) => a+d.carb, 0)/n),
      fat: Math.round(days.reduce((a,d) => a+d.fat, 0)/n),
      fib: Math.round(days.reduce((a,d) => a+d.fib, 0)/n),
      sug: Math.round(days.reduce((a,d) => a+d.sug, 0)/n),
    };
  })();

  // Merge live proxy data for today (always add today's entry)
  {
    const todayStr = localDateStr();
    const todayFmt = fmt(todayStr);
    const todayDow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
    const hasCals = todayLive && todayLive.calories > 0;
    const liveDay = {
      w: currentWeek, d: todayDow, dt: todayFmt, day: todayDow,
      cal: hasCals ? todayLive.calories : 0, pro: hasCals ? (todayLive.protein||0) : 0,
      carb: hasCals ? (todayLive.carbs||0) : 0, fat: hasCals ? (todayLive.fat||0) : 0,
      fib: hasCals ? (todayLive.fiber||0) : 0, sug: hasCals ? (todayLive.sugar||0) : 0,
      steps: todayLive?.steps||0, comp: 0, flat: 0, gym: false, sleep: 0, wt: null,
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
  let finalWeights = useWeights;
  if (todayLive?._weightEntries?.length > 0) {
    const proxyW = todayLive._weightEntries.map(we => ({
      week: Math.max(1, Math.floor((new Date(we.date+"T00:00:00") - new Date("2026-01-05T00:00:00")) / (7*86400000)) + 1),
      kg: we.weight, date: fmt(we.date),
    }));
    finalWeights = [{ week: 0, kg: json.meta?.startWeight || 80.5, date: fmt("2026-01-05") }, ...proxyW];
  }

  // Build FOOD_LOG from today's live proxy meals data
  const foodLog = {};
  if (todayLive?.meals) {
    const todayStr = localDateStr();
    const meals = todayLive.meals;
    const hasFoods = ['breakfast','lunch','dinner','snack'].some(k => meals[k]?.length > 0);
    if (hasFoods) foodLog[todayStr] = meals; // Live proxy data for today
  }

  // Derived
  const lastWeight = finalWeights[finalWeights.length - 1] || { kg: 80.5, week: 0 };
  const startKg = json.meta?.startWeight || 80.5;
  const totalLost = (startKg - lastWeight.kg).toFixed(1);
  const lostPct = ((startKg - lastWeight.kg) / startKg * 100).toFixed(1);
  const todayData = dailyW7[dailyW7.length - 1] || dailyAll[dailyAll.length - 1] || FALLBACK_DAILY_W7[FALLBACK_DAILY_W7.length-1];

  return {
    WEIGHTS: finalWeights, W_STEPS: wSteps.length > 0 ? wSteps : [{w:currentWeek,v:0}], W_NUTR: wNutr,
    DAILY_ALL: dailyAll, DAILY_W7: dailyW7,
    AVGS: computedAvgs, FOOD_LOG: foodLog,
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
    startKg: 80.5, currentWeek: Math.floor((new Date() - new Date("2026-01-05")) / (7*86400000)) + 1,
  };
}

// Compute popular foods from food log, optionally filtered by date range
// foodLog is keyed by ISO date string "2026-02-19" → {breakfast:[], lunch:[], ...}
function computePopularFoods(foodLog, fromDate, toDate) {
  const entries = Object.entries(foodLog || {});
  const filtered = (fromDate && toDate
    ? entries.filter(([date]) => date >= fromDate && date <= toDate)
    : entries
  ).filter(([, m]) => m != null);
  const allFoods = filtered.flatMap(([, m]) => [...(m.breakfast||[]),...(m.lunch||[]),...(m.snack||[]),...(m.dinner||[])]);
  const freq = {};
  allFoods.forEach(f => {
    const key = f.name.toLowerCase().trim();
    if (!freq[key]) freq[key] = {name:f.name,count:0,totalCal:0,totalPro:0,totalCarb:0,totalFat:0};
    freq[key].count++; freq[key].totalCal+=f.cal||0; freq[key].totalPro+=f.pro||0; freq[key].totalCarb+=f.carb||0; freq[key].totalFat+=f.fat||0;
  });
  return Object.values(freq).sort((a,b)=>b.count-a.count).slice(0,10).map(f=>({
    ...f, avgCal:Math.round(f.totalCal/f.count), avgPro:Math.round(f.totalPro/f.count),
    avgCarb:Math.round(f.totalCarb/f.count), avgFat:Math.round(f.totalFat/f.count),
    cal:Math.round(f.totalCal/f.count), pro:Math.round(f.totalPro/f.count),
  }));
}

// Compute insights from data
function computeInsights(data, dateNav) {
  if (!data || !data.DAILY_ALL || !data.DAILY_W7 || !data.WEIGHTS) {
    return { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} };
  }
  // Build combined days list with dates for filtering
  let allDays = [...data.DAILY_ALL, ...data.DAILY_W7.map(d=>({...d,w:data.currentWeek||7}))];
  // Deduplicate by dt (formatted date)
  const seen = new Set(); allDays = allDays.filter(d => { if(seen.has(d.dt)) return false; seen.add(d.dt); return true; });
  if (allDays.length === 0) return { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} };
  // If dateNav is a range, filter allDays to that range
  let filteredDays = allDays;
  if (dateNav && dateNav.mode === 'range' && dateNav.from && dateNav.to) {
    const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const from = new Date(dateNav.from+'T00:00:00');
    const to = new Date(dateNav.to+'T23:59:59');
    filteredDays = allDays.filter(d => {
      // Parse dt like "Feb 23" back to a rough date for filtering
      const parts = d.dt.split(' ');
      if (parts.length < 2) return true;
      const mi = m.indexOf(parts[0]);
      const day = parseInt(parts[1]);
      if (mi < 0 || isNaN(day)) return true;
      const approx = new Date(2026, mi, day);
      return approx >= from && approx <= to;
    });
  }
  if (filteredDays.length === 0) filteredDays = allDays;
  const reversed = [...allDays].reverse(); let streak=0;
  for (const d of reversed) { if ((d.comp||0)>=70) streak++; else break; }
  const recentW = data.WEIGHTS.slice(-3);
  const velocity = recentW.length>1 ? Math.abs((recentW[0].kg-recentW[recentW.length-1].kg)/(recentW.length-1)).toFixed(1) : "0.8";
  const proteinRate = Math.round(filteredDays.filter(d=>(d.pro||0)>=130).length/filteredDays.length*100);
  const dayTotals = {};
  filteredDays.forEach(d => { const day=d.day||d.d; if(!dayTotals[day]) dayTotals[day]={s:0,c:0}; dayTotals[day].s+=(d.steps||0); dayTotals[day].c++; });
  const mostActive = Object.entries(dayTotals).map(([day,v])=>({day,avg:Math.round(v.s/v.c)})).sort((a,b)=>b.avg-a.avg)[0] || {day:"Sun",avg:0};
  // Find single highest steps day
  const bestDay = [...filteredDays].sort((a,b)=>(b.steps||0)-(a.steps||0))[0];
  const bestStepsDay = bestDay ? {day:bestDay.d||bestDay.day||"?", steps:bestDay.steps||0} : {day:"?",steps:0};
  return { streak, velocity, proteinRate, mostActive, bestStepsDay };
}

// GYM & SLEEP TRACKING (localStorage)
const HIST_GYM_SLEEP={"2026-01-05":{"gym":true,"sleep":5,"steps":1281},"2026-01-06":{"gym":false,"sleep":6,"steps":4306},"2026-01-07":{"gym":true,"sleep":5.5,"steps":2882},"2026-01-08":{"gym":false,"sleep":6,"steps":5796},"2026-01-09":{"gym":false,"sleep":6,"steps":2435},"2026-01-10":{"gym":false,"sleep":6,"steps":3475},"2026-01-11":{"gym":false,"sleep":6,"steps":5922},"2026-01-12":{"gym":true,"sleep":6,"steps":2501},"2026-01-13":{"gym":false,"sleep":6,"steps":6154},"2026-01-14":{"gym":true,"sleep":6,"steps":4945},"2026-01-15":{"gym":false,"sleep":5.5,"steps":7141},"2026-01-16":{"gym":true,"sleep":6,"steps":3366},"2026-01-17":{"gym":false,"sleep":8,"steps":4476},"2026-01-18":{"gym":false,"sleep":6,"steps":10247},"2026-01-19":{"gym":true,"sleep":5.5,"steps":7217},"2026-01-20":{"gym":false,"sleep":6,"steps":1706},"2026-01-21":{"gym":true,"sleep":6,"steps":5024},"2026-01-22":{"gym":false,"sleep":6,"steps":8437},"2026-01-23":{"gym":true,"sleep":6,"steps":4192},"2026-01-24":{"gym":false,"sleep":7,"steps":12544},"2026-01-25":{"gym":false,"sleep":6,"steps":8365},"2026-01-26":{"gym":true,"sleep":6,"steps":2319},"2026-01-27":{"gym":false,"sleep":6,"steps":4724},"2026-01-28":{"gym":true,"sleep":6,"steps":2612},"2026-01-29":{"gym":false,"sleep":6,"steps":6413},"2026-01-30":{"gym":true,"sleep":6,"steps":6999},"2026-01-31":{"gym":false,"sleep":6,"steps":3934},"2026-02-01":{"gym":false,"sleep":6.5,"steps":9836},"2026-02-02":{"gym":true,"sleep":6,"steps":2616},"2026-02-03":{"gym":false,"sleep":5.5,"steps":8986},"2026-02-04":{"gym":true,"sleep":4.25,"steps":6518},"2026-02-05":{"gym":false,"sleep":5.5,"steps":5651},"2026-02-06":{"gym":true,"sleep":5.5,"steps":4039},"2026-02-07":{"gym":false,"sleep":7,"steps":8882},"2026-02-08":{"gym":false,"sleep":6.5,"steps":12307},"2026-02-09":{"gym":true,"sleep":7,"steps":8017},"2026-02-10":{"gym":false,"sleep":7,"steps":7432},"2026-02-11":{"gym":true,"sleep":4,"steps":9885},"2026-02-12":{"gym":false,"sleep":6,"steps":7442},"2026-02-13":{"gym":true,"sleep":7,"steps":9879},"2026-02-14":{"gym":false,"sleep":7,"steps":6845},"2026-02-15":{"gym":false,"sleep":7,"steps":9033},"2026-02-16":{"gym":true,"sleep":7,"steps":5988},"2026-02-17":{"gym":false,"sleep":7,"steps":470},"2026-02-18":{"gym":true,"sleep":6.5,"steps":2153},"2026-02-19":{"gym":false,"sleep":6.5,"steps":5899},"2026-02-20":{"gym":true,"sleep":6.5,"steps":2275},"2026-02-21":{"gym":false,"sleep":7,"steps":1483}};

function useGymSleep() {
  const KEY = 'stride_gym_sleep';
  const load = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '{}');
      // Seed historical data if not already present
      const seeded = localStorage.getItem('stride_gs_seeded');
      if (!seeded) {
        const merged = {...HIST_GYM_SLEEP, ...stored};
        localStorage.setItem(KEY, JSON.stringify(merged));
        localStorage.setItem('stride_gs_seeded', '1');
        return merged;
      }
      return stored;
    } catch(e) { return {}; }
  };
  const [data, setData] = useState(load);
  const save = (d) => { setData(d); localStorage.setItem(KEY, JSON.stringify(d)); };
  const getDay = (dateStr) => data[dateStr] || { gym: false, sleep: 0, steps: 0 };
  const setGym = (dateStr, val) => { const d = {...data}; d[dateStr] = {...(d[dateStr]||{gym:false,sleep:0,steps:0}), gym: val}; save(d); };
  const setSleep = (dateStr, val) => { const d = {...data}; d[dateStr] = {...(d[dateStr]||{gym:false,sleep:0,steps:0}), sleep: parseFloat(val)||0}; save(d); };
  const setSteps = (dateStr, val) => { const d = {...data}; d[dateStr] = {...(d[dateStr]||{gym:false,sleep:0,steps:0}), steps: parseInt(val)||0}; save(d); };
  return { getDay, setGym, setSleep, setSteps, data };
}

function GymSleepEditor({ days, gymSleep, currentWeek }) {
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmt = (d) => { const dt = new Date(d+"T00:00:00"); return `${m[dt.getMonth()]} ${dt.getDate()}`; };
  const [editDate, setEditDate] = useState(null);
  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const weekDates = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    if (d <= today) weekDates.push(localDateStr(d));
  }
  const editData = editDate ? (()=>{const g=gymSleep.getDay(editDate);return {...g,gym:!!g.gym};})() : null;
  const editDow = editDate ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(editDate+"T00:00:00").getDay()] : null;

  return (<>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${weekDates.length},1fr)`,gap:6}}>
      {weekDates.map(dateStr => {
        const dayData = gymSleep.getDay(dateStr);
        const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(dateStr+"T00:00:00").getDay()];
        const isToday = dateStr === localDateStr(today);
        const isEditing = dateStr === editDate;
        return (
          <div key={dateStr} onClick={()=>setEditDate(dateStr)} style={{padding:'10px 6px',borderRadius:12,
            background:isEditing?C.mintSoft:isToday?C.mintSoft:C.subtle,
            border:`1px solid ${isEditing?C.mint:isToday?C.mintMed:'rgba(255,255,255,0.04)'}`,
            textAlign:'center',cursor:'pointer',transition:'all .2s'}}>
            <div style={{fontSize:11,fontWeight:700,color:isEditing||isToday?C.mint:C.text2,marginBottom:4}}>{dow}</div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:'var(--mono)',color:dayData.steps>0?(dayData.steps>=8000?C.mint:C.orange):C.text3,marginBottom:2}}>
              {dayData.steps>0?dayData.steps.toLocaleString():'–'}</div>
            <div style={{fontSize:8,color:C.text3,marginBottom:6}}>steps</div>
            <div style={{display:'flex',justifyContent:'center',gap:8,fontSize:10}}>
              <span style={{color:C.text3}}>Sleep</span>
              <span style={{fontWeight:700,fontFamily:'var(--mono)',color:dayData.sleep>0?C.text:C.text3}}>{dayData.sleep||'–'}h</span>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:4}}>
              <span style={{fontSize:9,color:C.text3}}>Gym</span>
              <span style={{color:dayData.gym?C.mint:C.text3,fontSize:12}}>{dayData.gym?'✓':'✕'}</span>
            </div>
          </div>
        );
      })}
    </div>
    {/* Modal */}
    {editDate && editData && <>
      <div onClick={()=>setEditDate(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',zIndex:9999}}/>
      <div style={{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:10000,width:'100%',maxWidth:360,padding:'0 20px',animation:'fadeSlideDown .2s ease'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:C.modalBg,border:`1px solid ${C.glassBorder}`,borderRadius:20,padding:0,overflow:'hidden',boxShadow:C.mode==='light'?'0 24px 64px rgba(120,108,180,0.15)':'0 24px 64px rgba(0,0,0,0.8)',backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`}}>
          {/* Header */}
          <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:18,fontWeight:800,color:C.text}}>{editDow}</div>
              <div style={{fontSize:12,color:C.text3,marginTop:2}}>{fmt(editDate)}</div>
            </div>
            <button onClick={()=>setEditDate(null)} style={{width:32,height:32,borderRadius:10,border:`1px solid ${C.border}`,background:C.subtle,color:C.text3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✕</button>
          </div>
          {/* Body */}
          <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:20}}>
            {/* Gym */}
            <div>
              <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Gym</div>
              <div style={{display:'flex',gap:10}}>
                {[{l:'Yes ✓',v:true},{l:'No ✕',v:false}].map(o=>(
                  <button key={String(o.v)} onClick={()=>gymSleep.setGym(editDate,o.v)}
                    style={{flex:1,padding:'16px',borderRadius:14,
                      border:`2px solid ${editData?.gym===o.v?C.mint:C.border}`,
                      background:editData?.gym===o.v?(o.v?C.mintSoft:`rgba(200,100,100,0.08)`):'transparent',
                      color:editData?.gym===o.v?(o.v?C.mint:C.red):C.text3,
                      fontSize:16,fontWeight:800,cursor:'pointer',transition:'all .15s',
                      boxShadow:editData?.gym===o.v?`0 0 0 1px ${o.v?C.mint:C.red}33, inset 0 0 12px ${o.v?C.mint:C.red}08`:'none',
                      WebkitAppearance:'none',fontFamily:'var(--sans)'}}>{o.l}</button>))}
              </div>
            </div>
            {/* Sleep */}
            <div>
              <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Sleep (hours)</div>
              <input type="number" inputMode="decimal" min="0" max="12" step="0.5" value={editData?.sleep||''} placeholder="e.g. 7.5"
                onChange={e=>gymSleep.setSleep(editDate,e.target.value)}
                style={{width:'100%',padding:'14px 16px',borderRadius:12,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:18,fontFamily:'var(--mono)',textAlign:'center',outline:'none',boxSizing:'border-box'}}/>
            </div>
            {/* Steps */}
            <div>
              <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Steps</div>
              <input type="number" inputMode="numeric" min="0" max="99999" step="100" value={editData?.steps||''} placeholder="e.g. 8500"
                onChange={e=>gymSleep.setSteps(editDate,e.target.value)}
                style={{width:'100%',padding:'14px 16px',borderRadius:12,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:18,fontFamily:'var(--mono)',textAlign:'center',outline:'none',boxSizing:'border-box'}}/>
            </div>
            {/* Done button */}
            <button onClick={()=>setEditDate(null)} style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:C.mint,color:C.bg,fontSize:15,fontWeight:800,cursor:'pointer',marginTop:4}}>Done</button>
          </div>
        </div>
      </div>
    </>}
  </>);
}

// PHASE TARGETS
const PHASE_TARGETS = {
  1: {name:"Fat Loss",cal:1400,pro:145,carb:55,fat:48,sugar:20,fiber:25,steps:8000,fasting:"16:8",training:"3× strength"},
  2: {name:"Leaning Out",cal:1700,pro:140,carb:105,fat:55,sugar:30,fiber:30,steps:10000,fasting:"Optional",training:"3-4× strength"},
  3: {name:"Definition",cal:1575,pro:150,carb:80,fat:48,sugar:25,fiber:30,steps:10000,fasting:"Optional",training:"4× strength"},
  4: {name:"Maintenance",cal:2050,pro:140,carb:185,fat:65,sugar:40,fiber:35,steps:9000,fasting:"Optional",training:"4-5× strength"},
};

function useSettings() {
  const KEY = 'stride_settings';
  const defaults = {phase:1,goalWeight:68,goalBF:15,startWeight:80.5,startDate:"2026-01-05",
    totalWeeks:14,
    phaseWeeks:{1:{from:1,to:6},2:{from:7,to:9},3:{from:10,to:12},4:{from:13,to:14}},
    phaseHistory:[{phase:1,activatedOn:"2026-01-05"}]};
  const load = () => { try { return {...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}; } catch(e) { return defaults; } };
  const [settings, setSettings] = useState(load);
  const save = (s) => { const merged={...settings,...s}; setSettings(merged); localStorage.setItem(KEY,JSON.stringify(merged)); };
  const targets = PHASE_TARGETS[settings.phase] || PHASE_TARGETS[1];
  return { ...settings, targets, save };
}

// INFO TOOLTIP CONTENT
const INFO_CONTENT = {
  compliance: {
    title: "Compliance Score",
    sections: [
      {heading:"What is it?",text:"A percentage (0–100%) measuring your adherence to the core pillars of your current phase. It ensures you're hitting the essential numbers for fat loss and muscle preservation."},
      {heading:"How it's calculated",text:"Average of your progress toward three daily targets: Calories, Protein, and Fiber. Each capped at 100% so over-eating one can't mask a deficiency in another."},
      {heading:"90–100%: On Target",text:"Perfect execution. You're fueling correctly and protecting muscle mass while in a deficit."},
      {heading:"Below 70%: Warning",text:"You're likely missing protein or fiber targets significantly, increasing risk of muscle loss and hunger."},
    ]
  },
  flatStomach: {
    title: "Flat Stomach Score",
    sections: [
      {heading:"What is it?",text:"A specialized metric focused on reducing abdominal bloating. While Compliance is about weight, this score is about look and digestive efficiency."},
      {heading:"How it's calculated",text:"Similar to Compliance but with a stricter fiber emphasis (35g vs 30g) — the clinical sweet spot for gut transit and bloating reduction."},
      {heading:"90–100%: On Target",text:"You're achieving the high-fiber threshold needed to clear the digestive tract and reduce gut inflammation or water retention in the midsection."},
      {heading:"Below 70%: Warning",text:"Likely under 20g of fiber. This often leads to increased abdominal pressure (bloating) and slower digestion, hiding your fat-loss progress visually."},
    ]
  },
  protein: {title:"Protein Target",sections:[
    {heading:"Why it matters",text:"Protein is the absolute priority during a cut. It preserves muscle mass, keeps you satiated, and has the highest thermic effect of any macronutrient — your body burns ~30% of protein calories just digesting it."},
    {heading:"Target",text:"Aim for 130–160g daily depending on your phase. Hitting this consistently is non-negotiable for body recomposition."},
    {heading:"What happens if low",text:"Under 100g daily accelerates muscle loss in a deficit. Your body starts breaking down muscle tissue for amino acids. This lowers your metabolic rate and makes future fat loss harder."},
  ]},
  steps: {title:"Daily Steps",sections:[
    {heading:"Why steps matter",text:"Non-exercise activity (NEAT) is the single biggest variable in daily calorie burn. Walking 8,000–10,000 steps/day is non-negotiable for belly fat reduction."},
    {heading:"Impact",text:"Each 2,000 extra steps burns roughly 100 additional calories. Over a week, that's nearly an extra day of deficit — without any gym time."},
    {heading:"Why not cardio instead?",text:"Intense cardio raises cortisol, which promotes abdominal fat storage. Walking keeps cortisol low while still burning significant calories. It's the most underrated fat-loss tool."},
  ]},
  calories: {title:"Calorie Target",sections:[
    {heading:"Why this range?",text:"The 1,300–1,500 kcal range in Phase 1 creates a significant deficit (~500-700 below maintenance) while keeping enough fuel to preserve muscle and sustain training."},
    {heading:"Floor: 1,200",text:"Going below 1,200 occasionally is OK, but not daily. Chronic under-eating triggers metabolic adaptation — your body lowers its metabolic rate, making fat loss stall."},
    {heading:"Over target",text:"Going to 1,600-1,700 isn't a disaster. The weekly average matters more than any single day. But consistently over 1,800 will slow or stop fat loss in Phase 1."},
  ]},
  fiber: {title:"Fiber Intake",sections:[
    {heading:"Why fiber matters",text:"Fiber is critical for gut health, satiety, and reducing bloating. It slows digestion, keeps blood sugar stable, and physically fills your stomach so you feel full."},
    {heading:"Target: 20–30g",text:"Below 15g and you'll likely experience constipation and bloating. Above 30g is great for the Flat Stomach Score (which targets 35g for optimal gut transit)."},
    {heading:"Best sources",text:"Broccoli (5g/200g), lentils (8g/100g), chia seeds (5g/tbsp), spinach (4g/200g), berries (3g/100g). These are all low-calorie, high-fiber staples."},
  ]},
  sugar: {title:"Sugar Watch",sections:[
    {heading:"Why limit sugar?",text:"Sugar spikes insulin, which promotes fat storage — especially around the midsection. In a deficit, keeping sugar low ensures your body stays in fat-burning mode."},
    {heading:"Target: under 20g",text:"Natural sugars from vegetables and small amounts of dairy are fine. Watch for hidden sugars in sauces, flavored yogurt, protein bars, and fruit juice."},
    {heading:"Impact on cravings",text:"High sugar intake triggers a crash-craving cycle. Keeping sugar controlled reduces hunger and makes the deficit feel easier."},
  ]},
  sleep: {title:"Sleep Quality",sections:[
    {heading:"Why sleep matters for fat loss",text:"Sleep under 7 hours raises cortisol (stress hormone) and ghrelin (hunger hormone) while lowering leptin (satiety). This triple hit makes fat loss significantly harder."},
    {heading:"Target: 7+ hours",text:"Studies show people in a caloric deficit who sleep 5.5h vs 8.5h lose 55% less fat — even eating the same calories. Sleep is a fat-loss multiplier."},
    {heading:"Tips",text:"No screens 30 min before bed. Keep the room cool (18-19°C). Consistent bedtime. Avoid caffeine after 2 PM. Magnesium before bed can help."},
  ]},
  weightPace: {title:"Weight Loss Pace",sections:[
    {heading:"What is this?",text:"Your average weekly weight loss rate, calculated from the last 3 weeks of weigh-ins. A trailing average smooths out daily fluctuations from water, salt, and digestion."},
    {heading:"Ideal pace",text:"0.5–1.0 kg/week is optimal for fat loss while preserving muscle. Faster than 1.0 kg/week may indicate muscle loss. Slower than 0.5 may mean the deficit isn't consistent enough."},
    {heading:"Stalls are normal",text:"Weight can plateau for 1-2 weeks due to water retention, especially after increasing training or salt intake. The trend over 3+ weeks is what matters."},
  ]},
  weeklyTrend: {title:"Weekly Trend",sections:[
    {heading:"What is this?",text:"Your latest week's Compliance Score average. It shows whether your daily adherence is translating into consistent weekly performance."},
    {heading:"Above 75%",text:"Strong execution. You're hitting your targets most days. Keep this up and fat loss is essentially guaranteed at the projected pace."},
    {heading:"Below 75%",text:"Check which pillar is dragging the score down — usually protein or fiber. One focused improvement (e.g. adding a protein shake daily) can lift the score 10-15 points."},
  ]},
  fiberGap: {title:"Fiber Gap",sections:[
    {heading:"What is this?",text:"Shows how far you are from your daily fiber target. The gap highlights how much more fiber-rich food you need to add."},
    {heading:"Why it's a quick win",text:"Fiber is the easiest macro to fix. Add 200g broccoli (+5g), 1 tbsp chia seeds (+5g), or 100g lentils (+8g) — all low-calorie, high-fiber options."},
    {heading:"Impact",text:"Closing the fiber gap improves both your Compliance Score and Flat Stomach Score simultaneously."},
  ]},
  stepCheck: {title:"Step Check",sections:[
    {heading:"What is this?",text:"Tracks your daily step count against the 8,000-step target. Steps are the easiest way to increase your calorie deficit without triggering stress hormones."},
    {heading:"Quick fixes",text:"A brisk 20-min walk adds ~2,500 steps. Walk after meals for better digestion and blood sugar control. Take calls while walking."},
  ]},
  sugarWatch: {title:"Sugar Watch",sections:[
    {heading:"What is this?",text:"Monitors your daily sugar intake against the 20g limit. Sugar spikes insulin and promotes abdominal fat storage."},
    {heading:"Common culprits",text:"Flavored yogurt (15g), protein bars (8-12g), sauces and dressings (5-10g per serving), fruit juice (25g per glass). Read labels carefully."},
  ]},
};

function InfoModal({id, onClose}) {
  const info = INFO_CONTENT[id];
  if (!info) return null;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:C.overlayBg,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.modalBg,border:`1px solid ${C.glassBorder}`,borderRadius:16,maxWidth:420,width:'100%',maxHeight:'80vh',overflow:'auto',padding:24,
        backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
        boxShadow:C.mode==='light'?'0 8px 32px rgba(0,0,0,0.12)':'0 8px 32px rgba(0,0,0,0.5)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span style={{fontSize:16,fontWeight:700,color:C.mint}}>{info.title}</span>
          <span onClick={onClose} style={{cursor:'pointer',fontSize:20,color:C.text3,padding:'4px 8px'}}>✕</span>
        </div>
        {info.sections.map((s,i) => (
          <div key={i} style={{marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:4}}>{s.heading}</div>
            <div style={{fontSize:12,color:C.text2,lineHeight:1.6}}>{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncToast({message, show}) {
  if (!show) return null;
  const isErr = message?.includes('error') || message?.includes('fail');
  return (
    <div style={{position:'fixed',top:20,left:'50%',transform:'translateX(-50%)',zIndex:9999,
      padding:'10px 20px',borderRadius:10,fontSize:13,fontWeight:600,
      background:isErr?'rgba(255,60,60,0.9)':'rgba(40,200,80,0.9)',color:'#fff',
      boxShadow:'0 4px 20px rgba(0,0,0,0.3)',animation:'fadeIn .3s',fontFamily:'var(--mono)'}}>
      {message}
    </div>
  );
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
  const isLight = C.mode === 'light';
  const baseShadow = isLight
    ? '0 2px 8px rgba(120,108,180,0.06), 0 8px 28px rgba(120,108,180,0.04), inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(120,108,180,0.03)'
    : '0 2px 8px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(184,168,240,0.04)';
  const hoverShadow = isLight
    ? '0 4px 14px rgba(120,108,180,0.09), 0 16px 44px rgba(120,108,180,0.06), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(120,108,180,0.04)'
    : '0 4px 16px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.28), inset 0 1px 0 rgba(184,168,240,0.06)';
  return (
    <div ref={ref} style={{background:C.glass,borderRadius:20,padding:22,border:`1px solid ${C.glassBorder}`,
      backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,position:'relative',overflow:'hidden',
      boxShadow:baseShadow,
      transition:`border-color .3s, box-shadow .3s, opacity .55s cubic-bezier(.4,0,.2,1) ${delay}s, transform .55s cubic-bezier(.4,0,.2,1) ${delay}s`,
      opacity:inView?1:0, transform:inView?'translateY(0)':'translateY(16px)', ...style}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cardBorderHover;e.currentTarget.style.boxShadow=hoverShadow;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.glassBorder;e.currentTarget.style.boxShadow=baseShadow;}}>
      {glow&&<div style={{position:'absolute',top:-50,right:-50,width:140,height:140,borderRadius:'50%',background:C.mintSoft,filter:'blur(60px)',pointerEvents:'none'}}/>}
      {children}
    </div>
  );
}

// TOOLTIP COMPONENT
function InfoTip({ text, modalId, onModal }) {
  const [show, setShow] = useState(false);
  const handleClick = () => {
    if (modalId && onModal) { onModal(modalId); }
    else { setShow(!show); }
  };
  return (
    <span style={{position:'relative',display:'inline-flex',marginLeft:6,cursor:'pointer'}}
      onClick={handleClick}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      {show && !modalId && <div style={{position:'absolute',bottom:'calc(100% + 8px)',left:'50%',transform:'translateX(-50%)',
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
    <rect x={tx-bw/2} y={ty} width={bw} height={bh} rx={3} fill={C.surfaceSolid} fillOpacity="0.9" stroke="rgba(184,168,240,0.08)" strokeWidth="0.3"/>
    <text x={tx} y={ty+5} textAnchor="middle" style={{fontSize:4.5,fill:C.mint,fontFamily:'var(--mono)',fontWeight:600}}>{d.kg}kg</text>
    <text x={tx} y={ty+9.5} textAnchor="middle" style={{fontSize:3,fill:C.text3,fontFamily:'var(--mono)'}}>W{d.week} · {d.date}</text>
  </>);
}

// INTERACTIVE WEIGHT CHART (subtle version)
function WeightChart({ data, w=300, h=100, visible=true }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const mn=Math.min(...data.map(d=>d.kg))-1, mx=Math.max(...data.map(d=>d.kg))+1, rng=mx-mn||1;
  const padT=10, padB=6, ch=h-padT-padB;
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
      
      <path d={fillPath} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>
      <path d={linePath} fill="none" stroke={C.mint} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.6}
        style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
      {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={hover?.idx===i?2:1}
        fill={hover?.idx===i?C.mint:'rgba(184,168,240,0.2)'}
        stroke={hover?.idx===i?'rgba(255,255,255,0.3)':'none'} strokeWidth={0.5}
        style={{transition:'r .12s, fill .12s'}}>
        {i===pts.length-1&&!hover&&<animate attributeName="r" values="1;1.5;1" dur="2.5s" repeatCount="indefinite"/>}
      </circle>)}
      {hover&&<HoverTip x={hover.x} y={hover.y} w={w} h={h} padT={padT} padB={padB} d={data[hover.idx]}/>}
    </svg>
  );
}

function Spark({data,color=C.mint,w=200,h=50,fill=true,sw=2,visible=true,labels}) {
  const [hov, setHov] = useState(null);
  const svgRef = useRef(null);
  const mn=Math.min(...data),mx=Math.max(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>[data.length>1?(i/(data.length-1))*w:w/2, h-((v-mn)/rng)*h*.82-h*.09]);
  const d=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const fd=`${d} L${w},${h} L0,${h} Z`;
  const gid=useMemo(()=>`s${Math.random().toString(36).slice(2,7)}`,[]);
  const totalLen=useMemo(()=>{let l=0;for(let i=1;i<pts.length;i++){const dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1];l+=Math.sqrt(dx*dx+dy*dy);}return l;},[pts]);
  const getClosest = useCallback((clientX) => {
    const svg=svgRef.current; if(!svg)return null;
    const rect=svg.getBoundingClientRect();
    const svgX=((clientX-rect.left)/rect.width)*w;
    let closest=0,minDist=Infinity;
    pts.forEach((p,i)=>{const dist=Math.abs(p[0]-svgX);if(dist<minDist){minDist=dist;closest=i;}});
    return closest;
  }, [pts, w]);
  const handleMove = useCallback((clientX) => { const idx=getClosest(clientX); if(idx!==null) setHov(idx); }, [getClosest]);
  return (<svg ref={svgRef} width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none"
    style={{display:'block',overflow:'visible',cursor:'crosshair',touchAction:'none'}}
    onMouseMove={e=>handleMove(e.clientX)} onMouseLeave={()=>setHov(null)}
    onTouchStart={e=>handleMove(e.touches[0].clientX)}
    onTouchMove={e=>{e.preventDefault();handleMove(e.touches[0].clientX);}}
    onTouchEnd={()=>setTimeout(()=>setHov(null),1500)}>
    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".15"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {fill&&<path d={fd} fill={`url(#${gid})`} style={{opacity:visible?1:0,transition:'opacity .8s ease .6s'}}/>}
    <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.7}
      style={{strokeDasharray:totalLen,strokeDashoffset:visible?0:totalLen,transition:`stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)`}}/>
    {pts.map((p,i)=><circle key={i} cx={p[0]} cy={p[1]} r={hov===i?3:i===pts.length-1?2.5:0} fill={color}
      fillOpacity={hov===i?1:0.6} stroke={hov===i?'rgba(255,255,255,0.4)':'none'} strokeWidth={0.5}
      style={{transition:'r .12s'}}>
      {i===pts.length-1&&hov===null&&<animate attributeName="r" values="2;3;2" dur="2.5s" repeatCount="indefinite"/>}
    </circle>)}
    {hov!==null&&<g>
      <rect x={Math.max(2,Math.min(pts[hov][0]-24,w-50))} y={Math.max(0,pts[hov][1]-22)}
        width={48} height={18} rx={5} fill={C.surfaceSolid||'#1a1a2e'} stroke={`${color}44`} strokeWidth={0.5}/>
      <text x={Math.max(2,Math.min(pts[hov][0]-24,w-50))+24} y={Math.max(0,pts[hov][1]-22)+12.5}
        textAnchor="middle" fill={color} fontSize={9} fontWeight={700} fontFamily="var(--mono)">
        {labels?labels[hov]:data[hov]>=1000?data[hov].toLocaleString():data[hov]}
      </text>
    </g>}
  </svg>);
}

function Ring({val,max=100,sz=80,sw=6,color=C.mint,visible=true,children}) {
  const pct=Math.min(val/max,1),r=(sz-sw)/2,circ=2*Math.PI*r,dash=pct*circ;
  const gid=`rg${sz}${color.replace('#','')}`;
  const isLight = C.mode === 'light';
  return (<div style={{position:'relative',width:sz,height:sz}}>
    <svg width={sz} height={sz}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={isLight?C.track:color} stopOpacity={isLight?"0.6":"0.4"}/>
          <stop offset="40%" stopColor={color} stopOpacity="0.75"/>
          <stop offset="85%" stopColor={color} stopOpacity="1"/>
          <stop offset="100%" stopColor={isLight?'#8CD0E0':'#E0DDFF'} stopOpacity={isLight?"0.9":"0.8"}/>
        </linearGradient>
      </defs>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={isLight?C.track:(C.track||C.border)} strokeWidth={sw}/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={sw}
        strokeDasharray={visible?`${dash} ${circ-dash}`:`0 ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1) .15s',filter:isLight?`drop-shadow(0 0 8px ${color}55)`:`drop-shadow(0 0 6px ${color}44)`}}/>
    </svg>
    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>{children}</div>
  </div>);
}

function Arc({val,max,sz=120,sw=8,color=C.mint,label,unit="",visible=true}) {
  const pct=Math.min(val/max,1),r=(sz-sw*2)/2,circ=Math.PI*r,dash=pct*circ;
  const display=val>=1000?`${(val/1000).toFixed(1)}k`:Math.round(val);
  const gid=`ag${sz}${color.replace('#','')}`;
  const isLight = C.mode === 'light';
  const trkId=`at${sz}`;
  return (<div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
    <div style={{position:'relative',width:sz,height:sz*.55}}>
      <svg width={sz} height={sz*.55} viewBox={`0 0 ${sz} ${sz*.58}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isLight?C.track:color} stopOpacity={isLight?"0.5":"0.50"}/>
            <stop offset="40%" stopColor={color} stopOpacity="0.75"/>
            <stop offset="85%" stopColor={color} stopOpacity="1"/>
            <stop offset="100%" stopColor={isLight?'#8CD0E0':'#E0DDFF'} stopOpacity={isLight?"0.9":"0.8"}/>
          </linearGradient>
          {isLight && <linearGradient id={trkId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#AEB2D0" stopOpacity="0.4"/><stop offset="50%" stopColor="#BEC2DC" stopOpacity="0.3"/><stop offset="100%" stopColor="#B5B8D4" stopOpacity="0.4"/>
          </linearGradient>}
        </defs>
        <path d={`M ${sw} ${sz/2} A ${r} ${r} 0 0 1 ${sz-sw} ${sz/2}`} fill="none" stroke={isLight?C.track:(C.track||"rgba(255,255,255,0.04)")} strokeWidth={sw} strokeLinecap="round"/>
        <path d={`M ${sw} ${sz/2} A ${r} ${r} 0 0 1 ${sz-sw} ${sz/2}`} fill="none" stroke={`url(#${gid})`} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={visible?`${dash} ${circ}`:`0 ${circ}`}
          style={{transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1) .2s',filter:`drop-shadow(0 0 8px ${color}44)`}}/></svg>
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
          background:isOn?`linear-gradient(180deg,${color},${color}77)`:isHov?`${color}33`:(C.track||C.border),
          boxShadow:isOn?`0 0 10px ${color}33`:'none',
          transition:`height .7s cubic-bezier(.4,0,.2,1) ${i*.06}s, background .2s`,
          transform:isHov&&!act?'scaleY(1.04)':'scaleY(1)', transformOrigin:'bottom'}}/>
        <span style={{fontSize:9,color:isOn?color:isHov?C.text2:C.text3,fontWeight:isOn?700:600,transition:'color .2s'}}>{d.label}</span>
      </div>);})}
  </div>);
}

function Donut({segs,sz=100,sw=10,visible=true}) {
  const r=(sz-sw)/2,circ=2*Math.PI*r,tot=segs.reduce((a,s)=>a+s.v,0); let off=0;
  const isLight = C.mode === 'light';
  const trackColor = isLight ? 'rgba(0,0,0,0.06)' : (C.track||C.border);
  return (<svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
    <defs>
      {isLight && <linearGradient id="donutTrack" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#B5B8D4" stopOpacity="0.50"/><stop offset="50%" stopColor="#BEC2DC" stopOpacity="0.38"/><stop offset="100%" stopColor="#AEB2D0" stopOpacity="0.50"/>
      </linearGradient>}
    </defs>
    <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={isLight?C.track:trackColor} strokeWidth={sw}/>
    {tot > 0 && segs.map((s,i)=>{const d=(s.v/tot)*circ,g=circ-d,o=off;off+=d;
      return <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={s.c}
        strokeWidth={sw} strokeDasharray={visible?`${d} ${g}`:`0 ${circ}`}
        strokeDashoffset={-o} strokeLinecap="round" transform={`rotate(-90 ${sz/2} ${sz/2})`}
        style={{transition:`stroke-dasharray .9s cubic-bezier(.4,0,.2,1) ${i*.12}s`,filter:`drop-shadow(0 0 4px ${s.c}33)`}}/>;})}</svg>);
}

function Progress({val,min,max,color=C.mint,label,unit="g",visible=true}) {
  const pct=Math.min((val/max)*100,120), ok=val>=min&&val<=max, clr=ok?color:val>max?C.red:C.orange;
  const gradClr = ok ? `linear-gradient(90deg,${clr}88,${clr})` : `linear-gradient(90deg,${color}66,${clr})`;
  return (<div style={{marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
      <span style={{fontSize:12,fontWeight:600,color:C.text2}}>{label}</span>
      <div style={{display:'flex',alignItems:'baseline',gap:4}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)',color:C.text}}>{val}</span>
        <span style={{fontSize:10,color:C.text3}}>{unit} / {min}–{max}</span></div></div>
    <div style={{height:6,borderRadius:3,background:C.mode==='light'?C.track:(C.track||'rgba(255,255,255,0.03)'),overflow:'hidden'}}>
      <div style={{height:'100%',width:visible?`${Math.min(pct,100)}%`:'0%',borderRadius:3,
        background:gradClr,boxShadow:`0 0 8px ${clr}33`,
        transition:'width 1s cubic-bezier(.4,0,.2,1) .1s'}}/></div>
  </div>);
}

function Tag({children,color=C.mint,bg}){return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:8,background:bg||(color+'16'),color,fontSize:11,fontWeight:700,letterSpacing:.2}}>{children}</span>;}
function Lbl({children,tip,modalId,onModal}){return <div style={{fontSize:10,color:C.text3,fontWeight:700,letterSpacing:1.2,textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center'}}>{children}{(tip||modalId)&&<InfoTip text={tip} modalId={modalId} onModal={onModal}/>}</div>;}

function DateNav({D, value, onChange}) {
  const [showPicker, setShowPicker] = useState(false);
  const [viewMonth, setViewMonth] = useState(()=>{const d=new Date();return{y:d.getFullYear(),m:d.getMonth()};});
  // Draft selection: what user is building before confirming
  const [draft, setDraft] = useState(null); // null | {mode:'day',date} | {mode:'range',from,to} | {mode:'range-partial',from}
  const MIN = '2026-01-05';
  const TODAY = localDateStr();
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MNF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DN = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  const fmt = (ds) => {if(!ds)return'';const d=new Date(ds+'T12:00:00');return`${d.getDate()} ${MN[d.getMonth()]}`;};
  const fmtFull = (ds) => {if(!ds)return'Today';const d=new Date(ds+'T12:00:00');return`${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}, ${d.getDate()} ${MN[d.getMonth()]}`;};
  const nav = (dir) => {if(value.mode!=='day')return;const c=new Date(value.date+'T12:00:00');c.setDate(c.getDate()+dir);const n=localDateStr(c);if(n>=MIN&&n<=TODAY)onChange({...value,date:n});};
  const isToday = value.date===TODAY;
  const isRange = value.mode==='range';
  const rangeDays = isRange?Math.round((new Date(value.to+'T12:00:00')-new Date(value.from+'T12:00:00'))/86400000)+1:0;
  // Calendar grid
  const calDays = useMemo(()=>{
    const first=new Date(viewMonth.y,viewMonth.m,1);
    const startDow=(first.getDay()+6)%7;
    const dim=new Date(viewMonth.y,viewMonth.m+1,0).getDate();
    const cells=[];
    for(let i=0;i<startDow;i++)cells.push(null);
    for(let d=1;d<=dim;d++)cells.push(d);
    return cells;
  },[viewMonth]);
  const ds = (day) => day?`${viewMonth.y}-${String(viewMonth.m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`:null;
  const isDis = (day) => {if(!day)return true;const s=ds(day);return s<MIN||s>TODAY;};

  // Hover state for range preview
  const [hoverDate, setHoverDate] = useState(null);

  // Determine visual state of each day based on draft (not committed value)
  const dayState = (day) => {
    if(!day)return'empty';
    const s=ds(day);
    if(isDis(day))return'disabled';
    const ref = draft || value; // Use draft if exists, else current value
    const isT = s===TODAY;
    if(ref.mode==='day'){
      if(ref.date===s)return isT?'selected-today':'selected';
      if(isT)return'today';
    }
    if(ref.mode==='range'){
      if(s===ref.from&&s===ref.to)return'selected';
      if(s===ref.from)return'range-start';
      if(s===ref.to)return'range-end';
      if(s>ref.from&&s<ref.to)return'range-mid';
      if(isT)return'today';
    }
    if(ref.mode==='range-partial'){
      if(s===ref.from)return'range-start';
      // Show hover preview
      if(hoverDate&&!isDis(day)){
        const lo=s<ref.from?s:ref.from, hi=s>ref.from?s:ref.from;
        const hLo=hoverDate<ref.from?hoverDate:ref.from, hHi=hoverDate>ref.from?hoverDate:ref.from;
        if(s===hoverDate&&s!==ref.from)return'range-end-preview';
        if(s>hLo&&s<hHi&&s!==ref.from)return'range-mid-preview';
      }
      if(isT)return'today';
    }
    if(isT)return'today';
    return'normal';
  };

  const handleDay = (day) => {
    if(!day||isDis(day))return;
    const d=ds(day);
    if(!draft){
      // First tap: single day selection
      setDraft({mode:'day',date:d});
    } else if(draft.mode==='day'){
      // Second tap on a different day: start building a range
      if(d===draft.date){
        // Tap same day again — no-op, already selected
        return;
      }
      const from=d<draft.date?d:draft.date, to=d>draft.date?d:draft.date;
      setDraft({mode:'range',from,to});
    } else if(draft.mode==='range-partial'){
      // Complete the range
      const from=d<draft.from?d:draft.from, to=d>draft.from?d:draft.from;
      setDraft({mode:'range',from,to});
    } else if(draft.mode==='range'){
      // Already have a complete range — restart with new single date
      setDraft({mode:'day',date:d});
    }
  };

  const canConfirm = draft && (draft.mode==='day' || draft.mode==='range');
  const draftChanged = draft && (
    (draft.mode==='day' && (value.mode!=='day' || value.date!==draft.date)) ||
    (draft.mode==='range' && (value.mode!=='range' || value.from!==draft.from || value.to!==draft.to))
  );

  const handleConfirm = () => {
    if(!canConfirm)return;
    if(draft.mode==='day')onChange({mode:'day',date:draft.date});
    else onChange({mode:'range',from:draft.from,to:draft.to});
    setDraft(null);setShowPicker(false);setHoverDate(null);
  };
  const handleCancel = () => {
    setDraft(null);setShowPicker(false);setHoverDate(null);
  };

  const prevM=()=>setViewMonth(p=>p.m===0?{y:p.y-1,m:11}:{y:p.y,m:p.m-1});
  const nextM=()=>{const n=viewMonth.m===11?{y:viewMonth.y+1,m:0}:{y:viewMonth.y,m:viewMonth.m+1};if(n.y<=2026)setViewMonth(n);};
  const canPrev=!(viewMonth.y===2026&&viewMonth.m===0);
  const canNext=!(viewMonth.y===new Date().getFullYear()&&viewMonth.m===new Date().getMonth());
  const openPicker=()=>{
    setShowPicker(true);
    // Initialize draft from current value so user sees current selection
    setDraft(value.mode==='range'?{mode:'range',from:value.from,to:value.to}:{mode:'day',date:value.date||TODAY});
    setHoverDate(null);
    const d=value.mode==='day'?value.date:(value.from||TODAY);
    const dt=new Date(d+'T12:00:00');
    setViewMonth({y:dt.getFullYear(),m:dt.getMonth()});
  };
  const presets = [
    {l:'Today',v:{mode:'day',date:TODAY}},
    {l:'Yesterday',v:(()=>{const y=new Date();y.setDate(y.getDate()-1);return{mode:'day',date:localDateStr(y)};})()},
    {l:'This Week',v:(()=>{const t=new Date();const dow=t.getDay()||7;const m=new Date(t);m.setDate(t.getDate()-dow+1);return{mode:'range',from:localDateStr(m),to:TODAY};})()},
    {l:'Last Week',v:(()=>{const t=new Date();const dow=t.getDay()||7;const m=new Date(t);m.setDate(t.getDate()-dow-6);const s=new Date(m);s.setDate(m.getDate()+6);return{mode:'range',from:localDateStr(m),to:localDateStr(s)};})()},
    {l:'This Month',v:(()=>{const t=new Date();return{mode:'range',from:`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-01`,to:TODAY};})()},
    {l:'All Time',v:{mode:'range',from:MIN,to:TODAY}},
  ];
  // Styles
  const dayStyle = (state) => {
    const isLt = C.mode==='light';
    const base={textAlign:'center',padding:'8px 0',fontSize:12,cursor:'pointer',userSelect:'none',transition:'all .1s',borderRadius:8,color:C.text};
    switch(state){
      case'empty':return{...base,cursor:'default'};
      case'disabled':return{...base,color:isLt?'rgba(0,0,0,0.12)':'rgba(255,255,255,0.08)',cursor:'default'};
      case'selected':case'selected-today':return{...base,background:C.mint,color:isLt?'#fff':C.bg,fontWeight:700,borderRadius:8};
      case'today':return{...base,color:C.mint,fontWeight:700};
      case'range-start':return{...base,background:C.mint,color:isLt?'#fff':C.bg,fontWeight:700,borderRadius:'8px 0 0 8px'};
      case'range-end':return{...base,background:C.mint,color:isLt?'#fff':C.bg,fontWeight:700,borderRadius:'0 8px 8px 0'};
      case'range-end-preview':return{...base,background:C.mintHard,color:C.mint,fontWeight:700,borderRadius:'0 8px 8px 0',border:`1px dashed ${C.mint}`};
      case'range-mid':return{...base,background:C.mintSoft,color:C.mint,fontWeight:500,borderRadius:0};
      case'range-mid-preview':return{...base,background:isLt?C.mintSoft:'rgba(184,168,240,0.08)',color:C.mint,fontWeight:500,borderRadius:0,opacity:0.7};
      default:return{...base,color:C.text,fontWeight:400};
    }
  };

  // Summary line inside the picker showing what's selected in draft
  const draftSummary = () => {
    if(!draft)return null;
    if(draft.mode==='day')return <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
      <span style={{color:C.text2,fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>Selected</span>
      <span style={{color:C.mint,fontWeight:700,fontSize:13}}>{fmtFull(draft.date)}</span>
    </div>;
    if(draft.mode==='range-partial')return <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
      <span style={{color:C.text2,fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:0.5}}>From</span>
      <span style={{color:C.mint,fontWeight:700,fontSize:13}}>{fmt(draft.from)}</span>
      <span style={{color:C.text3,fontSize:11}}>→</span>
      <span style={{color:C.text3,fontSize:11,fontStyle:'italic'}}>tap end date</span>
    </div>;
    if(draft.mode==='range'){
      const days=Math.round((new Date(draft.to+'T12:00:00')-new Date(draft.from+'T12:00:00'))/86400000)+1;
      return <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
        <span style={{color:C.mint,fontWeight:700,fontSize:13}}>{fmt(draft.from)}</span>
        <span style={{color:C.text2,fontSize:11}}>→</span>
        <span style={{color:C.mint,fontWeight:700,fontSize:13}}>{fmt(draft.to)}</span>
        <span style={{background:C.mintSoft,color:C.mint,fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6}}>{days}d</span>
      </div>;
    }
    return null;
  };

  return (<div style={{position:'relative',zIndex:20}}>
    <div style={{display:'flex',alignItems:'center',gap:6,padding:3,borderRadius:12,background:C.subtle,border:`1px solid ${C.border}`}}>
      {!isRange&&<button onClick={()=>nav(-1)} disabled={value.date<=MIN} style={{width:30,height:30,borderRadius:8,border:'none',background:'transparent',color:value.date<=MIN?'rgba(255,255,255,0.1)':C.text2,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>}
      <div style={{flex:1,textAlign:'center',fontSize:12,fontWeight:600,color:C.text,cursor:'pointer',padding:'5px 0',whiteSpace:'nowrap'}} onClick={openPicker}>
        {isRange?`${fmt(value.from)} – ${fmt(value.to)}`:fmtFull(value.date)}
        {isRange&&<span style={{fontSize:10,color:C.text3,marginLeft:6}}>({rangeDays}d avg)</span>}
      </div>
      {!isRange&&<button onClick={()=>nav(1)} disabled={isToday} style={{width:30,height:30,borderRadius:8,border:'none',background:'transparent',color:isToday?'rgba(255,255,255,0.1)':C.text2,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>›</button>}
      <button onClick={openPicker} title="Calendar"
        style={{width:30,height:30,borderRadius:8,border:`1px solid ${showPicker?C.mintMed:C.border}`,background:showPicker?C.mintSoft:'rgba(255,255,255,0.04)',color:showPicker?C.mint:C.text3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      </button>
      {(isRange||!isToday)&&<button onClick={()=>{onChange({mode:'day',date:TODAY});setShowPicker(false);setDraft(null);}}
        style={{padding:'5px 8px',borderRadius:8,border:'none',background:C.mintSoft,color:C.mint,fontSize:10,fontWeight:700,cursor:'pointer',flexShrink:0}}>Today</button>}
    </div>
    {showPicker&&<div onClick={handleCancel} style={{position:'fixed',inset:0,zIndex:98,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}/>}
    {showPicker&&<div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,background:C.mode==='light'?'rgba(248,248,255,0.97)':C.modalBg,border:`1px solid ${C.glassBorder}`,borderRadius:16,padding:16,zIndex:100,boxShadow:C.mode==='light'?'0 16px 48px rgba(120,108,180,0.12)':'0 16px 48px rgba(0,0,0,0.7)',maxWidth:420,width:'100%',backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`}}>
      {/* Presets */}
      <div style={{display:'flex',flexWrap:'nowrap',gap:4,marginBottom:12,overflowX:'auto'}}>
        {presets.map(p=>{
          const active = draft && (
            (draft.mode==='day'&&p.v.mode==='day'&&draft.date===p.v.date)||
            (draft.mode==='range'&&p.v.mode==='range'&&draft.from===p.v.from&&draft.to===p.v.to)
          );
          return(<button key={p.l} onClick={()=>setDraft(p.v)}
            style={{padding:'4px 8px',borderRadius:6,border:`1px solid ${active?C.mint:C.border}`,background:active?C.mintSoft:'rgba(255,255,255,0.03)',color:active?C.mint:C.text2,fontSize:10,fontWeight:active?700:500,cursor:'pointer'}}>{p.l}</button>);
        })}
      </div>
      {/* Month nav */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <button onClick={prevM} disabled={!canPrev} style={{width:28,height:28,borderRadius:7,border:'none',background:'transparent',color:canPrev?C.text2:'rgba(255,255,255,0.1)',cursor:canPrev?'pointer':'default',fontSize:18}}>‹</button>
        <span style={{fontSize:13,fontWeight:700,color:C.text}}>{MNF[viewMonth.m]} {viewMonth.y}</span>
        <button onClick={nextM} disabled={!canNext} style={{width:28,height:28,borderRadius:7,border:'none',background:'transparent',color:canNext?C.text2:'rgba(255,255,255,0.1)',cursor:canNext?'pointer':'default',fontSize:18}}>›</button>
      </div>
      {/* Day headers */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:0,marginBottom:4}}>
        {DN.map(d=>(<div key={d} style={{textAlign:'center',fontSize:10,color:C.text3,fontWeight:600,padding:'4px 0'}}>{d}</div>))}
      </div>
      {/* Calendar grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:0}}>
        {calDays.map((day,i)=>{
          const st=dayState(day);
          return(<div key={i} onClick={()=>handleDay(day)}
            onMouseEnter={()=>{if(draft&&draft.mode==='range-partial'&&day&&!isDis(day))setHoverDate(ds(day));}}
            onMouseLeave={()=>setHoverDate(null)}
            style={dayStyle(st)}>{day||''}</div>);
        })}
      </div>
      {/* Selection summary + help text */}
      <div style={{marginTop:12,padding:'10px 12px',borderRadius:10,background:C.subtle,border:`1px solid ${C.border}`,textAlign:'center',fontSize:11,color:C.text3}}>
        {draftSummary() || <span style={{fontSize:11,color:C.text3}}>Tap a date · tap again for range</span>}
      </div>
      {/* Action buttons */}
      <div style={{display:'flex',gap:8,marginTop:12}}>
        <button onClick={handleCancel}
          style={{flex:1,padding:'10px 0',borderRadius:10,border:`1px solid ${C.border}`,background:'transparent',color:C.text2,fontSize:12,fontWeight:600,cursor:'pointer'}}>
          Cancel
        </button>
        {draft&&draft.mode==='range-partial'&&<button onClick={()=>setDraft({mode:'day',date:draft.from})}
          style={{flex:1,padding:'10px 0',borderRadius:10,border:`1px solid ${C.mint}`,background:'transparent',color:C.mint,fontSize:12,fontWeight:600,cursor:'pointer'}}>
          Use Single Day
        </button>}
        <button onClick={handleConfirm} disabled={!canConfirm}
          style={{flex:1,padding:'10px 0',borderRadius:10,border:'none',
            background:canConfirm?C.mint:'rgba(255,255,255,0.06)',
            color:canConfirm?C.bg:'rgba(255,255,255,0.2)',
            fontSize:12,fontWeight:700,cursor:canConfirm?'pointer':'default',
            opacity:canConfirm?1:0.5}}>
          Confirm
        </button>
      </div>
    </div>}
  </div>);
}

function getDateData(dateNav, D) {
  if (!D) return D?.today || {};
  const allDays = D.DAILY_ALL || [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = (ds) => {const d=new Date(ds+'T12:00:00');return `${months[d.getMonth()]} ${d.getDate()}`;};
  // Dynamically compute compliance & flat stomach from macros
  const withScores = (d) => {
    const cal = d.cal||0, pro = d.pro||0, fib = d.fib||0;
    const calScore = cal > 0 ? Math.min(100, (cal / 1350) * 100) : 0;
    const proScore = pro > 0 ? Math.min(100, (pro / 140) * 100) : 0;
    const fibScore = fib > 0 ? Math.min(100, (fib / 20) * 100) : 0;
    const fibScoreStrict = fib > 0 ? Math.min(100, (fib / 35) * 100) : 0;
    const comp = cal > 0 ? Math.round((calScore + proScore + fibScore) / 3) : 0;
    const flat = cal > 0 ? Math.round((calScore + proScore + fibScoreStrict) / 3) : 0;
    return {...d, comp, flat};
  };
  if (dateNav.mode === 'day') {
    const dt = fmtDate(dateNav.date);
    const found = allDays.find(d => d.dt === dt);
    if (found) return withScores({...found, _isDay:true, _date:dateNav.date, _dt:dt});
    if (dateNav.date === localDateStr()) return withScores({...(D.today||{}), _isDay:true, _date:dateNav.date, _dt:dt});
    return {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,steps:0,comp:0,flat:0,sleep:0,gym:false,_isDay:true,_date:dateNav.date,_dt:dt,_empty:true};
  }
  const fromDate = new Date(dateNav.from+'T12:00:00');
  const toDate = new Date(dateNav.to+'T12:00:00');
  const inRange = allDays.filter(d => {
    const parts = d.dt.split(' ');
    const mIdx = months.indexOf(parts[0]);
    const day = parseInt(parts[1]);
    if (mIdx<0||!day) return false;
    const dd = new Date(2026, mIdx, day);
    return dd >= fromDate && dd <= toDate;
  }).map(withScores);
  if (!inRange.length) return {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,steps:0,comp:0,flat:0,sleep:0,gym:0,_isRange:true,_count:0,_days:[]};
  const avg=(key)=>Math.round(inRange.reduce((a,d)=>a+(d[key]||0),0)/inRange.length);
  const avgF=(key)=>+(inRange.reduce((a,d)=>a+(d[key]||0),0)/inRange.length).toFixed(1);
  return {cal:avg('cal'),pro:avg('pro'),carb:avg('carb'),fat:avg('fat'),fib:avg('fib'),sug:avg('sug'),steps:avg('steps'),
    comp:avg('comp'),flat:avg('flat'),sleep:avgF('sleep'),
    gym:inRange.filter(x=>x.gym).length,_isRange:true,_count:inRange.length,_days:inRange};
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
  lifestyle:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6M8 11h8"/></svg>,
  more:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>,
  extLink:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>,
};

// DATA HELPERS
// TAB RENDERERS
function OverviewTab({vis,isD,isT,isM,D,setInfoModal,settings,dateNav,setDateNav}) {
  const localVis = useAnimateOnMount(JSON.stringify(dateNav));
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=getDateData(dateNav, D);
  const isAvg=d._isRange;
  const label=isAvg?`${d._count}d Average`:(d._dt||"Today");
  // Recompute insights based on current dateNav filter
  const ins = useMemo(() => computeInsights(D, dateNav), [D, dateNav]);
  const checks=[
    {task:"Protein 130–160g",ok:d.pro>=130,val:`${d.pro}g`},
    {task:`Calories 1,300–1,500${isAvg?' avg':''}`,ok:d.cal>=1300&&d.cal<=1500,val:`${d.cal}`},
    {task:"Steps 8,000+",ok:d.steps>=8000,val:d.steps?.toLocaleString?.()},
    {task:"Fiber 20–30g",ok:d.fib>=20,val:`${d.fib}g`},
    {task:"Sugar < 20g",ok:d.sug<=20,val:`${d.sug}g`},
    {task:"Gym session",ok:isAvg?d.gym>=3:d.gym,val:isAvg?`${d.gym} days`:d.gym?"Done":"Rest"},
    {task:"Sleep 7+ hrs",ok:d.sleep>=7,val:`${d.sleep}h`},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <DateNav D={D} value={dateNav} onChange={setDateNav}/></div>
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
            {[{l:"Start",v:"80.5",s:"Jan 5"},{l:"Now",v:String(D.lastW?.kg),s:`Wk ${D.lastW?.week}`},{l:"Goal",v:String(settings.goalWeight),s:`~${settings.goalBF}% BF`}].map(m=>(
              <div key={m.l} style={{textAlign:'center',padding:'10px 14px',borderRadius:14,background:m.l==="Now"?C.mintSoft:'rgba(255,255,255,0.02)',minWidth:72}}>
                <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:3}}>{m.l}</div>
                <div style={{fontSize:17,fontWeight:800,fontFamily:'var(--mono)',color:m.l==="Now"?C.mint:C.text}}>{m.v}</div>
                <div style={{fontSize:9,color:C.text3,marginTop:2}}>{m.s}</div></div>))}</div></div>
        <div style={{marginTop:16}}><WeightChart data={D.WEIGHTS} w={300} h={80} visible={v}/></div>
      </AnimCard>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1',display:'grid',gridTemplateColumns:isM?'1fr':'repeat(3,1fr)',gap:isD?14:12}}>
        <AnimCard delay={0.05} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl tip={TIPS.compliance} modalId="compliance" onModal={setInfoModal}>{label} Compliance</Lbl>
          <Ring val={d.comp} sz={isD?86:74} sw={6} color={C.mint} visible={v}><CountUp to={d.comp} style={{fontSize:22}} color={C.text}/></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.cal} max={1500} label="Calories" unit="kcal" color={d.cal>=1200&&d.cal<=1500?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard>
        <AnimCard delay={0.1} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl tip={TIPS.flatStomach} modalId="flatStomach" onModal={setInfoModal}>{label} Flat Stomach</Lbl>
          <Ring val={d.flat} sz={isD?86:74} sw={6} color={C.cyan} visible={v}><CountUp to={d.flat} style={{fontSize:22}} color={C.cyan}/></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.steps} max={10000} label="Steps" color={d.steps>=8000?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard>
        <AnimCard delay={0.15} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:isD?'22px 16px':'18px 14px'}}>
          <Lbl modalId="protein" onModal={setInfoModal}>{label} Protein</Lbl>
          <Ring val={Math.round(d.pro/160*100)} sz={isD?86:74} sw={6} color={d.pro>=130?C.mint:C.orange} visible={v}>
            <span style={{fontSize:18,fontWeight:900,fontFamily:'var(--mono)'}}>{d.pro}<span style={{fontSize:10,fontWeight:600,color:C.text2}}>g</span></span></Ring>
          <div style={{width:'100%',height:1,background:C.border,margin:'4px 0'}}/>
          <Arc val={d.pro} max={160} label="of 160g target" unit="" color={d.pro>=130?C.mint:C.orange} sz={isD?108:92} visible={v}/>
        </AnimCard></div>
      <AnimCard delay={0.2} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Quick Insights</Lbl>
        <div style={{display:'grid',gridTemplateColumns:isM?'repeat(2,1fr)':'repeat(4,1fr)',gap:10}}>
          {[{l:"Streak",v:ins.streak,suf:"d",sub:"≥70 compliance",c:C.mint,icon:I.fire},
            {l:"Weight Pace",v:parseFloat(ins.velocity),suf:"kg/wk",pre:"-",sub:"Last 3 weeks",c:C.cyan,icon:I.down,dec:1},
            {l:"Protein Hits",v:ins.proteinRate,suf:"%",sub:"Days ≥130g",c:ins.proteinRate>=70?C.mint:C.orange,icon:I.target},
            {l:"Most Active",v:0,text:`${ins.bestStepsDay?.day}`,sub:`${(ins.bestStepsDay?.steps||0).toLocaleString()} steps`,c:C.blue,icon:I.shoe},
          ].map((s,i)=>(<div key={i} style={{padding:'14px 12px',borderRadius:14,background:C.subtle,border:`1px solid ${C.border}`}}>
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

function NutritionTab({vis,isD,isT,isM,D,dateNav,setDateNav}) {
  const [foodTab, setFoodTab] = useState("log");
  const localVis = useAnimateOnMount(JSON.stringify(dateNav));
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d=getDateData(dateNav, D);
  const isAvg=d._isRange;
  const dateLabel=isAvg?`${d._count}d Average`:(d._dt||"Today");
  const macros=[{name:"Protein",v:d.pro*4,c:C.mint},{name:"Carbs",v:d.carb*4,c:C.blue},{name:"Fat",v:d.fat*9,c:C.orange}];
  const mealOrder=[{key:"breakfast",label:"Breakfast",icon:"☀"},{key:"lunch",label:"Lunch",icon:"☕"},{key:"snack",label:"Snack",icon:"🍎"},{key:"dinner",label:"Dinner",icon:"🌙"}];
  const PROXY_URL = 'https://stride-mfp-proxy.robinheering.workers.dev';

  // On-demand food log fetching & caching (proxy is source of truth)
  const [foodLogCache, setFoodLogCache] = useState({});
  const [loadingFood, setLoadingFood] = useState(false);
  const [allTimeFetched, setAllTimeFetched] = useState(false);

  // Only proxy-fetched data (D.FOOD_LOG has today from initial load)
  const allFoodLogs = useMemo(() => ({...D.FOOD_LOG, ...foodLogCache}), [D.FOOD_LOG, foodLogCache]);

  // Parse proxy diary response — handles multiple response shapes
  const parseDiary = (data) => {
    const mk = ['breakfast','lunch','dinner','snack'];
    // Shape 1: {meals: {breakfast:[], ...}}
    if (data.meals && mk.some(k => (data.meals[k]||[]).length > 0)) return data.meals;
    // Shape 2: {breakfast:[], lunch:[], ...} at top level
    if (mk.some(k => (data[k]||[]).length > 0)) {
      const m = {}; mk.forEach(k => { if (data[k]?.length > 0) m[k] = data[k]; }); return m;
    }
    // Shape 3: {food_entries: [...]} flat list
    if (data.food_entries?.length > 0) {
      const m = {breakfast:[],lunch:[],snack:[],dinner:[]};
      data.food_entries.forEach(e => {
        const sl = (e.meal_name||e.meal||'snack').toLowerCase();
        const k = sl.includes('break')?'breakfast':sl.includes('lunch')?'lunch':sl.includes('din')?'dinner':'snack';
        m[k].push({name:e.food_entry_name||e.name||'Unknown',amount:e.serving||e.amount||'',
          cal:Math.round(parseFloat(e.calories||e.cal||0)),pro:Math.round(parseFloat(e.protein||e.pro||0)),
          carb:Math.round(parseFloat(e.carbs||e.carb||0)),fat:Math.round(parseFloat(e.fat||0))});
      });
      if (mk.some(k => m[k].length > 0)) return m;
    }
    return null;
  };

  // Fetch food log for a specific date from proxy
  const fetchFoodLog = useCallback(async (dateStr) => {
    if (foodLogCache[dateStr] !== undefined) return;
    setLoadingFood(true);
    try {
      const resp = await fetch(`${PROXY_URL}/api/diary?date=${dateStr}`);
      console.log(`[Stride] Food ${dateStr}: ${resp.status}`);
      if (resp.ok) {
        const data = await resp.json();
        console.log(`[Stride] Food keys ${dateStr}:`, Object.keys(data).join(','));
        setFoodLogCache(prev => ({...prev, [dateStr]: parseDiary(data)}));
      } else {
        console.log(`[Stride] Food ${dateStr}: HTTP ${resp.status}`);
        setFoodLogCache(prev => ({...prev, [dateStr]: null}));
      }
    } catch (e) {
      console.log('[Stride] Food fetch error:', dateStr, e.message);
      setFoodLogCache(prev => ({...prev, [dateStr]: null}));
    }
    setLoadingFood(false);
  }, [foodLogCache]);

  // Fetch food logs for a date range (batch)
  const fetchFoodLogsForRange = useCallback(async (from, to) => {
    const start = new Date(from+'T12:00:00');
    const end = new Date(to+'T12:00:00');
    const dates = [];
    for (let dd = new Date(start); dd <= end; dd.setDate(dd.getDate()+1)) {
      const ds = localDateStr(dd);
      if (foodLogCache[ds] === undefined) dates.push(ds);
    }
    if (dates.length === 0) return;
    setLoadingFood(true);
    const results = {};
    for (let i = 0; i < dates.length; i += 7) {
      const batch = dates.slice(i, i + 7);
      await Promise.all(batch.map(async (dateStr) => {
        try {
          const resp = await fetch(`${PROXY_URL}/api/diary?date=${dateStr}`);
          if (resp.ok) { results[dateStr] = parseDiary(await resp.json()); }
          else { results[dateStr] = null; }
        } catch(e) { results[dateStr] = null; }
      }));
    }
    setFoodLogCache(prev => ({...prev, ...results}));
    setLoadingFood(false);
  }, [foodLogCache]);

  // Auto-fetch when date changes
  useEffect(() => {
    if (dateNav.mode === 'day') {
      fetchFoodLog(dateNav.date);
    } else if (dateNav.mode === 'range') {
      fetchFoodLogsForRange(dateNav.from, dateNav.to);
    }
  }, [dateNav]);

  // Pre-fetch ALL food data since program start for Top Foods (runs once)
  useEffect(() => {
    if (allTimeFetched) return;
    setAllTimeFetched(true);
    const programStart = new Date('2026-01-05T12:00:00');
    const today = new Date();
    const dates = [];
    for (let dd = new Date(programStart); dd <= today; dd.setDate(dd.getDate()+1)) {
      const ds = localDateStr(dd);
      if (foodLogCache[ds] === undefined && !D.FOOD_LOG[ds]) dates.push(ds);
    }
    if (dates.length === 0) return;
    // Background fetch — don't show loading spinner, batch quietly
    (async () => {
      const results = {};
      for (let i = 0; i < dates.length; i += 5) {
        const batch = dates.slice(i, i + 5);
        await Promise.all(batch.map(async (dateStr) => {
          try {
            const resp = await fetch(`${PROXY_URL}/api/diary?date=${dateStr}`);
            if (resp.ok) { results[dateStr] = parseDiary(await resp.json()); }
            else { results[dateStr] = null; }
          } catch { results[dateStr] = null; }
        }));
        // Update cache progressively so UI refreshes as data comes in
        if (Object.keys(results).length > 0) {
          setFoodLogCache(prev => ({...prev, ...results}));
        }
      }
    })();
  }, []);

  // Get food log for current day (proxy data takes priority over fallback)
  const dayMeals = d._isDay ? allFoodLogs[d._date] : null;

  // Compute popular foods from ALL fetched food logs (entire program)
  const popularFoods = useMemo(() => {
    if (dateNav.mode === 'range') {
      return computePopularFoods(allFoodLogs, dateNav.from, dateNav.to);
    }
    // All-time top foods (from all fetched data since Jan 5)
    return computePopularFoods(allFoodLogs);
  }, [allFoodLogs, dateNav]);

  const totalFoodDays = Object.values(allFoodLogs).filter(v => v != null).length;
  const foodLabel = d._isDay ? (d._dt || "Today") + "'s Log" : "Top Foods";

  // Food list renderer (shared between Top Foods views)
  const TopFoodsList = ({foods, label}) => (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {label && <div style={{fontSize:10,color:C.text3,textAlign:'center',padding:'4px 0'}}>{label}</div>}
      {foods.length === 0 ? (
        <div style={{padding:20,textAlign:'center',color:C.text3,fontSize:12}}>
          {loadingFood ? (
            <div>
              <div style={{marginBottom:8}}>Fetching food data from MFP...</div>
              <div style={{width:20,height:20,border:`2px solid ${C.border}`,borderTopColor:C.mint,borderRadius:'50%',margin:'0 auto',animation:'spin 1s linear infinite'}}/>
              <div style={{fontSize:10,marginTop:8}}>{totalFoodDays} days loaded so far</div>
            </div>
          ) : 'No food data found. Make sure the MFP proxy is running and you have logged meals.'}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:isD?'repeat(2,1fr)':'1fr',gap:8}}>
          {foods.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:C.subtle,border:`1px solid ${C.border}`,
            opacity:v?1:0,transform:v?'translateY(0)':'translateY(8px)',transition:`all .3s ease ${i*.04}s`}}>
            <div style={{width:28,height:28,borderRadius:8,background:C.mintSoft,color:C.mint,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{f.count}×</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
              <div style={{fontSize:10,color:C.text3,marginTop:1}}>{f.avgCal} cal · {f.avgPro}g pro · {f.avgCarb}g carb · {f.avgFat}g fat</div></div>
          </div>))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <DateNav D={D} value={dateNav} onChange={setDateNav}/></div>
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
            <div key={a.l} style={{textAlign:'center',padding:'12px 8px',borderRadius:14,background:C.subtle,opacity:v?1:0,transform:v?'translateY(0)':'translateY(10px)',transition:`all .4s ease ${i*.06}s`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:4}}>{a.l}</div>
              <CountUp to={a.v} style={{fontSize:18}} color={a.c}/>
              <div style={{fontSize:9,color:C.text3}}>{a.u}</div></div>))}</div>
      </AnimCard>
      <AnimCard delay={0.1} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Lbl>{d._isRange?"Period Overview":"Food Diary"}</Lbl>
          {d._isDay&&<div style={{display:'flex',gap:4,padding:2,borderRadius:8,background:C.subtle}}>
            <button onClick={()=>setFoodTab("log")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="log"?C.mintSoft:'transparent',color:foodTab==="log"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>{foodLabel}</button>
            <button onClick={()=>setFoodTab("popular")} style={{padding:'4px 10px',borderRadius:6,border:'none',cursor:'pointer',background:foodTab==="popular"?C.mintSoft:'transparent',color:foodTab==="popular"?C.mint:C.text3,fontSize:10,fontWeight:600,fontFamily:'var(--sans)'}}>Top Foods</button></div>}</div>
        {d._isRange?(<div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{padding:'14px 16px',borderRadius:12,background:C.subtle,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.text3,marginBottom:8}}>Daily averages across <span style={{color:C.mint,fontWeight:700}}>{d._count} days</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {[{l:'Calories',v:d.cal,u:'kcal',c:C.text},{l:'Protein',v:d.pro,u:'g',c:C.mint},{l:'Carbs',v:d.carb,u:'g',c:C.blue},{l:'Fat',v:d.fat,u:'g',c:C.orange},{l:'Fiber',v:d.fib,u:'g',c:C.cyan},{l:'Sugar',v:d.sug,u:'g',c:C.purple}].map(m=>(
                <div key={m.l} style={{textAlign:'center',padding:'8px 0'}}>
                  <div style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:m.c}}>{m.v}<span style={{fontSize:10,fontWeight:400}}>{m.u}</span></div>
                  <div style={{fontSize:9,color:C.text3,marginTop:2}}>{m.l}</div>
                </div>))}
            </div>
          </div>
          <TopFoodsList foods={popularFoods} label={loadingFood ? 'Loading food data for this period...' : (popularFoods.length > 0 ? 'Top foods eaten during this period' : null)} />
        </div>)
        :foodTab==="log"?(
          loadingFood ? (
            <div style={{padding:30,textAlign:'center',color:C.text3,fontSize:12}}>
              <div style={{marginBottom:8}}>Loading food diary...</div>
              <div style={{width:20,height:20,border:`2px solid ${C.border}`,borderTopColor:C.mint,borderRadius:'50%',margin:'0 auto',animation:'spin 1s linear infinite'}}/>
            </div>
          ) : dayMeals ? (<div style={{display:'flex',flexDirection:'column',gap:12}}>
          {mealOrder.map(meal=>{const items=dayMeals[meal.key]; if(!items||!items.length)return null;
            return (<div key={meal.key}>
              <div style={{fontSize:10,fontWeight:700,color:C.text3,textTransform:'uppercase',letterSpacing:.8,marginBottom:6,display:'flex',alignItems:'center',gap:6}}>
                <span>{meal.icon}</span>{meal.label}
                <span style={{fontSize:9,fontWeight:500,color:C.text3,marginLeft:'auto'}}>{items.reduce((a,f)=>a+(f.cal||0),0)} cal</span></div>
              {items.map((f,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',borderRadius:12,background:C.subtle,marginBottom:4,
                opacity:v?1:0,transform:v?'translateX(0)':'translateX(-6px)',transition:`all .3s ease ${i*.03}s`}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:C.text,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{f.name}</div>
                  {f.amount&&<div style={{fontSize:9,color:C.text3,marginTop:1}}>{f.amount}</div>}</div>
                <div style={{display:'flex',gap:isM?6:12,flexShrink:0}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.cal}</div><div style={{fontSize:7,color:C.text3}}>cal</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{f.pro}</div><div style={{fontSize:7,color:C.text3}}>pro</div></div>
                  {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.blue}}>{f.carb}</div><div style={{fontSize:7,color:C.text3}}>carb</div></div>}
                  {!isM&&<div style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.orange}}>{f.fat}</div><div style={{fontSize:7,color:C.text3}}>fat</div></div>}
                </div></div>))}</div>);})}
          <div style={{display:'flex',justifyContent:'flex-end',gap:14,padding:'8px 12px',borderTop:`1px solid ${C.border}`}}>
            <span style={{fontSize:10,color:C.text3,fontWeight:600}}>Total:</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{['breakfast','lunch','snack','dinner'].flatMap(k=>dayMeals[k]||[]).reduce((a,f)=>a+(f.cal||0),0)} cal</span>
            <span style={{fontSize:11,fontWeight:700,fontFamily:'var(--mono)',color:C.mint}}>{Math.round(['breakfast','lunch','snack','dinner'].flatMap(k=>dayMeals[k]||[]).reduce((a,f)=>a+(f.pro||0),0))}g pro</span></div>
        </div>) : (<div style={{padding:20,textAlign:'center',color:C.text3,fontSize:12}}>
          {loadingFood ? (
            <div>
              <div style={{marginBottom:8}}>Fetching {d._dt || 'this day'}'s food log from MFP...</div>
              <div style={{width:20,height:20,border:`2px solid ${C.border}`,borderTopColor:C.mint,borderRadius:'50%',margin:'0 auto',animation:'spin 1s linear infinite'}}/>
            </div>
          ) : 'No food logged in MFP for this day.'}
        </div>))
        :(<div>
          <TopFoodsList foods={popularFoods} label={loadingFood ? `Loading food data... (${totalFoodDays} days loaded)` : (totalFoodDays > 0 ? `Based on ${totalFoodDays} days of MFP data since Jan 5` : null)} />
        </div>)}
      </AnimCard>
      {/* Daily Breakdown — date-aware */}
      <AnimCard delay={0.12} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>{d._isRange ? `${d._count}d Daily Breakdown` : `Week ${D.currentWeek} — Daily Breakdown`}</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {(d._isRange ? (d._days||[]) : D.DAILY_W7).map((dd,i,arr)=>{const isT2=!d._isRange&&i===arr.length-1;
            return (<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:14,background:isT2?C.mintSoft:C.subtle,border:`1px solid ${isT2?C.mintMed:'transparent'}`,
              opacity:v?1:0,transform:v?'translateX(0)':'translateX(-10px)',transition:`all .35s ease ${i*.06}s`}}>
              <div style={{width:40,height:40,borderRadius:12,background:isT2?C.mint:C.surfaceSolid,color:isT2?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:800,flexShrink:0}}>{dd.day||dd.d||dd.dt}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--mono)'}}>{dd.cal} kcal</span>
                  {dd.gym&&<span style={{color:C.mint,display:'flex',alignItems:'center'}}>{I.dumbbell}</span>}
                  {isT2&&<Tag color={C.mint}>Today</Tag>}</div>
                <div style={{fontSize:11,color:C.text3,marginTop:3}}>P:{dd.pro}g · C:{dd.carb}g · F:{dd.fat}g · Fib:{dd.fib}g · {(dd.steps||0).toLocaleString()} steps</div></div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                <Ring val={dd.comp||0} sz={40} sw={4} color={(dd.comp||0)>=80?C.mint:(dd.comp||0)>=60?C.orange:C.red} visible={v}>
                  <span style={{fontSize:11,fontWeight:800,fontFamily:'var(--mono)'}}>{dd.comp||0}</span></Ring>
                <span style={{fontSize:7,color:C.text3,fontWeight:600}}>score</span>
              </div>
            </div>);})}
          {(d._isRange ? (d._days||[]) : D.DAILY_W7).length===0 && <div style={{padding:20,textAlign:'center',color:C.text3,fontSize:12}}>No daily data for this period</div>}
        </div>
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

function ActivityTab({vis,isD,isT,isM,D,gymSleep,setInfoModal,dateNav,setDateNav}) {
  const localVis = useAnimateOnMount(JSON.stringify(dateNav));
  const v = vis && localVis;
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const d_raw=getDateData(dateNav, D);
  // Merge gymSleep localStorage data into the date data (for steps/sleep/gym that aren't in DAILY_ALL)
  const d = useMemo(() => {
    if (d_raw._isDay && d_raw._date) {
      const gs = gymSleep.getDay(d_raw._date);
      if (gs) {
        return {
          ...d_raw,
          steps: gs.steps > 0 ? gs.steps : (d_raw.steps || 0),
          sleep: gs.sleep > 0 ? gs.sleep : (d_raw.sleep || 0),
          gym: gs.gym === true ? true : (d_raw.gym || false),
        };
      }
    }
    return d_raw;
  }, [d_raw, gymSleep.data]);
  const label=d._isRange?`${d._count}d Avg`:(d._dt||"Today");
  const gymDays=D.DAILY_ALL.filter(x=>x.gym).length, totalDays=Math.max(1,D.DAILY_ALL.length);
  const avgSleep=(D.DAILY_ALL.reduce((a,x)=>a+x.sleep,0)/totalDays).toFixed(1);
  const avgSteps=Math.round(D.DAILY_ALL.reduce((a,x)=>a+x.steps,0)/totalDays);
  const [editDate, setEditDate] = useState(null);
  const editData = editDate ? gymSleep.getDay(editDate) : null;
  const editDow = editDate ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(editDate+"T00:00:00").getDay()] : null;
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtD = (ds) => { const dt = new Date(ds+"T00:00:00"); return `${MN[dt.getMonth()]} ${dt.getDate()}`; };

  // Build week dates for the selected date
  const getWeekDates = () => {
    try {
      let refDate;
      if (dateNav.mode === 'day' && dateNav.date) {
        refDate = new Date(dateNav.date + 'T12:00:00');
      } else if (dateNav.to || dateNav.from) {
        refDate = new Date((dateNav.to || dateNav.from) + 'T12:00:00');
      } else {
        refDate = new Date();
      }
      if (isNaN(refDate.getTime())) refDate = new Date();
      const dow = refDate.getDay() || 7;
      const dates = [];
      const today = new Date();
      today.setHours(23,59,59,999);
      for (let i = 1; i <= 7; i++) {
        const dd = new Date(refDate);
        dd.setDate(refDate.getDate() - dow + i);
        if (dd <= today) dates.push(localDateStr(dd));
      }
      return dates;
    } catch(e) { return [localDateStr()]; }
  };
  const weekDates = getWeekDates();

  const getMergedDay = (dateStr) => {
    const gs = gymSleep.getDay(dateStr);
    const dt = new Date(dateStr + "T00:00:00");
    const dtFmt = `${MN[dt.getMonth()]} ${dt.getDate()}`;
    const dailyMatch = D.DAILY_ALL.find(dd => dd.dt === dtFmt);
    const dow = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dt.getDay()];
    // Use whichever source has data; prefer gymSleep if user entered it, else DAILY_ALL
    return {
      date: dateStr, dow,
      steps: gs.steps > 0 ? gs.steps : (dailyMatch?.steps || 0),
      sleep: gs.sleep > 0 ? gs.sleep : (dailyMatch?.sleep || 0),
      gym: gs.gym === true ? true : (dailyMatch?.gym || false),
    };
  };
  const weekData = weekDates.map(getMergedDay);
  const todayStr = localDateStr();

  // Compute weekly avg steps from ALL sources
  const weeklySteps = useMemo(() => {
    const programStart = new Date('2026-01-05T00:00:00');
    const daySteps = {}; // dateStr → steps (single source of truth per day)

    // Layer 1: HIST_GYM_SLEEP (hardcoded seed data — always available)
    Object.entries(HIST_GYM_SLEEP).forEach(([dateStr, dd]) => {
      if (dd.steps > 0) daySteps[dateStr] = dd.steps;
    });

    // Layer 2: gymSleep localStorage (user-entered, overrides seed)
    Object.entries(gymSleep.data || {}).forEach(([dateStr, dd]) => {
      if (dd.steps > 0) daySteps[dateStr] = dd.steps;
    });

    // Layer 3: DAILY_ALL synced data (proxy data, highest priority)
    const mm = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    (D.DAILY_ALL||[]).forEach(dd => {
      if (dd.steps > 0) {
        // Reverse the "Feb 26" format back to "2026-02-26"
        const parts = dd.dt.split(' ');
        const mIdx = mm.indexOf(parts[0]);
        const day = parseInt(parts[1]);
        if (mIdx >= 0 && day) {
          const ds = `2026-${String(mIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          daySteps[ds] = dd.steps;
        }
      }
    });

    // Group by week
    const byWeek = {};
    Object.entries(daySteps).forEach(([dateStr, steps]) => {
      const dt = new Date(dateStr + 'T00:00:00');
      const w = Math.max(1, Math.floor((dt - programStart) / (7*86400000)) + 1);
      if (!byWeek[w]) byWeek[w] = {total:0,count:0};
      byWeek[w].total += steps;
      byWeek[w].count++;
    });

    const result = Object.entries(byWeek)
      .filter(([,v]) => v.count > 0)
      .map(([w,v]) => ({w:parseInt(w), v:Math.round(v.total/v.count)}))
      .sort((a,b) => a.w - b.w);
    return result.length > 0 ? result : [{w:D.currentWeek||8, v:avgSteps}];
  }, [D.DAILY_ALL, gymSleep.data, D.currentWeek, avgSteps]);

  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <div style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <DateNav D={D} value={dateNav} onChange={setDateNav}/></div>
      {/* Row 1: Steps + Sleep — symmetric 2-col */}
      <AnimCard style={{gridColumn:isD?'1/3':isT?'1/2':'1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Lbl modalId="steps" onModal={setInfoModal}>{label} Steps</Lbl>
        <Arc val={d.steps} max={10000} label="" sz={isD?140:120} sw={10} color={d.steps>=8000?C.mint:C.orange} visible={v}/>
        <div style={{display:'flex',gap:10,marginTop:10,alignItems:'center'}}>
          <Tag color={d.steps>=8000?C.mint:C.orange}>{d.steps>=8000?"On target":"Below target"}</Tag>
          {d.gym!==undefined&&<Tag color={d.gym?C.mint:C.text3}>{I.dumbbell} {d._isRange?`${d.gym} days`:d.gym?"Gym ✓":"Rest day"}</Tag>}
        </div>
      </AnimCard>
      <AnimCard delay={0.05} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <Lbl>{label} Sleep</Lbl>
        <Ring val={d.sleep} max={9} sz={isD?120:100} sw={8} color={d.sleep>=7?C.cyan:C.orange} visible={v}>
          <CountUp to={d.sleep} decimals={1} style={{fontSize:26}} color={d.sleep>=7?C.cyan:C.orange}/><span style={{fontSize:9,color:C.text3}}>hrs</span></Ring>
        <div style={{display:'flex',gap:10,marginTop:10,alignItems:'center'}}>
          <Tag color={d.sleep>=7?C.cyan:C.orange}>{d.sleep>=7?"Good rest":"Needs more"}</Tag>
          <span style={{fontSize:10,color:C.text3}}>avg: {avgSleep}h</span>
        </div>
      </AnimCard>
      {/* Row 2: Weekly Avg Steps — full width bar chart */}
      <AnimCard delay={0.1} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Weekly Avg Steps</Lbl>
        <Bars data={weeklySteps.map(s=>({v:s.v,label:`W${s.w}`}))} max={Math.max(12000,...weeklySteps.map(s=>s.v))} color={C.blue} activeIdx={weeklySteps.length-1} visible={v}/>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginTop:14}}>
          <div><span style={{fontSize:10,color:C.text3}}>All-time avg: </span><span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:C.blue}}>{avgSteps.toLocaleString()}</span><span style={{fontSize:10,color:C.text3}}> steps/day</span></div>
          <div><span style={{fontSize:10,color:C.text3}}>W{D.currentWeek}: </span><span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{(weeklySteps[weeklySteps.length-1]||{v:0}).v.toLocaleString()}</span></div>
        </div>
      </AnimCard>

      {/* Daily Activity — tap to edit */}
      <AnimCard delay={0.15} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <Lbl style={{marginBottom:0}}>Daily Activity</Lbl>
          <span style={{fontSize:10,color:C.text3}}>Tap a day to edit</span>
        </div>
        {weekData.length === 0 ? (
          <div style={{padding:24,textAlign:'center',color:C.text3,fontSize:12}}>No days available for this week</div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:isD?`repeat(${Math.min(weekData.length,7)},1fr)`:isT?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
            {weekData.map((dd,i)=>{
              const isToday = dd.date === todayStr;
              const hasData = dd.steps > 0 || dd.sleep > 0 || dd.gym;
              return (
                <button key={dd.date}
                  onClick={(e)=>{e.preventDefault();e.stopPropagation();setEditDate(dd.date);}}
                  style={{padding:'14px 12px',borderRadius:16,textAlign:'left',
                    background:isToday?C.mintSoft:C.subtle,
                    border:`1px solid ${isToday?C.mintMed:C.subtleBorder}`,
                    cursor:'pointer',opacity:v?1:0,transform:v?'translateY(0)':'translateY(12px)',
                    transition:`all .4s ease ${i*.06}s`,
                    fontFamily:'var(--sans)',WebkitAppearance:'none',outline:'none',
                    WebkitTapHighlightColor:'transparent'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:13,fontWeight:800,color:isToday?C.mint:C.text}}>{dd.dow}</span>
                    {isToday && <Tag color={C.mint}>Today</Tag>}
                    {!isToday && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
                  </div>
                  <div style={{fontSize:18,fontWeight:800,fontFamily:'var(--mono)',
                    color:dd.steps>0?(dd.steps>=8000?C.mint:C.orange):C.text3}}>
                    {dd.steps>0?dd.steps.toLocaleString():'\u2013'}
                  </div>
                  <div style={{fontSize:9,color:C.text3,marginTop:1}}>steps</div>
                  <div style={{display:'flex',gap:10,marginTop:8}}>
                    <div>
                      <div style={{fontSize:9,color:C.text3}}>Sleep</div>
                      <div style={{fontSize:13,fontWeight:700,fontFamily:'var(--mono)',
                        color:dd.sleep>0?(dd.sleep>=7?C.cyan:C.orange):C.text3}}>
                        {dd.sleep>0?`${dd.sleep}h`:'\u2013'}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:9,color:C.text3}}>Gym</div>
                      <div style={{color:dd.gym?C.mint:C.text3,display:'flex',alignItems:'center',marginTop:2,fontSize:12}}>
                        {dd.gym?'\u2713':'\u2715'}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </AnimCard>

      {/* Edit Modal */}
      {editDate && editData && <>
        <div onClick={()=>setEditDate(null)} style={{position:'fixed',inset:0,background:C.overlayBg,backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',zIndex:9999}}/>
        <div style={{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:10000,
          width:'100%',maxWidth:360,padding:'0 20px',boxSizing:'border-box',animation:'fadeSlideDown .2s ease'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.modalBg,border:`1px solid ${C.glassBorder}`,
            borderRadius:20,padding:0,overflow:'hidden',
            boxShadow:C.mode==='light'?'0 24px 64px rgba(120,108,180,0.18)':'0 24px 64px rgba(0,0,0,0.8)',
            backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`}}>
            {/* Header */}
            <div style={{padding:'20px 24px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:20,fontWeight:800,color:C.text}}>{editDow}</div>
                <div style={{fontSize:12,color:C.text3,marginTop:2}}>{fmtD(editDate)}</div>
              </div>
              <button onClick={()=>setEditDate(null)} style={{width:36,height:36,borderRadius:12,border:`1px solid ${C.border}`,
                background:C.subtle,color:C.text3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                WebkitAppearance:'none',fontSize:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Fields */}
            <div style={{padding:'20px 24px 24px',display:'flex',flexDirection:'column',gap:20}}>
              {/* Gym */}
              <div>
                <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Gym</div>
                <div style={{display:'flex',gap:10}}>
                  {[{l:'Yes \u2713',v:true},{l:'No \u2715',v:false}].map(o=>(
                    <button key={String(o.v)} onClick={()=>gymSleep.setGym(editDate,o.v)}
                      style={{flex:1,padding:'16px',borderRadius:14,
                        border:`2px solid ${editData?.gym===o.v?C.mint:C.border}`,
                        background:editData?.gym===o.v?(o.v?C.mintSoft:`rgba(200,100,100,0.08)`):'transparent',
                        color:editData?.gym===o.v?(o.v?C.mint:C.red):C.text3,
                        fontSize:16,fontWeight:800,cursor:'pointer',transition:'all .15s',
                        boxShadow:editData?.gym===o.v?`0 0 0 1px ${o.v?C.mint:C.red}33, inset 0 0 12px ${o.v?C.mint:C.red}08`:'none',
                        WebkitAppearance:'none',fontFamily:'var(--sans)'}}>{o.l}</button>))}
                </div>
              </div>
              {/* Sleep */}
              <div>
                <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Sleep (hours)</div>
                <input type="number" inputMode="decimal" min="0" max="12" step="0.5"
                  value={editData?.sleep||''} placeholder="e.g. 7.5"
                  onChange={e=>gymSleep.setSleep(editDate,e.target.value)}
                  style={{width:'100%',padding:'16px',borderRadius:14,border:`2px solid ${C.border}`,
                    background:C.subtle,color:C.text,fontSize:20,fontFamily:'var(--mono)',
                    textAlign:'center',outline:'none',boxSizing:'border-box',
                    WebkitAppearance:'none'}}/>
              </div>
              {/* Steps */}
              <div>
                <div style={{fontSize:11,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>Steps</div>
                <input type="number" inputMode="numeric" min="0" max="99999" step="100"
                  value={editData?.steps||''} placeholder="e.g. 8500"
                  onChange={e=>gymSleep.setSteps(editDate,e.target.value)}
                  style={{width:'100%',padding:'16px',borderRadius:14,border:`2px solid ${C.border}`,
                    background:C.subtle,color:C.text,fontSize:20,fontFamily:'var(--mono)',
                    textAlign:'center',outline:'none',boxSizing:'border-box',
                    WebkitAppearance:'none'}}/>
              </div>
              {/* Buttons */}
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button onClick={()=>setEditDate(null)}
                  style={{flex:1,padding:'16px',borderRadius:14,
                    border:`1px solid ${C.border}`,background:C.subtle,color:C.text2,
                    fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:'var(--sans)',
                    WebkitAppearance:'none'}}>Cancel</button>
                <button onClick={()=>setEditDate(null)}
                  style={{flex:1,padding:'16px',borderRadius:14,border:'none',
                    background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
                    color:C.mode==='light'?'#fff':'#0A0C18',
                    fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'var(--sans)',
                    WebkitAppearance:'none'}}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      </>}
    </div>);
}


function ProgressTab({vis,isD,isT,D,setInfoModal,settings,gymSleep}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const velocity=D.insights.velocity, remaining=parseFloat(D.startKg||80.5)-parseFloat(settings?.goalWeight||68)-parseFloat(D.lost||0);
  const weeksLeft=Math.ceil(Math.max(0,remaining)/parseFloat(velocity||0.8));
  const totalWeeks=settings?.totalWeeks||14;

  // Compute weekly steps from all sources (same logic as ActivityTab)
  const weeklySteps = useMemo(() => {
    const programStart = new Date('2026-01-05T00:00:00');
    const daySteps = {};
    Object.entries(HIST_GYM_SLEEP).forEach(([ds, dd]) => { if (dd.steps > 0) daySteps[ds] = dd.steps; });
    Object.entries(gymSleep?.data || {}).forEach(([ds, dd]) => { if (dd.steps > 0) daySteps[ds] = dd.steps; });
    const mm = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    (D.DAILY_ALL||[]).forEach(dd => {
      if (dd.steps > 0) {
        const parts = dd.dt.split(' ');
        const mIdx = mm.indexOf(parts[0]);
        const day = parseInt(parts[1]);
        if (mIdx >= 0 && day) daySteps[`2026-${String(mIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`] = dd.steps;
      }
    });
    const byWeek = {};
    Object.entries(daySteps).forEach(([ds, steps]) => {
      const w = Math.max(1, Math.floor((new Date(ds+'T00:00:00') - programStart) / (7*86400000)) + 1);
      if (!byWeek[w]) byWeek[w] = {total:0,count:0};
      byWeek[w].total += steps; byWeek[w].count++;
    });
    return Object.entries(byWeek).filter(([,v])=>v.count>0).map(([w,v])=>({w:parseInt(w),v:Math.round(v.total/v.count)})).sort((a,b)=>a.w-b.w);
  }, [D.DAILY_ALL, gymSleep?.data]);
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
      <AnimCard delay={0.05}><Lbl modalId="compliance" onModal={setInfoModal}>Compliance Trend</Lbl>
        <Bars data={D.W_NUTR.map(w=>({v:w.comp,label:`W${w.w}`}))} max={100} color={C.mint} activeIdx={D.W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3}}>Best</div><CountUp to={Math.max(...D.W_NUTR.map(w=>w.comp))} style={{fontSize:17}} color={C.mint}/></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>Latest</div><CountUp to={(D.W_NUTR[Math.min(5,Math.max(0,D.W_NUTR.length-1))]||{comp:0,flat:0,cal:0,pro:0}).comp} style={{fontSize:17}} color={C.mint}/></div></div>
      </AnimCard>
      <AnimCard delay={0.1}><Lbl modalId="flatStomach" onModal={setInfoModal}>Flat Stomach Trend</Lbl>
        <Bars data={D.W_NUTR.map(w=>({v:w.flat,label:`W${w.w}`}))} max={100} color={C.cyan} activeIdx={D.W_NUTR.length-1} visible={vis}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:14}}>
          <div><div style={{fontSize:9,color:C.text3}}>Best</div><CountUp to={Math.max(...D.W_NUTR.map(w=>w.flat))} style={{fontSize:17}} color={C.cyan}/></div>
          <div style={{textAlign:'right'}}><div style={{fontSize:9,color:C.text3}}>Latest</div><CountUp to={(D.W_NUTR[Math.min(5,Math.max(0,D.W_NUTR.length-1))]||{comp:0,flat:0,cal:0,pro:0}).flat} style={{fontSize:17}} color={C.cyan}/></div></div>
      </AnimCard>
      <AnimCard delay={0.15}><Lbl>Steps Over Weeks</Lbl>
        <Spark data={weeklySteps.map(s=>s.v)} color={C.blue} w={200} h={60} visible={vis} labels={weeklySteps.map(s=>`W${s.w}: ${s.v>=1000?s.v.toLocaleString():s.v}`)}/></AnimCard>
      <AnimCard delay={0.2}><Lbl>Calorie Avg Over Weeks</Lbl>
        <Spark data={D.W_NUTR.map(w=>w.cal)} color={C.orange} w={200} h={60} visible={vis} labels={D.W_NUTR.map(w=>`W${w.w}: ${Math.round(w.cal)}`)}/></AnimCard>
      <AnimCard delay={0.25}><Lbl>Goal Weight ETA</Lbl>
        <div style={{textAlign:'center'}}>
          <CountUp to={weeksLeft} style={{fontSize:32}} color={C.cyan}/><span style={{fontSize:14,color:C.text3,marginLeft:4}}>weeks to {settings?.goalWeight||68} kg</span>
          <div style={{marginTop:10,padding:'8px 14px',borderRadius:10,background:C.subtle,display:'inline-block'}}>
            <span style={{fontSize:11,color:C.text2}}>Losing <span style={{color:C.mint,fontWeight:700}}>-{velocity} kg/week</span></span>
            <span style={{fontSize:11,color:C.text3,margin:'0 6px'}}>·</span>
            <span style={{fontSize:11,color:C.text2}}>Need <span style={{color:C.cyan,fontWeight:700}}>{Math.max(0,remaining).toFixed(1)} kg</span> more</span>
          </div>
          <div style={{fontSize:9,color:C.text3,marginTop:6}}>{totalWeeks}-week program · Week {D.currentWeek} of {totalWeeks}</div>
        </div>
      </AnimCard></div>);
}

function TargetsTab({vis,isD,isT,isM,D,settings,setInfoModal}) {
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const [editGoal, setEditGoal] = useState(false);
  const [editProgram, setEditProgram] = useState(false);
  const [gw, setGw] = useState(settings.goalWeight);
  const [gbf, setGbf] = useState(settings.goalBF);
  const [tw, setTw] = useState(settings.totalWeeks||14);
  const [pw, setPw] = useState(settings.phaseWeeks||{1:{from:1,to:6},2:{from:7,to:9},3:{from:10,to:12},4:{from:13,to:14}});
  const phases=[
    {n:1,l:"Fat Loss",wk:`Weeks ${pw[1]?.from||1}–${pw[1]?.to||6}`,goal:"Aggressive fat loss, protect muscle",cal:"1,300–1,500",pro:"130–160",carb:"40–70",fat:"40–55",sug:"< 20",fib:"20–30",steps:"8k–10k",train:"3x strength + rope"},
    {n:2,l:"Lean Out",wk:`Weeks ${pw[2]?.from||7}–${pw[2]?.to||9}`,goal:"Continue fat loss, rebuild energy",cal:"1,600–1,800",pro:"130–150",carb:"80–130",fat:"45–65",sug:"< 30",fib:"25–35",steps:"8k–12k",train:"3–4x strength"},
    {n:3,l:"Abs Reveal",wk:`Weeks ${pw[3]?.from||10}–${pw[3]?.to||12}`,goal:"Final tightening, visible abs",cal:"1,500–1,650",pro:"140–160",carb:"60–100",fat:"40–55",sug:"< 25",fib:"25–35",steps:"10k+",train:"4x strength + core"},
  ];
  const inputStyle={width:60,padding:'6px 8px',borderRadius:8,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:14,fontFamily:'var(--mono)',textAlign:'center',outline:'none'};
  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      <AnimCard delay={0} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <Lbl>Goals</Lbl>
        <div style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:C.text3}}>Target Weight:</span>
            {editGoal?<input type="number" value={gw} onChange={e=>setGw(e.target.value)} style={inputStyle}/>
              :<span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>{settings.goalWeight} kg</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:C.text3}}>Target BF%:</span>
            {editGoal?<input type="number" value={gbf} onChange={e=>setGbf(e.target.value)} style={inputStyle}/>
              :<span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:C.mint}}>~{settings.goalBF}%</span>}
          </div>
          <button onClick={()=>{if(editGoal){settings.save({goalWeight:parseFloat(gw)||68,goalBF:parseFloat(gbf)||15});}setEditGoal(!editGoal);}}
            style={{padding:'6px 14px',borderRadius:8,border:editGoal?'none':`1px solid ${C.mintMed}`,
              background:editGoal?`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`:'transparent',
              color:editGoal?(C.mode==='light'?'#fff':'#0A0C18'):C.mint,fontSize:11,fontWeight:700,cursor:'pointer'}}>{editGoal?'Save':'Edit'}</button>
          {editGoal&&<button onClick={()=>{setGw(settings.goalWeight);setGbf(settings.goalBF);setEditGoal(false);}}
            style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.subtle,
              color:C.text2,fontSize:11,fontWeight:600,cursor:'pointer'}}>Cancel</button>}
        </div>
      </AnimCard>
      {/* Program Structure — visual timeline */}
      <AnimCard delay={0.03} style={{gridColumn:isD?'1/4':isT?'1/3':'1'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <Lbl style={{marginBottom:0}}>Program Structure</Lbl>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:10,color:C.text3}}>Now: <span style={{color:C.cyan,fontWeight:700}}>Week {D.currentWeek}</span></span>
            {editProgram && <button onClick={()=>{setTw(settings.totalWeeks||14);setPw(settings.phaseWeeks||{1:{from:1,to:6},2:{from:7,to:9},3:{from:10,to:12},4:{from:13,to:14}});setEditProgram(false);}}
              style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:C.subtle,
                color:C.text2,fontSize:11,fontWeight:600,cursor:'pointer'}}>Cancel</button>}
            <button onClick={()=>{if(editProgram){settings.save({totalWeeks:parseInt(tw)||14,phaseWeeks:pw});}setEditProgram(!editProgram);}}
              style={{padding:'6px 14px',borderRadius:8,border:editProgram?'none':`1px solid ${C.mintMed}`,
                background:editProgram?`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`:'transparent',
                color:editProgram?(C.mode==='light'?'#fff':'#0A0C18'):C.mint,fontSize:11,fontWeight:700,cursor:'pointer'}}>{editProgram?'Save':'Edit'}</button>
          </div>
        </div>
        {/* Visual phase timeline bar */}
        {!editProgram && <div>
          {isM ? (
            /* Mobile: vertical stacked phases */
            <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:12}}>
              {phases.map((p,i) => {
                const from = pw[p.n]?.from||1, to = pw[p.n]?.to||1;
                const span = to - from + 1;
                const total = parseInt(tw)||14;
                const pct = (span/total)*100;
                const isCurrent = D.currentWeek >= from && D.currentWeek <= to;
                const colors = [C.mint, C.cyan, C.purple];
                return (<div key={p.n} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:10,
                    background:isCurrent?`${colors[i]}15`:C.subtle,
                    border:`1px solid ${isCurrent?colors[i]+'44':C.border}`}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:colors[i],flexShrink:0}}/>
                    <span style={{fontSize:12,fontWeight:700,color:isCurrent?colors[i]:C.text2}}>{p.l}</span>
                    <span style={{fontSize:10,color:C.text3,marginLeft:'auto'}}>W{from}–{to}</span>
                    <span style={{fontSize:9,color:C.text3}}>({span}w)</span>
                  </div>
                  {isCurrent && <Tag color={colors[i]}>Now</Tag>}
                </div>);
              })}
            </div>
          ) : (
            /* Desktop/Tablet: horizontal bar */
            <div style={{display:'flex',height:32,borderRadius:10,overflow:'hidden',marginBottom:12,border:`1px solid ${C.border}`}}>
              {phases.map((p,i) => {
                const from = pw[p.n]?.from||1, to = pw[p.n]?.to||1;
                const span = to - from + 1;
                const total = parseInt(tw)||14;
                const pct = (span/total)*100;
                const isCurrent = D.currentWeek >= from && D.currentWeek <= to;
                const colors = [C.mint, C.cyan, C.purple];
                return (<div key={p.n} style={{width:`${pct}%`,minWidth:40,background:isCurrent?`${colors[i]}22`:C.subtle,
                  borderRight:i<phases.length-1?`1px solid ${C.border}`:'none',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:4,padding:'0 8px',position:'relative'}}>
                  <span style={{fontSize:10,fontWeight:700,color:isCurrent?colors[i]:C.text3,whiteSpace:'nowrap'}}>{p.l}</span>
                  <span style={{fontSize:8,color:C.text3,whiteSpace:'nowrap'}}>W{from}–{to}</span>
                  {isCurrent && <div style={{position:'absolute',bottom:-2,left:`${((D.currentWeek-from)/(span))*100}%`,width:3,height:3,borderRadius:'50%',background:colors[i]}}/>}
                </div>);
              })}
            </div>
          )}
          <div style={{fontSize:10,color:C.text3,textAlign:'center'}}>{tw || settings.totalWeeks || 14} weeks total</div>
        </div>}
        {/* Edit mode — cleaner inputs */}
        {editProgram && <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderRadius:14,background:C.subtle,border:`1px solid ${C.border}`}}>
            <span style={{fontSize:12,color:C.text2,fontWeight:600,whiteSpace:'nowrap'}}>Program Length</span>
            <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
              <button onClick={()=>{const nv=Math.max(4,parseInt(tw)-1);setTw(nv);setPw(prev=>({...prev,3:{...prev[3],to:nv}}));}}
                style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:16,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
              <span style={{fontSize:22,fontWeight:800,fontFamily:'var(--mono)',color:C.mint,minWidth:40,textAlign:'center'}}>{tw}</span>
              <button onClick={()=>{const nv=Math.min(52,parseInt(tw)+1);setTw(nv);setPw(prev=>({...prev,3:{...prev[3],to:nv}}));}}
                style={{width:32,height:32,borderRadius:8,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:16,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              <span style={{fontSize:11,color:C.text3}}>weeks</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isD?'repeat(3,1fr)':'1fr',gap:10}}>
            {phases.map((p,i) => {
              const colors = [C.mint, C.cyan, C.purple];
              const isActive = settings.phase===p.n;
              return (
                <div key={p.n} style={{padding:'16px 18px',borderRadius:14,background:C.subtle,
                  border:`1px solid ${isActive?colors[i]:C.border}`,
                  boxShadow:isActive?`0 0 0 1px ${colors[i]}22`:'none'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                    <div style={{width:24,height:24,borderRadius:8,background:colors[i]+'22',color:colors[i],
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800}}>{p.n}</div>
                    <span style={{fontSize:13,fontWeight:700,color:isActive?colors[i]:C.text}}>{p.l}</span>
                    {isActive && <Tag color={colors[i]}>Active</Tag>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:11,color:C.text3,fontWeight:600}}>Week</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <button onClick={()=>setPw(prev=>({...prev,[p.n]:{...prev[p.n],from:Math.max(1,(prev[p.n]?.from||1)-1)}}))}
                        style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.text3,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                      <span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:colors[i],minWidth:24,textAlign:'center'}}>{pw[p.n]?.from||1}</span>
                      <button onClick={()=>setPw(prev=>({...prev,[p.n]:{...prev[p.n],from:Math.min(parseInt(tw),(prev[p.n]?.from||1)+1)}}))}
                        style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.text3,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                    </div>
                    <span style={{fontSize:11,color:C.text3,fontWeight:600}}>to</span>
                    <div style={{display:'flex',alignItems:'center',gap:4}}>
                      <button onClick={()=>setPw(prev=>({...prev,[p.n]:{...prev[p.n],to:Math.max(1,(prev[p.n]?.to||1)-1)}}))}
                        style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.text3,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                      <span style={{fontSize:16,fontWeight:800,fontFamily:'var(--mono)',color:colors[i],minWidth:24,textAlign:'center'}}>{pw[p.n]?.to||1}</span>
                      <button onClick={()=>setPw(prev=>({...prev,[p.n]:{...prev[p.n],to:Math.min(parseInt(tw),(prev[p.n]?.to||1)+1)}}))}
                        style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:'transparent',color:C.text3,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
                    </div>
                    <span style={{fontSize:10,color:C.text3,marginLeft:'auto'}}>{(pw[p.n]?.to||1)-(pw[p.n]?.from||1)+1}w</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}
      </AnimCard>
      {phases.map((p,pi)=>{const isActive=settings.phase===p.n;return(<AnimCard key={p.n} glow={isActive} delay={pi*0.08} style={{gridColumn:isD&&isActive?'1/4':isT&&isActive?'1/3':'1'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{width:36,height:36,borderRadius:12,background:isActive?C.mint:'rgba(255,255,255,0.04)',color:isActive?C.bg:C.text2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,flexShrink:0}}>{p.n}</div>
          <div><div style={{fontSize:15,fontWeight:800,color:isActive?C.mint:C.text}}>{p.l}</div><div style={{fontSize:11,color:C.text3}}>{p.wk}</div></div>
          {isActive?<Tag color={C.mint} bg={C.mintSoft}>Active</Tag>
            :<button onClick={()=>settings.save({phase:p.n})} style={{marginLeft:'auto',padding:'5px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.text2,fontSize:10,fontWeight:600,cursor:'pointer'}}>Activate</button>}</div>
        <div style={{fontSize:12,color:C.text2,marginBottom:14}}>{p.goal}</div>
        <div style={{display:'grid',gridTemplateColumns:isActive&&isD?'repeat(4,1fr)':'repeat(2,1fr)',gap:8}}>
          {[{l:"Calories",v:p.cal,u:"kcal"},{l:"Protein",v:p.pro,u:"g"},{l:"Carbs",v:p.carb,u:"g"},{l:"Fat",v:p.fat,u:"g"},{l:"Sugar",v:p.sug,u:"g"},{l:"Fiber",v:p.fib,u:"g"},{l:"Steps",v:p.steps,u:"/day"},{l:"Training",v:p.train,u:""}].map(t=>(
            <div key={t.l} style={{padding:'12px 12px',borderRadius:12,background:C.subtle,border:`1px solid ${C.border}`}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,marginBottom:3}}>{t.l}</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:t.l==="Training"?'var(--sans)':'var(--mono)'}}>{t.v}{t.u&&<span style={{fontSize:9,color:C.text3,marginLeft:3}}>{t.u}</span>}</div></div>))}</div>
      </AnimCard>)})}
</div>);
}

// LIFESTYLE TAB — Articles & media feed
// Data shape: { articles: [{ id, title, link, summary, date, image, source, type }] }
const LIFESTYLE_FALLBACK = (()=>{
  // Generate unique branded SVG illustrations as data URIs
  const mkSvg = (shapes) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9B8CE0" stop-opacity="0.15"/><stop offset="100%" stop-color="#7CC4D8" stop-opacity="0.10"/></linearGradient><linearGradient id="a1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9B8CE0"/><stop offset="100%" stop-color="#7CC4D8"/></linearGradient></defs><rect width="800" height="400" fill="#E0E1EF"/><rect width="800" height="400" fill="url(#bg)"/>${shapes}</svg>`)}`;
  const imgs = [
    // 1: Dumbbell - strength
    mkSvg(`<circle cx="280" cy="200" r="80" fill="#9B8CE0" opacity="0.12"/><circle cx="520" cy="200" r="80" fill="#7CC4D8" opacity="0.12"/><rect x="310" y="185" width="180" height="30" rx="15" fill="url(#a1)" opacity="0.35"/><rect x="220" y="160" width="60" height="80" rx="10" fill="url(#a1)" opacity="0.5"/><rect x="520" y="160" width="60" height="80" rx="10" fill="url(#a1)" opacity="0.5"/><circle cx="650" cy="100" r="40" fill="#C47898" opacity="0.08"/><circle cx="150" cy="320" r="50" fill="#9B8CE0" opacity="0.06"/>`),
    // 2: Heart rate - cardio
    mkSvg(`<polyline points="100,200 200,200 250,120 300,280 350,180 400,220 450,160 500,240 550,200 700,200" stroke="url(#a1)" stroke-width="4" fill="none" opacity="0.45"/><circle cx="400" cy="200" r="120" fill="none" stroke="#9B8CE0" stroke-width="2" opacity="0.12"/><circle cx="400" cy="200" r="80" fill="none" stroke="#7CC4D8" stroke-width="1.5" opacity="0.10"/><circle cx="600" cy="120" r="30" fill="#C47898" opacity="0.08"/>`),
    // 3: Plate - nutrition
    mkSvg(`<circle cx="400" cy="200" r="130" fill="none" stroke="url(#a1)" stroke-width="3" opacity="0.30"/><circle cx="400" cy="200" r="100" fill="#9B8CE0" opacity="0.06"/><circle cx="360" cy="180" r="30" fill="#9B8CE0" opacity="0.15"/><circle cx="430" cy="170" r="25" fill="#7CC4D8" opacity="0.15"/><circle cx="400" cy="230" r="28" fill="#C47898" opacity="0.12"/><circle cx="200" cy="100" r="45" fill="#7CC4D8" opacity="0.06"/><circle cx="620" cy="300" r="55" fill="#9B8CE0" opacity="0.06"/>`),
    // 4: Waves - recovery
    mkSvg(`<path d="M0,200 Q100,140 200,200 T400,200 T600,200 T800,200" stroke="#9B8CE0" stroke-width="3" fill="none" opacity="0.25"/><path d="M0,220 Q100,160 200,220 T400,220 T600,220 T800,220" stroke="#7CC4D8" stroke-width="2" fill="none" opacity="0.20"/><path d="M0,240 Q100,180 200,240 T400,240 T600,240 T800,240" stroke="#C47898" stroke-width="1.5" fill="none" opacity="0.15"/><circle cx="650" cy="100" r="60" fill="#9B8CE0" opacity="0.06"/><circle cx="150" cy="300" r="50" fill="#7CC4D8" opacity="0.06"/>`),
    // 5: Path/road - marathon
    mkSvg(`<path d="M80,350 Q200,200 400,200 Q600,200 720,50" stroke="url(#a1)" stroke-width="6" fill="none" opacity="0.30" stroke-linecap="round"/><circle cx="80" cy="350" r="12" fill="#9B8CE0" opacity="0.4"/><circle cx="720" cy="50" r="12" fill="#7CC4D8" opacity="0.4"/><circle cx="400" cy="200" r="6" fill="#C47898" opacity="0.5"/><circle cx="250" cy="280" r="4" fill="#9B8CE0" opacity="0.3"/><circle cx="570" cy="120" r="4" fill="#7CC4D8" opacity="0.3"/><circle cx="200" cy="100" r="60" fill="#9B8CE0" opacity="0.04"/><circle cx="600" cy="300" r="70" fill="#7CC4D8" opacity="0.04"/>`),
    // 6: Grid - equipment
    mkSvg(`<rect x="150" y="100" width="100" height="100" rx="16" fill="#9B8CE0" opacity="0.12"/><rect x="280" y="100" width="100" height="100" rx="16" fill="#7CC4D8" opacity="0.12"/><rect x="410" y="100" width="100" height="100" rx="16" fill="#C47898" opacity="0.10"/><rect x="150" y="230" width="100" height="100" rx="16" fill="#7CC4D8" opacity="0.10"/><rect x="280" y="230" width="100" height="100" rx="16" fill="#9B8CE0" opacity="0.10"/><rect x="410" y="230" width="100" height="100" rx="16" fill="url(#a1)" opacity="0.12"/><circle cx="650" cy="150" r="40" fill="#9B8CE0" opacity="0.06"/>`),
  ];
  return {articles:[
    {id:"1",title:"Why Lifting Weights Is for Everyone",link:"https://www.gq.com/fitness",summary:"A sports scientist breaks down why strength training delivers results for every body type — and how to get started with compound movements.",date:"2026-02-20T10:00:00",image:imgs[0],source:"GQ Fitness",type:"article"},
    {id:"2",title:"Why Easy Zone 2 Workouts Became the Biggest Thing in Fitness",link:"https://www.gq.com/fitness",summary:"Low-intensity training is great for you, no matter what your fitness-tracking gadget says. Experts explain the science.",date:"2026-02-18T14:00:00",image:imgs[1],source:"GQ Fitness",type:"article"},
    {id:"3",title:"How Fit Can You Get From Just Walking?",link:"https://www.gq.com/fitness",summary:"A sports medicine physician shares a step-by-step guide to burning fat and building fitness without breaking into a jog.",date:"2026-02-15T09:00:00",image:imgs[2],source:"GQ Fitness",type:"article"},
    {id:"4",title:"Better Sleep Starts With More Sunshine",link:"https://www.gq.com/fitness",summary:"The counterintuitive connection between daylight exposure and quality rest — and how to optimise your circadian rhythm.",date:"2026-02-12T11:00:00",image:imgs[3],source:"GQ Fitness",type:"article"},
    {id:"5",title:"Is Cardio or Muscular Strength More Important for Longevity?",link:"https://www.gq.com/fitness",summary:"Researchers weigh in on the fitness debate that could determine how long — and how well — you live.",date:"2026-02-10T08:00:00",image:imgs[4],source:"GQ Fitness",type:"article"},
    {id:"6",title:"The Best Home Gym Equipment Worth Buying in 2025",link:"https://www.gq.com/fitness",summary:"From adjustable dumbbells to compact rowers, these are the pieces that personal trainers recommend for a small-space setup.",date:"2026-02-08T12:00:00",image:imgs[5],source:"GQ Fitness",type:"article"},
  ]};
})();

function LifestyleTab({vis,isD,isT,isM}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const READ_KEY = 'stride_read_articles';
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || '[]'); } catch { return []; }
  });
  const markRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      try { localStorage.setItem(READ_KEY, JSON.stringify(next)); } catch {}
    }
  };
  const isNew = (article) => {
    const d = new Date(article.date);
    const now = new Date();
    return (now - d) < 7 * 86400000; // published within last 7 days
  }; // all | article | video | podcast

  useEffect(()=>{
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Try fetching live GQ fitness RSS via rss2json API (free, no CORS issues)
        const rssUrl = encodeURIComponent('https://www.gq.com/feed/rss');
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&api_key=&count=20`;
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('RSS fetch failed');
        const data = await res.json();
        if (data.status === 'ok' && data.items?.length > 0) {
          // Filter for fitness/wellness/health articles
          const fitnessKeywords = ['fitness','workout','exercise','gym','muscle','weight','cardio','strength','training','health','wellness','sleep','nutrition','protein','diet','running','walking','yoga','recovery','body'];
          const fitnessArticles = data.items.filter(item => {
            const text = `${item.title} ${item.description || ''} ${(item.categories||[]).join(' ')}`.toLowerCase();
            return fitnessKeywords.some(kw => text.includes(kw));
          });
          // Use fitness articles if enough, otherwise use all
          const useItems = fitnessArticles.length >= 3 ? fitnessArticles : data.items;
          const mapped = useItems.slice(0, 8).map((item, i) => ({
            id: `gq-${i}-${Date.now()}`,
            title: item.title,
            link: item.link || item.guid,
            summary: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
            date: item.pubDate || new Date().toISOString(),
            image: item.thumbnail || item.enclosure?.link || null,
            source: 'GQ',
            type: 'article',
          }));
          if (!cancelled && mapped.length > 0) {
            setArticles(mapped);
            setLoading(false);
            return;
          }
        }
        throw new Error('No articles from RSS');
      } catch(e) {
        console.log('[Stride] RSS fetch failed:', e.message);
        setArticles(LIFESTYLE_FALLBACK.articles);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    // Auto-refresh every 30 minutes for new articles
    const interval = setInterval(load, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = filter === "all" ? articles : articles.filter(a => a.type === filter);
  const types = [...new Set(articles.map(a=>a.type))];

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
  };

  // Masonry-inspired layout: featured (first) card is large, rest in grid
  const featured = filtered[0];
  const rest = filtered.slice(1);
  const cols = isD ? 3 : isT ? 2 : 1;

  // Placeholder gradient for cards without images
  const placeholderGrad = (idx) => {
    const grads = [
      `linear-gradient(135deg, ${C.mint}22, ${C.mint}08)`,
      `linear-gradient(135deg, ${C.blue}22, ${C.cyan}08)`,
      `linear-gradient(135deg, ${C.purple}22, ${C.mint}08)`,
      `linear-gradient(135deg, ${C.cyan}22, ${C.blue}08)`,
      `linear-gradient(135deg, ${C.orange}22, ${C.purple}08)`,
      `linear-gradient(135deg, ${C.mint}18, ${C.purple}12)`,
    ];
    return grads[idx % grads.length];
  };

  const sourceIcon = (type) => {
    switch(type) {
      case 'video': return '▶';
      case 'podcast': return '🎧';
      default: return null;
    }
  };

  const ArticleCard = ({item, idx, featured: isFeatured, isUnread, isNewArticle, onRead}) => {
    const hasImg = !!item.image;
    const cardH = isFeatured ? (isM ? 240 : 300) : (isM ? 180 : 210);
    const [imgLoaded, setImgLoaded] = useState(true);
    const showImg = hasImg && imgLoaded;
    const isSvgData = item.image?.startsWith('data:image/svg');
    const isExternalImg = showImg && !isSvgData;
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer"
        onClick={()=>onRead && onRead(item.id)}
        style={{display:'block',textDecoration:'none',color:'inherit',
          borderRadius:20,overflow:'hidden',position:'relative',
          background:C.glass,border:`1px solid ${C.glassBorder}`,
          backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
          boxShadow:C.mode==='light'
            ?'0 2px 8px rgba(120,108,180,0.06), 0 8px 28px rgba(120,108,180,0.04), inset 0 1px 0 rgba(255,255,255,0.75)'
            :'0 2px 8px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(184,168,240,0.04)',
          transition:'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s',
          cursor:'pointer',gridColumn:isFeatured?(isD?'1/4':isT?'1/3':'1'):'auto'}}
        onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=C.mode==='light'?'0 4px 14px rgba(120,108,180,0.10), 0 16px 40px rgba(120,108,180,0.07)':'0 4px 16px rgba(0,0,0,0.45), 0 16px 48px rgba(0,0,0,0.28)';}}
        onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=C.mode==='light'?'0 2px 8px rgba(120,108,180,0.06), 0 8px 28px rgba(120,108,180,0.04), inset 0 1px 0 rgba(255,255,255,0.75)':'0 2px 8px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.22), inset 0 1px 0 rgba(184,168,240,0.04)';}}>
        {/* Image / Gradient header */}
        <div style={{height:cardH,position:'relative',overflow:'hidden',
          background:showImg?'#1a1a2e':placeholderGrad(idx)}}>
          {showImg && <img src={item.image} alt="" loading="lazy"
            style={{width:'100%',height:'100%',objectFit:'cover',display:'block',
              filter:isExternalImg?C.mode==='light'?'brightness(0.92) saturate(0.85)':'brightness(0.8) saturate(0.9)':'none',
              transition:'transform .4s ease,filter .3s'}}
            onError={()=>setImgLoaded(false)}/>}
          {/* Multi-layer overlay for legibility */}
          {isExternalImg && <>
            <div style={{position:'absolute',inset:0,
              background:'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 40%, rgba(0,0,0,0.08) 70%, transparent 100%)'}}/>
            <div style={{position:'absolute',inset:0,
              background:C.mode==='light'
                ?'linear-gradient(135deg, rgba(124,107,196,0.12) 0%, rgba(108,200,220,0.06) 100%)'
                :'linear-gradient(135deg, rgba(184,168,240,0.10) 0%, rgba(108,216,224,0.05) 100%)',
              mixBlendMode:'screen'}}/>
          </>}
          {isSvgData && <div style={{position:'absolute',inset:0,
            background:`linear-gradient(to top, ${C.mode==='light'?'rgba(224,225,239,0.85)':'rgba(10,12,24,0.80)'} 0%, transparent 55%)`}}/>}
          {!showImg && <div style={{position:'absolute',inset:0,
            background:`linear-gradient(to top, ${C.mode==='light'?'rgba(220,220,240,0.95)':'rgba(10,12,24,0.90)'} 0%, transparent 100%)`}}/>}
          {/* Source badge + New/Unread indicators */}
          <div style={{position:'absolute',top:14,left:14,display:'flex',gap:6,alignItems:'center'}}>
            <span style={{padding:'5px 12px',borderRadius:10,
              background:isExternalImg?'rgba(0,0,0,0.35)':(C.mode==='light'?'rgba(255,255,255,0.85)':'rgba(0,0,0,0.55)'),
              backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
              fontSize:10,fontWeight:700,color:isExternalImg?'rgba(255,255,255,0.95)':C.mint,letterSpacing:.3,
              border:isExternalImg?'1px solid rgba(255,255,255,0.12)':`1px solid ${C.border}`}}>
              {sourceIcon(item.type)&&<span style={{marginRight:4}}>{sourceIcon(item.type)}</span>}
              {item.source}
            </span>
            {isNewArticle && <span style={{padding:'3px 8px',borderRadius:8,
              background:'linear-gradient(135deg,#9B8CE0,#7CC4D8)',
              fontSize:9,fontWeight:800,color:'#fff',letterSpacing:.5,textTransform:'uppercase'}}>New</span>}
          </div>
          {/* Unread dot indicator */}
          {isUnread && <div style={{position:'absolute',top:14,right:14,width:10,height:10,borderRadius:5,
            background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
            boxShadow:`0 0 8px ${C.mint}66`,border:'2px solid rgba(255,255,255,0.5)'}}/>}
          {/* Title overlaid on image */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:isFeatured?'20px 20px':'14px 16px'}}>
            <h3 style={{margin:0,fontSize:isFeatured?(isM?18:24):14,fontWeight:800,lineHeight:1.25,
              color:isExternalImg?'#fff':C.text,
              textShadow:isExternalImg?'0 1px 3px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.2)':'none',
              letterSpacing:isFeatured?-0.3:0}}>
              {item.title}
            </h3>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:'14px 16px 16px'}}>
          <p style={{margin:0,fontSize:12,lineHeight:1.55,color:C.text2,
            display:'-webkit-box',WebkitLineClamp:isFeatured?3:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {item.summary}
          </p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
            <span style={{fontSize:10,color:C.text3,fontWeight:600}}>{fmtDate(item.date)}</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:700,color:C.mint}}>
              Read on GQ {I.extLink}
            </span>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <Lbl>Lifestyle & Fitness</Lbl>
        <p style={{fontSize:12,color:C.text3,margin:0}}>Curated reads from GQ Fitness and more{(()=>{
          const unread = articles.filter(a=>!readIds.includes(a.id)).length;
          return unread > 0 ? <span style={{marginLeft:8,padding:'2px 8px',borderRadius:8,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,color:'#fff',fontSize:10,fontWeight:700}}>{unread} unread</span> : null;
        })()}</p>
      </div>

      {/* Type filter pills */}
      {types.length > 1 && (
        <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
          {['all',...types].map(t=>(
            <button key={t} onClick={()=>setFilter(t)}
              style={{padding:'5px 14px',borderRadius:10,border:`1px solid ${filter===t?C.mint:C.border}`,
                background:filter===t?C.mintSoft:C.subtle,
                color:filter===t?C.mint:C.text2,fontSize:11,fontWeight:filter===t?700:500,
                cursor:'pointer',fontFamily:'var(--sans)',textTransform:'capitalize',transition:'all .15s'}}>
              {t}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:C.text3}}>
          <div style={{width:24,height:24,border:`2px solid ${C.border}`,borderTopColor:C.mint,borderRadius:'50%',
            animation:'spin 0.8s linear infinite'}}/>
        </div>
      ) : filtered.length === 0 ? (
        <AnimCard>
          <div style={{textAlign:'center',padding:32,color:C.text3}}>
            <div style={{fontSize:32,marginBottom:8}}>📰</div>
            <div style={{fontSize:13,fontWeight:600}}>No articles yet</div>
            <div style={{fontSize:11,marginTop:4}}>Run <code style={{background:C.subtle,padding:'2px 6px',borderRadius:4,fontSize:10}}>python sync/sync_gq.py</code> to fetch content</div>
          </div>
        </AnimCard>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr',gap:isD?16:12}}>
          {/* Featured article — spans full width */}
          {featured && <ArticleCard item={featured} idx={0} featured={true} isUnread={!readIds.includes(featured.id)} isNewArticle={isNew(featured)} onRead={markRead}/>}
          {/* Remaining articles */}
          {rest.map((a,i)=><ArticleCard key={a.id||i} item={a} idx={i+1} featured={false} isUnread={!readIds.includes(a.id)} isNewArticle={isNew(a)} onRead={markRead}/>)}
        </div>
      )}
    </div>
  );
}

// AI COACH TAB
function CoachTab({vis,isD,isT,isM,D,setInfoModal,setChatOpen}) {
  const today = D.today || {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,steps:0,sleep:0,gym:false,comp:0};
  const cols=isD?'repeat(3,1fr)':isT?'repeat(2,1fr)':'1fr';
  const typeColor = {warning:C.orange,success:C.mint,action:C.blue};
  const remaining = {cal:Math.max(0,1400-today.cal),pro:Math.max(0,140-today.pro),fib:Math.max(0,25-today.fib),steps:Math.max(0,8000-today.steps)};
  const staticTips = [
    {title:"Fiber Gap",tip:`At ${today.fib}g fiber — add broccoli or chia seeds to reach 20g.`,type:"action"},
    {title:today.pro>=130?"Protein On Track":"Protein Low",tip:today.pro>=130?`${today.pro}g protein — solid.`:`${today.pro}g protein — below 130g, add a shake.`,type:today.pro>=130?"success":"warning"},
    {title:"Step Check",tip:`${today.steps.toLocaleString()} steps. ${today.steps>=8000?"Target hit!":"Walk 20 min to close gap."}`,type:today.steps>=8000?"success":"action"},
    {title:"Sugar Watch",tip:`${today.sug}g sugar${today.sug>20?" — over 20g limit.":" — controlled."}`,type:today.sug>20?"warning":"success"},
    {title:"Weekly Trend",tip:`Compliance at ${(D.W_NUTR[Math.min(5,Math.max(0,D.W_NUTR.length-1))]||{comp:0}).comp}/100. ${(D.W_NUTR[Math.min(5,Math.max(0,D.W_NUTR.length-1))]||{comp:0}).comp>=75?"Strong.":"Focus protein & fiber."}`,type:(D.W_NUTR[Math.min(5,Math.max(0,D.W_NUTR.length-1))]||{comp:0}).comp>=75?"success":"action"},
  ];

  return (
    <div style={{display:'grid',gridTemplateColumns:cols,gap:isD?14:12}}>
      {/* Hero — open chat CTA */}
      <AnimCard glow style={{gridColumn:isD?'1/4':isT?'1/3':'1',padding:isD?32:24,textAlign:'center'}}>
        <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
          display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',
          boxShadow:`0 4px 20px ${C.mint}33`}}>{I.sparkle}</div>
        <div style={{fontSize:isM?20:24,fontWeight:900,color:C.text,marginBottom:6}}>AI Coach</div>
        <div style={{fontSize:12,color:C.text3,marginBottom:20,maxWidth:320,margin:'0 auto 20px',lineHeight:1.5}}>
          Context-aware assistant with full visibility into your nutrition, training, and progress data.</div>
        <button onClick={()=>setChatOpen(true)}
          style={{padding:'14px 32px',borderRadius:14,border:'none',cursor:'pointer',
            background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
            color:C.mode==='light'?'#fff':'#0A0C18',fontSize:14,fontWeight:800,
            fontFamily:'var(--sans)',boxShadow:`0 4px 16px ${C.mint}33`,
            transition:'transform .15s, box-shadow .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 6px 24px ${C.mint}55`;}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 16px ${C.mint}33`;}}>
          {I.sparkle} Start Chat
        </button>
      </AnimCard>

      {/* Today's Analysis */}
      <AnimCard delay={0.05} style={{gridColumn:isD?'1/2':'1'}}>
        <Lbl>Today's Analysis</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {staticTips.map((t,i)=>(<div key={i} style={{padding:'12px 14px',borderRadius:12,background:C.subtle,border:`1px solid ${C.border}`,borderLeft:`3px solid ${typeColor[t.type]||C.mint}`,
            opacity:vis?1:0,transform:vis?'translateX(0)':'translateX(-8px)',transition:`all .35s ease ${i*.06}s`}}>
            <div style={{fontSize:11,fontWeight:700,color:typeColor[t.type]||C.mint,marginBottom:3}}>{t.title}</div>
            <div style={{fontSize:11,color:C.text2,lineHeight:1.4}}>{t.tip}</div></div>))}</div>
      </AnimCard>

      {/* Remaining Today */}
      <AnimCard delay={0.1}>
        <Lbl>Remaining Today</Lbl>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[{l:"Calories",v:remaining.cal,u:"kcal",c:C.mint,max:200},{l:"Protein",v:remaining.pro,u:"g",c:C.mint,max:30},{l:"Fiber",v:remaining.fib,u:"g",c:C.cyan,max:17},{l:"Steps",v:remaining.steps,u:"",c:C.blue,max:2100}].map(r=>(
            <div key={r.l}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
              <span style={{color:C.text2,fontWeight:600}}>{r.l}</span>
              <span style={{fontFamily:'var(--mono)',fontWeight:700,color:r.v<=0?C.mint:C.text}}>{r.v<=0?"✓ Done":r.v.toLocaleString()+" "+r.u+" left"}</span></div>
              <div style={{height:4,borderRadius:2,background:C.mode==='light'?C.track:C.border,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.min(100,100-r.v/r.max*100)}%`,borderRadius:2,background:r.v<=0?C.mint:`${r.c}88`,transition:'width .8s ease'}}/></div></div>))}</div>
      </AnimCard>

      {/* Meal Suggestion */}
      <AnimCard delay={0.15}>
        <Lbl>Meal Suggestion</Lbl>
        <div style={{fontSize:11,color:C.text2,lineHeight:1.5}}>
          {remaining.cal<=50&&remaining.pro<=10?<div style={{fontWeight:700,color:C.mint}}>All targets hit! Great job today.</div>:<>
          <div style={{fontWeight:700,color:C.mint,marginBottom:8}}>{remaining.cal>200?"To hit targets tonight:":"Light snack to close gaps:"}</div>
          {(()=>{
            const meals=[];const rc=remaining.cal,rp=remaining.pro,rf=remaining.fib;
            if(rp>30&&rc>200)meals.push({n:`${Math.min(200,Math.round(rc/2.5))}g Chicken Breast`,cal:Math.round(Math.min(200,Math.round(rc/2.5))*1.65),pro:Math.round(Math.min(200,Math.round(rc/2.5))*0.31),extra:"high protein"});
            else if(rp>15&&rc>150)meals.push({n:`${Math.round(Math.min(150,rc/1.87))}g Salmon Fillet`,cal:Math.round(Math.min(150,rc/1.87)*1.87),pro:Math.round(Math.min(150,rc/1.87)*0.2),extra:"30g pro"});
            else if(rp>5)meals.push({n:"Greek Yogurt (150g)",cal:90,pro:15,extra:"quick protein"});
            if(rf>5&&rc>60)meals.push({n:"200g Steamed Broccoli",cal:68,pro:6,extra:"6g fiber"});
            else if(rf>3)meals.push({n:"1 tbsp Chia Seeds",cal:60,pro:2,extra:"5g fiber"});
            if(rc>100&&meals.length<2)meals.push({n:"100g Lentils",cal:116,pro:9,extra:"8g fiber"});
            const totalCal=meals.reduce((s,m)=>s+m.cal,0),totalPro=meals.reduce((s,m)=>s+m.pro,0);
            return <>{meals.map(f=>(
              <div key={f.n} style={{padding:'8px 10px',borderRadius:8,background:C.subtle,marginBottom:4}}>
                <div style={{fontWeight:600,color:C.text,fontSize:11}}>{f.n}</div>
                <div style={{fontSize:9,color:C.text3}}>{f.cal} cal · {f.pro}g pro · {f.extra}</div></div>))}
              <div style={{marginTop:8,fontSize:9,color:C.text3}}>Adds ~{totalCal} cal, {totalPro}g protein</div></>;
          })()}</>}</div>
      </AnimCard>
    </div>);
}


// MAIN APP
export default function Stride() {
  const [themeMode, setThemeMode] = useState(() => {
    try { return localStorage.getItem('stride_theme') || 'light'; } catch(e) { return 'light'; }
  });
  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try { localStorage.setItem('stride_theme', next); } catch(e) {}
  };
  const theme = THEMES[themeMode] || THEMES.light;
  C = theme; // Update the mutable C ref for all components

  const [tab, setTab] = useState("overview");
  const [dateNav, setDateNav] = useState({mode:'day',date:localDateStr()});
  const [ww, setWw] = useState(typeof window!=="undefined"?window.innerWidth:1200);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const gymSleep = useGymSleep();
  const settings = useSettings();
  const [toast, setToast] = useState({show:false,msg:''});
  const [moreOpen, setMoreOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [infoModal, setInfoModal] = useState(null);
  const showToast = (msg) => { setToast({show:true,msg}); setTimeout(()=>setToast({show:false,msg:''}), 2500); };
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const notifRef = useRef(null);
  const bellRef = useRef(null);
  const vis = useAnimateOnMount(tab);
  useEffect(()=>{const h=()=>setWw(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  // Dynamic favicon — S logo in brand gradient
  useEffect(()=>{
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><linearGradient id="fg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${theme.gradStart}"/><stop offset="100%" stop-color="${theme.gradEnd}"/></linearGradient></defs><rect width="32" height="32" rx="7" fill="url(#fg)"/><text x="16" y="23.5" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="800" fill="${theme.mode==='light'?'#fff':'#0A0C18'}">S</text></svg>`;
    const blob = new Blob([svg], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    let link = document.querySelector("link[rel*='icon']");
    if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
    link.type='image/svg+xml';link.href=url;
    return()=>URL.revokeObjectURL(url);
  },[theme]);

  // DATA LOADER
  // CONFIGURATION — Set your Cloudflare Worker URL after deploying
  const PROXY_URL = 'https://stride-mfp-proxy.robinheering.workers.dev';

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
        const todayStr = localDateStr();
        console.log('[Stride] Proxy: fetching today...');
        const [todayResp, weightResp, stepsResp] = await Promise.all([
          fetch(`${PROXY_URL}/api/diary?date=${todayStr}`).catch(() => null),
          fetch(`${PROXY_URL}/api/weight`).catch(() => null),
          fetch(`${PROXY_URL}/api/steps?date=${todayStr}`).catch(() => null),
        ]);
        if (todayResp?.ok) todayLive = await todayResp.json();
        if (stepsResp?.ok) {
          const sd = await stepsResp.json();
          if (sd?.steps > 0) { todayLive = todayLive || {}; todayLive.steps = sd.steps; }
        }
        if (weightResp?.ok) {
          const wd = await weightResp.json();
          if (wd?.entries?.length > 0) {
            todayLive = todayLive || {};
            todayLive._weightEntries = wd.entries;
          }
        }
        if (todayLive) {
          setLastSync(new Date().toISOString());
          console.log('[Stride] Today live:', todayLive.calories||0, 'cal,', todayLive.protein||0, 'g pro');
          console.log('[Stride] Weight entries:', todayLive._weightEntries?.length || 0);
          console.log('[Stride] Steps:', todayLive.steps || 0);
        }
      } catch (e) { console.log('[Stride] Proxy error:', e.message); showToast('⚠ Sync error: ' + e.message); }
    }

    // Step 3: Transform and merge
    if (jsonData?.daily?.length > 0 && jsonData.daily.some(d => (d.calories||0) > 0)) {
      const transformed = transformSyncData(jsonData, todayLive);
      if (transformed && (transformed.DAILY_W7?.length > 0 || transformed.DAILY_ALL?.length > 0)) {
        setLiveData(transformed);
        console.log('[Stride] Data ready:', transformed.DAILY_W7?.length, 'W7 days, weight:', transformed.lastW?.kg);
        showToast(`✓ Synced — ${transformed.lastW?.kg}kg · ${transformed.today?.cal||0} cal today`);
      }
    }
    setSyncing(false);
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-fetch current week's diary data from MFP proxy to backfill gymSleep
  // This ensures mobile and desktop always show the same MFP data
  useEffect(() => {
    if (!PROXY_URL) return;
    const backfillWeek = async () => {
      try {
        const today = new Date();
        const dow = today.getDay() || 7; // Mon=1..Sun=7
        const dates = [];
        for (let i = 1; i <= dow; i++) {
          const dd = new Date(today);
          dd.setDate(today.getDate() - dow + i);
          dates.push(localDateStr(dd));
        }
        console.log('[Stride] Backfilling week steps:', dates.length, 'days');
        const results = await Promise.all(dates.map(async (ds) => {
          try {
            const resp = await fetch(`${PROXY_URL}/api/diary?date=${ds}`);
            if (resp.ok) {
              const data = await resp.json();
              return { date: ds, steps: data.calories > 0 ? (data.steps || 0) : 0, cal: data.calories || 0 };
            }
          } catch(e) {}
          return { date: ds, steps: 0, cal: 0 };
        }));
        // Also try fetching steps from /api/steps for each day
        const stepResults = await Promise.all(dates.map(async (ds) => {
          try {
            const resp = await fetch(`${PROXY_URL}/api/steps?date=${ds}`);
            if (resp.ok) {
              const data = await resp.json();
              return { date: ds, steps: data.steps || 0 };
            }
          } catch(e) {}
          return { date: ds, steps: 0 };
        }));
        // Merge: use step endpoint data if available, fall back to diary endpoint
        let updated = false;
        results.forEach((r, i) => {
          const steps = stepResults[i]?.steps || r.steps;
          if (steps > 0) {
            const existing = gymSleep.getDay(r.date);
            // Only backfill if gymSleep doesn't already have steps for this day
            if (!existing.steps || existing.steps === 0) {
              gymSleep.setSteps(r.date, steps);
              updated = true;
              console.log(`[Stride] Backfilled ${r.date}: ${steps} steps`);
            }
          }
        });
        if (updated) console.log('[Stride] Week backfill complete');
      } catch(e) { console.log('[Stride] Week backfill error:', e.message); }
    };
    // Run after a short delay so initial data loads first
    const timer = setTimeout(backfillWeek, 3000);
    return () => clearTimeout(timer);
  }, []);
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
      // Overlay gym/sleep from localStorage
      const gsData = gymSleep.data || {};
      const today = new Date();
      const dayOfWeek = today.getDay() || 7;
      base.DAILY_W7.forEach((d, i) => {
        const dt = new Date(today);
        dt.setDate(today.getDate() - dayOfWeek + 1 + i); // Mon=0 offset
        const dateStr = localDateStr(dt);
        const gs = gsData[dateStr];
        if (gs) { d.gym = gs.gym || false; d.sleep = gs.sleep || 0; d.steps = gs.steps || d.steps || 0; }
      });
      base.DAILY_ALL.forEach(d => {
        // Match by dt format "Mon DD" — find the date string
        Object.keys(gsData).forEach(dateStr => {
          const mm = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const dd = new Date(dateStr+"T00:00:00");
          const fmtD = `${mm[dd.getMonth()]} ${dd.getDate()}`;
          if (d.dt === fmtD) { d.gym = gsData[dateStr].gym || d.gym; d.sleep = gsData[dateStr].sleep || d.sleep; d.steps = gsData[dateStr].steps || d.steps; }
        });
      });
      console.log('[Stride] Using', liveData ? 'LIVE' : 'FALLBACK', '| today:', base.today?.cal, 'cal | weight:', base.lastW?.kg, 'kg | W7 days:', base.DAILY_W7?.length);
      const insights = computeInsights(base);
      const popularFoods = computePopularFoods(base.FOOD_LOG || {});
      return { ...base, insights, POPULAR_FOODS: popularFoods };
    } catch (e) {
      console.error('[Stride] Data error:', e);
      const fb = buildFallbackData();
      return { ...fb, insights: { streak: 0, velocity: "0.8", proteinRate: 0, mostActive: {day:"Sun",avg:0} }, POPULAR_FOODS: [] };
    }
  }, [liveData, gymSleep.data]);

  // Lifestyle article tracking for notifications
  const [lifestyleArticles, setLifestyleArticles] = useState(LIFESTYLE_FALLBACK.articles);
  const readArticleIds = (() => { try { return JSON.parse(localStorage.getItem('stride_read_articles') || '[]'); } catch { return []; } })();

  const notifications = useMemo(() => {
    const t = D.today || {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,steps:0,sleep:0,gym:false,comp:0};
    const items = [
      {id:"n1",title:"Fiber Gap",tip:`You're at ${t.fib}g fiber — add broccoli or chia seeds to reach 20g.`,type:"action",tab:"coach",source:"AI Coach",sourceColor:C.purple},
      {id:"n2",title:t.pro>=130?"Protein On Track":"Protein Low",tip:t.pro>=130?`${t.pro}g protein today — great execution.`:`${t.pro}g protein is below 130g. Add a shake or chicken.`,type:t.pro>=130?"success":"warning",tab:"coach",source:"AI Coach",sourceColor:C.purple},
      {id:"n3",title:"Step Check",tip:`${t.steps.toLocaleString()} steps. ${t.steps>=8000?"Target hit!":"A 20-min walk adds ~2,500 steps."}`,type:t.steps>=8000?"success":"action",tab:"activity",source:"Activity",sourceColor:C.blue},
      {id:"n4",title:"Weekly Trend",tip:`Compliance at ${D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0}/100. ${(D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0)>=75?"Solid.":"Focus on protein & fiber."}`,type:(D.W_NUTR.length?D.W_NUTR[D.W_NUTR.length-1].comp:0)>=75?"success":"action",tab:"progress",source:"Progress",sourceColor:C.cyan},
      {id:"n5",title:"Weight Pace",tip:`-${D.insights.velocity}kg/wk over 3 weeks. ${parseFloat(D.insights.velocity)>=0.8?"Sustainable pace.":"Check calorie adherence."}`,type:parseFloat(D.insights.velocity)>=0.8?"success":"warning",tab:"progress",source:"Progress",sourceColor:C.cyan},
    ];
    // Add unread lifestyle articles as notifications
    const now = new Date();
    lifestyleArticles.filter(a => !readArticleIds.includes(a.id)).slice(0, 3).forEach((a, i) => {
      const isRecent = (now - new Date(a.date)) < 7 * 86400000;
      items.push({
        id: `article_${a.id}`,
        title: isRecent ? `New: ${a.title}` : a.title,
        tip: a.summary,
        type: isRecent ? "action" : "success",
        tab: "lifestyle",
        source: "Lifestyle",
        sourceColor: C.mint,
        link: a.link,
      });
    });
    return items;
  }, [D, lifestyleArticles, readArticleIds]);
  const unreadCount = notifications.filter(n => !notifRead[n.id]).length;

  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const typeColor = {warning:C.orange,success:C.mint,action:C.blue};

  const NotifPanel = () => (
    <div ref={notifRef} style={{position:'absolute',top:'100%',right:0,marginTop:8,width:340,maxHeight:460,overflowY:'auto',
      background:C.mode==='light'?'rgba(255,255,255,0.95)':C.surfaceSolid,
      border:`1px solid ${C.glassBorder}`,borderRadius:16,
      boxShadow:C.mode==='light'?'0 12px 48px rgba(0,0,0,.12)':'0 12px 48px rgba(0,0,0,.6)',
      backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
      zIndex:200,animation:'fadeSlideDown .2s ease'}}>
      <div style={{padding:'14px 16px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:12,fontWeight:700,color:C.text}}>Notifications</span>
        {unreadCount>0&&<button onClick={(e)=>{e.stopPropagation();setNotifRead(Object.fromEntries(notifications.map(n=>[n.id,true])));}} style={{fontSize:10,fontWeight:600,color:C.text3,background:'none',border:'none',cursor:'pointer',padding:'4px 8px',borderRadius:6,transition:'color .2s'}}
          onMouseEnter={e=>e.currentTarget.style.color=C.mint} onMouseLeave={e=>e.currentTarget.style.color=C.text3}>Mark all read</button>}
      </div>
      <div style={{padding:'6px 8px'}}>
        {notifications.map(n => {
          const isRead = !!notifRead[n.id];
          return (
            <button key={n.id} onClick={(e) => { e.stopPropagation(); setNotifRead(p=>({...p,[n.id]:true})); setNotifOpen(false); if(n.link){window.open(n.link,'_blank');}else{setTab(n.tab||"coach");} }}
              style={{display:'flex',alignItems:'flex-start',gap:10,width:'100%',padding:'10px 10px',borderRadius:10,border:'none',cursor:'pointer',
                background:isRead?'transparent':(C.mode==='light'?'rgba(0,0,0,0.02)':'rgba(255,255,255,0.02)'),textAlign:'left',fontFamily:'var(--sans)',transition:'background .15s',marginBottom:2}}
              onMouseEnter={e=>e.currentTarget.style.background=C.mode==='light'?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.04)'}
              onMouseLeave={e=>e.currentTarget.style.background=isRead?'transparent':(C.mode==='light'?'rgba(0,0,0,0.02)':'rgba(255,255,255,0.02)')}>
              <div style={{width:7,height:7,borderRadius:'50%',background:isRead?'transparent':typeColor[n.type]||C.mint,flexShrink:0,marginTop:5,transition:'background .2s',
                boxShadow:isRead?'none':`0 0 6px ${(typeColor[n.type]||C.mint)}44`}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                  <span style={{padding:'2px 6px',borderRadius:5,fontSize:8,fontWeight:700,letterSpacing:.4,textTransform:'uppercase',
                    background:n.sourceColor?`${n.sourceColor}18`:(C.mode==='light'?'rgba(0,0,0,0.04)':'rgba(255,255,255,0.06)'),
                    color:n.sourceColor||C.text3,border:`1px solid ${n.sourceColor?`${n.sourceColor}25`:C.border}`}}>{n.source||'System'}</span>
                  {n.id.startsWith('article_')&&<span style={{padding:'1px 5px',borderRadius:4,fontSize:7,fontWeight:800,letterSpacing:.5,textTransform:'uppercase',
                    background:'linear-gradient(135deg,#9B8CE0,#7CC4D8)',color:'#fff'}}>New Article</span>}
                </div>
                <div style={{fontSize:11,fontWeight:isRead?500:700,color:isRead?C.text3:C.text}}>{n.title}</div>
                <div style={{fontSize:10,color:C.text3,marginTop:2,lineHeight:1.4,opacity:isRead?0.6:1,
                  overflow:'hidden',textOverflow:'ellipsis',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{n.tip}</div>
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
  const NAV=[{id:"overview",icon:I.grid,label:"Overview"},{id:"nutrition",icon:I.fork,label:"Nutrition"},{id:"activity",icon:I.pulse,label:"Activity"},{id:"progress",icon:I.trend,label:"Progress"},{id:"lifestyle",icon:I.lifestyle,label:"Lifestyle"},{id:"targets",icon:I.target,label:"Targets"},{id:"coach",icon:I.sparkle,label:"AI Coach"}];
  const renderTab = () => {
    const p = {vis,isD,isT,isM,D,gymSleep,settings,setInfoModal,dateNav,setDateNav};
    switch(tab) {
      case "overview": return <OverviewTab {...p}/>;
      case "nutrition": return <NutritionTab {...p}/>;
      case "activity": return <ActivityTab {...p}/>;
      case "progress": return <ProgressTab {...p} settings={settings}/>;
      case "lifestyle": return <LifestyleTab {...p}/>;
      case "targets": return <TargetsTab {...p}/>;
      case "coach": return <CoachTab {...p} setChatOpen={setChatOpen}/>;
      default: return null;
    }
  };
  const navW = navCollapsed ? 64 : 240;
  const isDark = themeMode === 'dark';
  const ThemeToggle = ({size=32}) => (
    <button onClick={toggleTheme} title={isDark?'Switch to light mode':'Switch to dark mode'}
      style={{width:size,height:size,borderRadius:size/2.5,border:`1px solid ${C.border}`,
        background:C.glass,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text2,transition:'all .2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.mint;e.currentTarget.style.color=C.mint;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text2;}}>
      {isDark
        ? <svg width={size*.45} height={size*.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        : <svg width={size*.45} height={size*.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
    </button>
  );
  return (
  <ThemeContext.Provider value={{theme,themeMode,toggleTheme}}>
    <div style={{minHeight:'100vh',background:C.bgGradient||C.bg,color:C.text,fontFamily:'var(--sans)',display:isD?'flex':'block',transition:'background .4s, color .4s',position:'relative',overflow:'hidden'}}>
      {/* Ambient gradient blobs */}
      {C.bgAccent1 && <>
        <div style={{position:'fixed',top:'-12%',right:'-8%',width:'45vw',height:'45vw',borderRadius:'50%',background:C.bgAccent1,filter:'blur(90px)',pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'fixed',bottom:'-12%',left:'-8%',width:'40vw',height:'40vw',borderRadius:'50%',background:C.bgAccent2,filter:'blur(90px)',pointerEvents:'none',zIndex:0}}/>
        <div style={{position:'fixed',top:'35%',left:'25%',width:'30vw',height:'30vw',borderRadius:'50%',background:C.bgAccent3||'transparent',filter:'blur(100px)',pointerEvents:'none',zIndex:0}}/>
        {!isDark && <div style={{position:'fixed',top:'10%',right:'30%',width:'20vw',height:'20vw',borderRadius:'50%',background:'rgba(140,120,210,0.035)',filter:'blur(80px)',pointerEvents:'none',zIndex:0}}/>}
      </>}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root{--sans:'Plus Jakarta Sans',-apple-system,sans-serif;--mono:'JetBrains Mono',monospace;}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:${C.scrollThumb};border-radius:3px;}
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0;} 100%{background-position:-200% 0;} }
        @keyframes pulse { 0%,100%{opacity:0.3;} 50%{opacity:1;} }
      `}</style>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-10%',left:'20%',width:600,height:600,borderRadius:'50%',
          background:`radial-gradient(circle,${isDark?C.mintSoft:'rgba(184,168,240,0.08)'} 0%,transparent 70%)`,filter:'blur(40px)'}}/>
        <div style={{position:'absolute',bottom:'-15%',right:'5%',width:500,height:500,borderRadius:'50%',
          background:`radial-gradient(circle,${isDark?'rgba(77,160,255,.03)':'rgba(87,255,216,0.06)'} 0%,transparent 70%)`,filter:'blur(40px)'}}/></div>

      {isD && (
        <nav style={{width:navW,minHeight:'100vh',background:C.navBg,borderRight:`1px solid ${C.navBorder}`,
          backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
          padding:navCollapsed?'20px 8px':'20px 12px',display:'flex',flexDirection:'column',position:'sticky',top:0,zIndex:10,
          transition:'width .25s cubic-bezier(.4,0,.2,1), padding .25s cubic-bezier(.4,0,.2,1), background .4s',overflow:'hidden'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:navCollapsed?'0':'0 4px',justifyContent:navCollapsed?'center':'space-between'}}>
            {navCollapsed ? (
              <div style={{position:'relative',cursor:'pointer'}}
                onClick={()=>setNavCollapsed(false)} title="Expand sidebar">
                <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,
                  color:C.mode==='light'?'#2A2C42':'#0A0C18',boxShadow:`0 2px 12px ${C.mint}22`,transition:'transform .2s,box-shadow .2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow=`0 4px 20px ${C.mint}55`;}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow=`0 2px 12px ${C.mint}33`;}}>
                  S
                </div>
              </div>
            ) : (<>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:900,color:C.mode==='light'?'#fff':'#0A0C18',flexShrink:0,boxShadow:`0 2px 12px ${C.mint}22`}}>S</div>
                <div><div style={{fontSize:15,fontWeight:800,letterSpacing:-0.3}}>Stride</div><div style={{fontSize:9,color:C.text3,fontWeight:600}}>Week {D.currentWeek} · Phase {settings.phase}</div></div>
              </div>
              <button onClick={()=>setNavCollapsed(true)} title="Close sidebar"
                style={{width:32,height:32,borderRadius:8,border:'none',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.text3,transition:'all .15s',flexShrink:0}}
                onMouseEnter={e=>{e.currentTarget.style.background=isDark?'rgba(184,168,240,0.06)':'rgba(124,107,196,0.06)';e.currentTarget.style.color=C.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.text3;}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
              </button>
            </>)}
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
            {NAV.map(n=>{const act=tab===n.id;
              return (<button key={n.id} onClick={()=>setTab(n.id)} title={navCollapsed?n.label:""}
                style={{display:'flex',alignItems:'center',gap:12,width:'100%',padding:navCollapsed?'10px 0':'10px 12px',justifyContent:navCollapsed?'center':'flex-start',
                  borderRadius:10,border:'none',
                  background:act?(isDark?'rgba(184,168,240,0.08)':'rgba(124,107,196,0.08)'):'transparent',
                  color:act?C.text:C.text2,
                  fontSize:13,fontWeight:act?600:400,cursor:'pointer',transition:'all .15s',fontFamily:'var(--sans)',textAlign:'left'}}
                onMouseEnter={e=>{if(!act)e.currentTarget.style.background=isDark?'rgba(184,168,240,0.04)':'rgba(124,107,196,0.04)';}}
                onMouseLeave={e=>{if(!act)e.currentTarget.style.background='transparent';}}>
                <span style={{opacity:act?1:0.7}}>{n.icon}</span>{!navCollapsed&&<span>{n.label}</span>}
              </button>);
            })}
          </div>
          {navCollapsed ? (
            <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center',marginTop:8}}>
            </div>
          ) : (<>
            <div style={{padding:'14px 12px',borderRadius:14,
              background:`linear-gradient(135deg,${C.mintSoft},transparent)`,border:`1px solid ${C.mintSoft}`,backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)'}}>
              <div style={{fontSize:9,color:C.text3,fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Overall Progress</div>
              <div style={{fontSize:24,fontWeight:900,fontFamily:'var(--mono)',color:C.mint}}>-{D.lost}kg</div>
              <div style={{fontSize:11,color:C.text2,marginTop:2}}>of 12.5 kg goal</div>
              <div style={{height:4,borderRadius:2,background:C.mode==='light'?C.track:C.border,marginTop:10,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(parseFloat(D.lost)/12.5*100).toFixed(0)}%`,borderRadius:2,background:`linear-gradient(90deg,${C.gradStart},${C.gradEnd})`,transition:'width 1s ease'}}/></div>
            </div>
          </>)}
        </nav>
      )}

      <div style={{flex:1,position:'relative',zIndex:1,minHeight:'100vh'}}>
        {!isD && (
          <header style={{padding:'14px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:900,color:C.mode==='light'?'#fff':'#0A0C18',boxShadow:`0 4px 16px ${C.mint}33`}}>S</div>
              <div><div style={{fontSize:10,color:C.text3,fontWeight:600}}>Week {D.currentWeek} · Phase 1</div><div style={{fontSize:16,fontWeight:800,letterSpacing:-.3}}>Stride</div></div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <ThemeToggle size={32}/>
              <button onClick={handleRefresh} title="Refresh" style={{width:32,height:32,borderRadius:10,background:C.glass,border:`1px solid ${C.glassBorder}`,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,display:'flex',alignItems:'center',justifyContent:'center',color:syncing?C.mint:C.text3,cursor:'pointer'}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:syncing?'spin 1s linear infinite':'none'}}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></button>
              <div style={{position:'relative'}}>
                <button ref={bellRef} onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:12,background:C.glass,border:`1px solid ${C.glassBorder}`,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative',cursor:'pointer'}}>
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
                {tab==="overview"?"Dashboard":tab==="nutrition"?"Nutrition Tracking":tab==="activity"?"Activity & Training":tab==="progress"?"Progress Analytics":tab==="lifestyle"?"Lifestyle & Fitness":tab==="coach"?"AI Coach":"Phase Targets"}</div>
              <div style={{fontSize:12,color:C.text3,marginTop:2}}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                {isLive?<span style={{marginLeft:8,fontSize:10,color:C.mint,opacity:0.8}}>· Live data{dataAge!==null?` (${dataAge}h ago)`:''}</span>
                :<span style={{marginLeft:8,fontSize:10,color:C.orange,opacity:0.9}}>· Demo data — sync needed</span>}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{padding:'8px 14px',borderRadius:12,background:C.glass,border:`1px solid ${C.glassBorder}`,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,fontSize:12,fontWeight:600,color:C.text2}}>Phase 1 — Fat Loss</div>
              <ThemeToggle/>
              <button onClick={handleRefresh} title="Refresh stats" style={{width:36,height:36,borderRadius:12,background:C.glass,border:`1px solid ${C.glassBorder}`,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,display:'flex',alignItems:'center',justifyContent:'center',color:syncing?C.mint:C.text2,cursor:'pointer',transition:'color .2s'}}
                onMouseEnter={e=>{if(!syncing)e.currentTarget.style.color=C.mint;}} onMouseLeave={e=>{if(!syncing)e.currentTarget.style.color=C.text2;}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{animation:syncing?'spin 1s linear infinite':'none'}}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              </button>
              <div style={{position:'relative'}}>
                <button ref={bellRef} onClick={()=>setNotifOpen(!notifOpen)} style={{width:36,height:36,borderRadius:12,background:C.glass,border:`1px solid ${C.glassBorder}`,backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,display:'flex',alignItems:'center',justifyContent:'center',color:C.text2,position:'relative',cursor:'pointer'}}>
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
        <nav style={{position:'fixed',bottom:0,left:0,right:0,
          background:isDark?'rgba(10,12,24,0.75)':'rgba(248,248,255,0.75)',
          backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
          borderTop:`1px solid ${isDark?'rgba(184,168,240,0.06)':'rgba(255,255,255,0.50)'}`,
          boxShadow:isDark?'0 -4px 24px rgba(0,0,0,0.35)':'0 -2px 16px rgba(120,108,180,0.06)',
          padding:'6px 4px',paddingBottom:'max(6px, env(safe-area-inset-bottom))',zIndex:100,display:'flex',justifyContent:'space-around'}}>
          {/* Primary tabs — first 4 + More */}
          {NAV.slice(0,4).map(n=>{const act=tab===n.id;
            return (<button key={n.id} onClick={()=>{setTab(n.id);setMoreOpen(false);}} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 6px',border:'none',background:'none',cursor:'pointer',color:act?C.mint:C.text3,transition:'color .2s',position:'relative',fontFamily:'var(--sans)',flex:1}}>
              {act&&<div style={{position:'absolute',top:-6,width:20,height:3,borderRadius:2,background:C.mint,boxShadow:`0 0 10px ${C.mint}55`}}/>}
              <div style={{transform:act?'scale(1.1)':'scale(1)',transition:'transform .2s'}}>{n.icon}</div>
              <span style={{fontSize:8,fontWeight:act?800:500,letterSpacing:.2}}>{n.label}</span>
            </button>);
          })}
          {/* More button */}
          {(()=>{const moreActive=NAV.slice(4).some(n=>n.id===tab);
            return (<div style={{position:'relative',flex:1,display:'flex',justifyContent:'center'}}>
              <button onClick={()=>setMoreOpen(!moreOpen)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'7px 6px',border:'none',background:'none',cursor:'pointer',color:moreActive?C.mint:C.text3,transition:'color .2s',position:'relative',fontFamily:'var(--sans)'}}>
                {moreActive&&<div style={{position:'absolute',top:-6,width:20,height:3,borderRadius:2,background:C.mint,boxShadow:`0 0 10px ${C.mint}55`}}/>}
                <div style={{transform:moreOpen?'rotate(90deg)':'rotate(0deg)',transition:'transform .2s'}}>{I.more}</div>
                <span style={{fontSize:8,fontWeight:moreActive?800:500,letterSpacing:.2}}>More</span>
              </button>
              {/* More dropdown */}
              {moreOpen&&<>
                <div onClick={()=>setMoreOpen(false)} style={{position:'fixed',inset:0,zIndex:98}}/>
                <div style={{position:'absolute',bottom:'calc(100% + 12px)',right:-8,
                  background:isDark?'rgba(16,18,36,0.92)':'rgba(248,248,255,0.96)',
                  border:`1px solid ${C.glassBorder}`,borderRadius:16,padding:8,minWidth:170,zIndex:99,
                  backdropFilter:`blur(${C.glassBlur}px)`,WebkitBackdropFilter:`blur(${C.glassBlur}px)`,
                  boxShadow:isDark?'0 -8px 32px rgba(0,0,0,0.5)':'0 -8px 32px rgba(120,108,180,0.12)',
                  animation:'fadeSlideDown .15s ease'}}>
                  {NAV.slice(4).map(n=>{const act=tab===n.id;
                    return (<button key={n.id} onClick={()=>{setTab(n.id);setMoreOpen(false);}}
                      style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'10px 12px',
                        borderRadius:10,border:'none',background:act?C.mintSoft:'transparent',
                        color:act?C.mint:C.text2,fontSize:12,fontWeight:act?700:500,cursor:'pointer',
                        fontFamily:'var(--sans)',transition:'all .15s'}}
                      onMouseEnter={e=>{if(!act)e.currentTarget.style.background=C.subtle;}}
                      onMouseLeave={e=>{if(!act)e.currentTarget.style.background='transparent';}}>
                      <span style={{opacity:act?1:0.7}}>{n.icon}</span>{n.label}
                    </button>);
                  })}
                </div>
              </>}
            </div>);
          })()}
        </nav>
      )}
      <SyncToast message={toast.msg} show={toast.show}/>

      {/* Global AI Coach Chat — slide-in panel */}
      {(()=>{
        const today = D.today || {cal:0,pro:0,carb:0,fat:0,fib:0,sug:0,steps:0,sleep:0,gym:false,comp:0};
        const remaining = {cal:Math.max(0,1400-today.cal),pro:Math.max(0,140-today.pro),fib:Math.max(0,25-today.fib),steps:Math.max(0,8000-today.steps)};
        const contextPrompt = `You are a concise, expert fitness coach for Robin on a 14-week fat loss program. Phase 1 (current): aggressive fat loss while protecting muscle.
CURRENT DATA: Today: ${today.cal} cal, ${today.pro}g protein, ${today.carb}g carbs, ${today.fat}g fat, ${today.fib}g fiber, ${today.sug}g sugar, ${today.steps} steps, ${today.sleep}h sleep, gym: ${today.gym?"yes":"no"}.
Targets: 1300-1500 cal, 130-160g protein, 40-70g carbs, 40-55g fat, 20-30g fiber, <20g sugar, 8000+ steps.
Weight: ${D.lastW?.kg}kg (started 80.5, goal 68, lost ${D.lost}kg). Week ${D.lastW?.week+1}/14. Velocity: -${D.insights.velocity}kg/wk.
Be concise (2-4 sentences), practical, reference actual numbers. Suggest specific foods with macros when relevant.`;
        const getOfflineTip = (q) => {
          const ql = q.toLowerCase();
          if (ql.includes("eat")||ql.includes("dinner")||ql.includes("meal")||ql.includes("food"))
            return `You still need ~${remaining.cal} cal and ${remaining.pro}g protein. Try: 150g salmon (280cal, 30g pro) + 200g broccoli (68cal, 6g fiber).`;
          if (ql.includes("protein")) return `You're at ${today.pro}g protein (target: 130-160g). ${today.pro>=130?"On track!":"Add a whey shake (+24g) or 150g chicken (+47g)."}`;
          if (ql.includes("step")||ql.includes("walk")) return `${today.steps.toLocaleString()} steps. ${today.steps>=8000?"Target hit!":"Need "+(8000-today.steps)+" more. A 20-min walk adds ~2,500."}`;
          if (ql.includes("weight")||ql.includes("progress")) return `Lost ${D.lost}kg in ${D.lastW?.week+1} weeks. At -${D.insights.velocity}kg/week, ~${Math.ceil((D.lastW?.kg-68)/parseFloat(D.insights.velocity||0.8))} weeks to 68kg.`;
          return `Today: ${today.cal} cal, ${today.pro}g pro, ${today.fib}g fiber, ${today.steps} steps. Compliance: ${today.comp}/100. Keep at it.`;
        };
        const sendChat = async (text) => {
          if (!text.trim()) return;
          const userMsg = {role:"user",content:text};
          setChatMessages(prev => [...prev, userMsg]);
          setChatLoading(true);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          try {
            const resp = await fetch("https://api.anthropic.com/v1/messages", {
              method:"POST", headers:{"Content-Type":"application/json"}, signal: controller.signal,
              body: JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:contextPrompt,
                messages:[...chatMessages,userMsg].map(m=>({role:m.role,content:m.content}))}),
            });
            clearTimeout(timeout);
            const data = await resp.json();
            const reply = data.content?.map(i=>i.text||"").join("");
            setChatMessages(prev => [...prev, {role:"assistant",content:reply||getOfflineTip(text)}]);
          } catch (e) {
            clearTimeout(timeout);
            setChatMessages(prev => [...prev, {role:"assistant",content:getOfflineTip(text)}]);
          }
          setChatLoading(false);
        };
        const chatRef = useRef(null);
        const inputRef = useRef(null);
        const [chatInput, setChatInput] = useState("");
        const quickQ = ["What should I eat?","How's my progress?","Am I on target?","Sleep tips"];

        return (<>
          {/* FAB — always visible, bottom-right */}
          {!chatOpen && (
            <button onClick={()=>setChatOpen(true)}
              style={{position:'fixed',bottom:isD?24:80,right:isD?24:16,zIndex:90,
                width:52,height:52,borderRadius:16,border:'none',cursor:'pointer',
                background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
                color:C.mode==='light'?'#fff':'#0A0C18',
                boxShadow:`0 4px 20px ${C.mint}44, 0 8px 32px rgba(0,0,0,0.15)`,
                display:'flex',alignItems:'center',justifyContent:'center',
                transition:'transform .2s, box-shadow .2s',animation:'fadeIn .3s ease'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.08)';e.currentTarget.style.boxShadow=`0 6px 28px ${C.mint}66, 0 12px 40px rgba(0,0,0,0.2)`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow=`0 4px 20px ${C.mint}44, 0 8px 32px rgba(0,0,0,0.15)`;}}>
              {I.sparkle}
            </button>
          )}

          {/* Chat Panel — slides in from right like Gemini */}
          {chatOpen && <>
            <div onClick={()=>setChatOpen(false)} style={{position:'fixed',inset:0,background:C.overlayBg,backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',zIndex:200}}/>
            <div style={{position:'fixed',top:0,right:0,bottom:0,width:isD?420:isT?380:'100%',maxWidth:'100vw',zIndex:201,
              background:isDark?'rgba(10,12,24,0.97)':'rgba(245,245,255,0.97)',
              backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
              borderLeft:`1px solid ${C.glassBorder}`,
              boxShadow:isDark?'-8px 0 40px rgba(0,0,0,0.5)':'-8px 0 40px rgba(120,108,180,0.10)',
              display:'flex',flexDirection:'column',animation:'fadeIn .2s ease'}}>
              {/* Header */}
              <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:32,height:32,borderRadius:10,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
                    display:'flex',alignItems:'center',justifyContent:'center'}}>{I.sparkle}</div>
                  <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>AI Coach</div>
                  <div style={{fontSize:10,color:C.text3}}>Context-aware fitness assistant</div></div>
                </div>
                <button onClick={()=>setChatOpen(false)} style={{width:32,height:32,borderRadius:10,border:`1px solid ${C.border}`,background:C.subtle,color:C.text3,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>✕</button>
              </div>
              {/* Messages */}
              <div ref={chatRef} style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:10}}>
                {chatMessages.length===0 && (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flex:1,gap:16,padding:'40px 0'}}>
                    <div style={{width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`,
                      display:'flex',alignItems:'center',justifyContent:'center',opacity:0.6}}>{I.sparkle}</div>
                    <div style={{fontSize:13,color:C.text3,textAlign:'center',lineHeight:1.5,maxWidth:260}}>Ask me anything about your nutrition, training, or progress. I have full context on your data.</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
                      {quickQ.map(q=>(<button key={q} onClick={()=>{sendChat(q);setChatInput("");}}
                        style={{padding:'7px 12px',borderRadius:10,border:`1px solid ${C.border}`,background:C.subtle,color:C.text2,fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:'var(--sans)',transition:'border-color .2s'}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor=C.mintMed} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{q}</button>))}
                    </div>
                  </div>
                )}
                {chatMessages.map((m,i)=>(
                  <div key={i} style={{alignSelf:m.role==="user"?'flex-end':'flex-start',maxWidth:'85%',padding:'10px 14px',
                    borderRadius:m.role==="user"?'16px 16px 4px 16px':'16px 16px 16px 4px',
                    background:m.role==="user"?C.mintSoft:C.subtle,
                    border:`1px solid ${m.role==="user"?C.mintMed:C.border}`,
                    fontSize:12,lineHeight:1.55,color:m.role==="user"?C.mint:C.text2,whiteSpace:'pre-wrap'}}>
                    {m.content}
                  </div>
                ))}
                {chatLoading&&<div style={{alignSelf:'flex-start',padding:'10px 14px',borderRadius:16,background:C.subtle,fontSize:12,color:C.text3,display:'flex',gap:4,alignItems:'center'}}>
                  <span style={{animation:'pulse 1.2s ease infinite'}}>●</span> Thinking...</div>}
              </div>
              {/* Input */}
              <div style={{padding:'12px 20px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{display:'flex',gap:8}}>
                  <input ref={inputRef} value={chatInput} onChange={e=>setChatInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat(chatInput);setChatInput("");}}}
                    placeholder="Ask your coach..." autoFocus
                    style={{flex:1,padding:'12px 16px',borderRadius:14,border:`1px solid ${C.border}`,background:C.subtle,color:C.text,fontSize:13,fontFamily:'var(--sans)',outline:'none'}}/>
                  <button onClick={()=>{sendChat(chatInput);setChatInput("");}} disabled={chatLoading||!chatInput.trim()}
                    style={{padding:'12px 18px',borderRadius:14,border:'none',cursor:'pointer',
                      background:chatInput.trim()?`linear-gradient(135deg,${C.gradStart},${C.gradEnd})`:C.border,
                      color:C.mode==='light'?'#fff':'#0A0C18',fontSize:12,fontWeight:700,fontFamily:'var(--sans)',opacity:chatLoading?0.5:1}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </>}
        </>);
      })()}
      {infoModal && <InfoModal id={infoModal} onClose={()=>setInfoModal(null)}/>}
    </div>
  </ThemeContext.Provider>
  );
}
