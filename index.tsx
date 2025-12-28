
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// --- CONSTANTS & TYPES ---
const ASHDOD = { name: "Ashdod, Israël", lat: 31.8044, lng: 34.6553 };
const HEBREW_DAYS = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

interface Zman {
  id: string;
  labelHebrew: string;
  time: string;
  fullTime: Date;
}

// --- API SERVICES ---
async function fetchAllData(date: Date) {
  const isoDate = date.toISOString().split('T')[0];
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();

  const [solarRes, hebDateRes, dailyRes] = await Promise.all([
    fetch(`https://api.sunrisesunset.io/json?lat=${ASHDOD.lat}&lng=${ASHDOD.lng}&date=${isoDate}`).then(r => r.json()),
    fetch(`https://www.hebcal.com/converter?cfg=json&gy=${y}&gm=${m}&gd=${d}&g2h=1`).then(r => r.json()),
    fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${y}&month=${m}&ss=on&mf=on&c=off&geo=none&F=on&d=on&heb=on`).then(r => r.json())
  ]);

  const solar = solarRes.results;
  const items = dailyRes.items || [];
  const daf = items.find((i: any) => i.category === 'dafyomi')?.hebrew || 'לא זמין';
  const parasha = items.find((i: any) => i.category === 'parashat')?.hebrew || '';

  return { solar, hebrewDate: hebDateRes, daf, parasha };
}

// --- UTILS ---
function parseTime(timeStr: string, baseDate: Date): Date {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes, seconds] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  const d = new Date(baseDate);
  d.setHours(hours, minutes, seconds, 0);
  return d;
}

function calculateZmanim(solar: any, baseDate: Date): Zman[] {
  const sunrise = parseTime(solar.sunrise, baseDate);
  const sunset = parseTime(solar.sunset, baseDate);
  const dawn = parseTime(solar.dawn, baseDate);
  const dusk = parseTime(solar.dusk, baseDate);
  const noon = parseTime(solar.solar_noon, baseDate);
  const shaah = (sunset.getTime() - sunrise.getTime()) / 12;

  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return [
    { id: 'alot', labelHebrew: 'עלות השחר', fullTime: dawn, time: fmt(dawn) },
    { id: 'sunrise', labelHebrew: 'נץ החמה', fullTime: sunrise, time: fmt(sunrise) },
    { id: 'shema', labelHebrew: 'סוף זמן שמע', fullTime: new Date(sunrise.getTime() + 3 * shaah), time: fmt(new Date(sunrise.getTime() + 3 * shaah)) },
    { id: 'tefillah', labelHebrew: 'סוף זמן תפילה', fullTime: new Date(sunrise.getTime() + 4 * shaah), time: fmt(new Date(sunrise.getTime() + 4 * shaah)) },
    { id: 'chatzot', labelHebrew: 'חצות היום', fullTime: noon, time: fmt(noon) },
    { id: 'mincha_g', labelHebrew: 'מנחה גדולה', fullTime: new Date(noon.getTime() + 0.5 * shaah), time: fmt(new Date(noon.getTime() + 0.5 * shaah)) },
    { id: 'plag', labelHebrew: 'פלג המנחה', fullTime: new Date(sunrise.getTime() + 10.75 * shaah), time: fmt(new Date(sunrise.getTime() + 10.75 * shaah)) },
    { id: 'shkia', labelHebrew: 'שקיעה', fullTime: sunset, time: fmt(sunset) },
    { id: 'tzeit', labelHebrew: 'צאת הכוכבים', fullTime: dusk, time: fmt(dusk) }
  ];
}

// --- MAIN APP ---
const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [zmanim, setZmanim] = useState<Zman[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchAllData(new Date());
      setData(res);
      setZmanim(calculateZmanim(res.solar, new Date()));
      setLoading(false);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [load]);

  const nextZman = useMemo(() => zmanim.find(z => z.fullTime > now) || null, [zmanim, now]);

  const countdown = useMemo(() => {
    if (!nextZman) return null;
    const diff = nextZman.fullTime.getTime() - now.getTime();
    if (diff > 0 && diff <= 1800000) { // 30 minutes
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return null;
  }, [nextZman, now]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-yellow-400 font-bold tracking-widest">ASHDOD DIGITAL...</div>;

  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  return (
    <div className="h-screen flex flex-col items-center justify-between py-4">
      {/* Header */}
      <div className="w-full px-8 flex justify-between items-center text-sm border-b border-white/10 pb-2">
        <div className="flex gap-4 items-center">
          <span className="text-yellow-400 digital-font font-bold text-lg">{timeStr.slice(0, 5)}</span>
          <span className="opacity-20">|</span>
          <span className="text-blue-400 font-bold">{HEBREW_DAYS[now.getDay()]} ({data.parasha})</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="text-blue-300 font-bold">{data.hebrewDate.hebrew}</span>
          <span className="opacity-20">|</span>
          <span className="opacity-60">{dateStr}</span>
          <span className="opacity-20">|</span>
          <span className="text-green-400 font-bold">דף יומי: {data.daf}</span>
        </div>
      </div>

      {/* Center Display */}
      <div className="flex flex-col items-center flex-grow justify-center w-full">
        {nextZman && (
          <div className="mb-4 text-center">
            <div className="text-white/20 uppercase tracking-[0.4em] text-[10px] font-bold mb-1">PROCHAIN HORAIRE</div>
            <div className="text-3xl font-bold text-white/90">{nextZman.labelHebrew}</div>
          </div>
        )}

        <div className="relative group">
          <div className="text-yellow-400/40 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 text-center">ASHOD LOCAL TIME</div>
          <h1 className="text-[14rem] md:text-[20rem] leading-none font-bold digital-font text-white glow-text select-none tracking-tighter">
            {timeStr}
          </h1>
          
          {countdown && (
            <div className="mt-8 flex flex-col items-center animate-pulse">
              <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-2">Attention: {nextZman?.labelHebrew} imminent</div>
              <div className="text-7xl digital-font font-bold text-red-500 bg-red-500/10 px-8 py-3 rounded-2xl border border-red-500/30">
                {countdown}
              </div>
            </div>
          )}

          {!countdown && (
            <div className="flex gap-3 justify-center mt-8">
              <div className="w-12 h-1 bg-yellow-400"></div>
              <div className="w-12 h-1 bg-yellow-400"></div>
            </div>
          )}
        </div>
      </div>

      {/* Zmanim Ribbon */}
      <div className="w-full px-4 overflow-x-auto pb-6">
        <div className="flex gap-3 justify-start md:justify-center min-w-max">
          {zmanim.map(z => (
            <div key={z.id} className={`zman-card rounded-xl px-5 py-4 flex flex-col items-center min-w-[130px] ${nextZman?.id === z.id ? 'active-zman' : ''}`}>
              <span className="text-[10px] text-white/40 font-bold mb-1">{z.labelHebrew}</span>
              <span className="text-xl digital-font font-bold text-white/90">{z.time.slice(0, 5)}</span>
              <span className="text-[9px] digital-font text-white/20 mt-1">{z.time.slice(-2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] text-white/10 uppercase tracking-widest mb-2">
        Ashdod • Method Gra • GPS: {ASHDOD.lat}, {ASHDOD.lng}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
