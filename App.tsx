
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SolarData, HebrewDateData, Zman } from './types';
import { ASHDOD_LOCATION } from './constants';
import { fetchSolarData, fetchHebrewDate, fetchDailyData } from './services/apiService';
import { calculateZmanim } from './utils/zmanimCalculator';

const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [hebrewDate, setHebrewDate] = useState<HebrewDateData | null>(null);
  const [extraData, setExtraData] = useState({ daf: '', dafHebrew: '', parasha: '', parashaHebrew: '' });
  const [zmanim, setZmanim] = useState<Zman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayOfWeekHebrew, setDayOfWeekHebrew] = useState('');

  const hebrewDays = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

  const loadData = useCallback(async (targetDate: Date) => {
    try {
      setLoading(true);
      const isoDate = targetDate.toISOString().split('T')[0];
      
      const [solar, hebDate, daily] = await Promise.all([
        fetchSolarData(ASHDOD_LOCATION.lat, ASHDOD_LOCATION.lng, isoDate),
        fetchHebrewDate(targetDate),
        fetchDailyData(targetDate)
      ]);

      setSolarData(solar);
      setHebrewDate(hebDate);
      setExtraData(daily);
      setZmanim(calculateZmanim(solar, targetDate));
      setDayOfWeekHebrew(hebrewDays[targetDate.getDay()]);
    } catch (err) {
      setError("שגיאה בטעינת נתונים");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [loadData]);

  // Find the next upcoming zman
  const nextZmanIndex = useMemo(() => {
    if (!zmanim.length) return -1;
    const sorted = [...zmanim].sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime());
    const next = sorted.find(z => z.fullTime > now);
    return next ? zmanim.findIndex(z => z.id === next.id) : -1;
  }, [zmanim, now]);

  const nextZman = nextZmanIndex !== -1 ? zmanim[nextZmanIndex] : null;

  // Calculate countdown for next zman if within 30 minutes
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

  if (loading && !solarData) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const timeString = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden select-none">
      {/* TOP HEADER - AGRANDI (x2) */}
      <header className="w-full h-28 px-10 flex items-center justify-between border-b border-white/5 bg-black">
        <div className="flex items-center gap-10">
          <span className="text-yellow-400 digital-font font-bold text-5xl">{timeString.slice(0, 5)}</span>
          <div className="flex items-center gap-6 text-2xl font-black">
            <span className="opacity-20">|</span>
            <span className="bg-white/10 px-4 py-2 rounded text-white">{dayOfWeekHebrew}</span>
            <span className="opacity-20">|</span>
            <span className="text-blue-400">{hebrewDate?.hebrew}</span>
            <span className="opacity-20">|</span>
            <div className="flex gap-3">
              <span className="text-blue-500">{extraData.parashaHebrew}</span>
            </div>
            <span className="opacity-20">|</span>
            <span className="text-white/40">{dateString}</span>
          </div>
        </div>

        <div className="flex items-center gap-6 text-2xl font-black">
          <span className="opacity-20">|</span>
          <span className="text-green-400">דף יומי: <span className="mr-2">{extraData.dafHebrew}</span></span>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-4">
        {!countdown ? (
          <div className="text-center">
            {nextZman && (
              <div className="mb-10">
                <div className="text-white/20 uppercase tracking-[0.4em] text-xl font-bold mb-4">הזמן הבא</div>
                <div className="text-yellow-400 text-8xl font-black mb-12">
                   {nextZman.labelHebrew} ב-{nextZman.time.slice(0, 5)}
                </div>
              </div>
            )}
            <div className="text-white/30 text-2xl font-bold tracking-[0.6em] uppercase mb-8">
              שעה נוכחית
            </div>
            <div className="digital-font text-[18vw] leading-none font-black tracking-tighter glow-text">
              {timeString}
            </div>
          </div>
        ) : (
          /* DECOMPTE MASSIF */
          <div className="flex flex-col items-center justify-center animate-pulse">
            <div className="text-red-500 text-3xl font-black uppercase tracking-[0.5em] mb-8">
              {nextZman?.labelHebrew} בעוד
            </div>
            <div className="text-[20rem] md:text-[25rem] leading-none digital-font font-black text-red-500 [text-shadow:0_0_50px_rgba(239,68,68,0.5)]">
              {countdown}
            </div>
            <div className="mt-12 text-5xl text-white/40 digital-font font-bold">
              שעה: {timeString}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER ZMANIM GRID */}
      <footer className="w-full pb-10 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-row-reverse gap-4 justify-center overflow-x-auto no-scrollbar pb-4">
          {[...zmanim].map((z) => {
            const isActive = nextZman?.id === z.id;
            return (
              <div 
                key={z.id} 
                className={`zman-card min-w-[160px] p-6 rounded-2xl flex flex-col items-center justify-center border transition-all ${isActive ? 'active-zman border-yellow-500 bg-yellow-500/10' : 'border-white/10'}`}
              >
                <span className="text-sm font-bold text-white/40 mb-3 whitespace-nowrap">
                  {z.labelHebrew}
                </span>
                <span className={`digital-font text-3xl font-bold ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                  {z.time.slice(0, 5)}
                </span>
                <span className="text-xs digital-font text-white/20 mt-1">{z.time.slice(-2)}</span>
              </div>
            );
          })}
        </div>
        <div className="w-full text-center text-[10px] text-white/10 uppercase tracking-[0.5em] mt-4">
          COORDINATES: {ASHDOD_LOCATION.lat}, {ASHDOD_LOCATION.lng} • METHOD GRA
        </div>
      </footer>
    </div>
  );
};

export default App;
