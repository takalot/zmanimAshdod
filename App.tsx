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
  const prevZman = nextZmanIndex > 0 ? zmanim[nextZmanIndex - 1] : null;

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
      {/* TOP HEADER */}
      <header className="w-full h-14 px-8 flex items-center justify-between border-b border-white/5 bg-black">
        <div className="flex items-center gap-6">
          <span className="text-yellow-400 digital-font font-bold text-2xl">{timeString}</span>
          <div className="flex items-center gap-4 text-sm font-bold">
            <span className="opacity-20">|</span>
            <span className="bg-white/10 px-3 py-1 rounded text-white">{dayOfWeekHebrew}</span>
            <span className="opacity-20">|</span>
            <span className="text-blue-400">{hebrewDate?.hebrew}</span>
            <span className="opacity-20">|</span>
            <span className="text-white/40">{dateString}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <span className="opacity-20">|</span>
          <span className="text-green-400">דף יומי: <span className="mr-1">{extraData.dafHebrew}</span></span>
        </div>
      </header>

      {/* MAIN BODY */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-4">
        <div className="text-center mb-8">
          {prevZman && (
            <div className="text-white/30 text-2xl font-bold mb-2">
              {prevZman.labelHebrew} עבר
            </div>
          )}
          {nextZman && (
            <div className="text-yellow-400 text-5xl font-black mb-4">
              הזמן הבא: {nextZman.labelHebrew} ב-{nextZman.time.slice(0, 5)}
            </div>
          )}
          <div className="text-white/40 text-lg font-bold tracking-widest uppercase">
            מצב שעון נוכחי
          </div>
        </div>

        <div className="digital-font text-[18vw] leading-none font-black tracking-tighter glow-text">
          {timeString}
        </div>
      </main>

      {/* FOOTER ZMANIM GRID */}
      <footer className="w-full pb-8 px-4">
        <div className="max-w-[1400px] mx-auto grid grid-cols-4 md:grid-cols-9 gap-3">
          {[...zmanim].reverse().map((z) => {
            const isActive = nextZman?.id === z.id;
            return (
              <div 
                key={z.id} 
                className={`zman-card p-4 rounded-lg flex flex-col items-center justify-center border transition-all ${isActive ? 'active-zman border-yellow-500/50 bg-yellow-500/5' : 'border-white/10'}`}
              >
                <span className="text-[11px] font-bold text-white/40 mb-2 whitespace-nowrap">
                  {z.labelHebrew}
                </span>
                <span className={`digital-font text-xl font-bold ${isActive ? 'text-yellow-400' : 'text-white'}`}>
                  {z.time}
                </span>
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};

export default App;