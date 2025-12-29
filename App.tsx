import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SolarData, HebrewDateData, Zman } from './types';
import { ASHDOD_LOCATION } from './constants';
import { fetchSolarData, fetchHebrewDate, fetchDailyData } from './services/apiService';
import { calculateZmanim } from './utils/zmanimCalculator';
import SunCycle from './components/SunCycle';

const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [solarData, setSolarData] = useState<SolarData | null>(null);
  const [hebrewDate, setHebrewDate] = useState<HebrewDateData | null>(null);
  const [extraData, setExtraData] = useState({ daf: '', dafHebrew: '', parasha: '', parashaHebrew: '' });
  const [zmanim, setZmanim] = useState<Zman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifPreferences, setNotifPreferences] = useState<string[]>([]);
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

  const toggleNotification = (id: string) => {
    setNotifPreferences(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const nextZman = useMemo(() => {
    const sorted = [...zmanim].sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime());
    return sorted.find(z => z.fullTime > now) || null;
  }, [zmanim, now]);

  const countdown = useMemo(() => {
    if (!nextZman) return null;
    const diffMs = nextZman.fullTime.getTime() - now.getTime();
    const thirtyMinutesMs = 30 * 60 * 1000;
    
    if (diffMs > 0 && diffMs <= thirtyMinutesMs) {
      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return null;
  }, [nextZman, now]);

  if (loading && !solarData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-black">
        <div className="w-16 h-16 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <div className="text-yellow-400 font-bold uppercase tracking-[0.4em] text-sm animate-pulse">Ashdod Digital Systems</div>
      </div>
    );
  }

  const timeString = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const shortTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden text-white">
      {/* HEADER BAR */}
      <header className="w-full border-b border-white/10 px-8 py-4 flex flex-row items-center justify-between text-base">
        {/* Left Section: Digital Clock Short (Using dir="ltr" to keep time standard) */}
        <div className="flex items-center gap-4 min-w-[150px]" dir="ltr">
           <span className="text-yellow-400 digital-font font-bold text-2xl">{shortTime}</span>
        </div>

        {/* Center Section: Day | Hebrew Date | Parasha | Gregorian Date */}
        <div className="flex flex-row items-center gap-4 font-medium">
           <span className="text-blue-400 font-bold text-xl">{dayOfWeekHebrew}</span>
           <span className="opacity-20 text-xl">|</span>
           <span className="text-blue-100 text-lg">{hebrewDate?.hebrew}</span>
           <span className="opacity-20 text-xl">|</span>
           <span className="flex items-center gap-2">
             <span className="opacity-40 text-lg">פרשת</span>
             <span className="text-blue-500 font-black text-2xl">
               {extraData.parashaHebrew || (loading ? 'טוען...' : '---')}
             </span>
           </span>
           <span className="opacity-20 text-xl">|</span>
           <span className="opacity-40 text-lg">{dateString}</span>
        </div>
        
        {/* Right Section: Daf Yomi */}
        <div className="flex items-center gap-3 min-w-[150px] justify-end">
           <span className="text-green-400 font-bold text-xl">{extraData.dafHebrew}</span>
           <span className="opacity-40 text-sm">:דף יומי</span>
        </div>
      </header>

      {/* MAIN AREA */}
      <main className="flex-grow flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Background Sun Cycle Visualization */}
        <div className="absolute top-12 w-full flex justify-center z-0 scale-110">
          {solarData && <SunCycle sunrise={solarData.sunrise} sunset={solarData.sunset} />}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {nextZman && (
            <div className="mb-8 text-center">
              <div className="text-white/20 uppercase tracking-[0.5em] text-[12px] font-bold mb-2">Prochain Horaire</div>
              <div className="text-5xl font-black text-white/90 drop-shadow-lg">{nextZman.labelHebrew}</div>
            </div>
          )}

          <div className="relative flex flex-col items-center">
             <div className="text-yellow-400/30 text-[12px] font-bold uppercase tracking-[0.8em] mb-6">ASHDOD ISRAEL • ZMANIM</div>
             <h1 className="text-[14.5rem] md:text-[21.5rem] leading-[0.8] font-black digital-font glow-text tracking-tighter select-none" dir="ltr">
               {timeString}
             </h1>
             
             {countdown ? (
               <div className="mt-14 flex flex-col items-center animate-pulse-soft">
                  <div className="text-red-500 text-[13px] font-bold uppercase tracking-[0.3em] mb-4">
                    DÉCOMPTE AVANT {nextZman?.labelHebrew}
                  </div>
                  <div className="text-[9rem] digital-font font-bold text-red-500 bg-red-500/5 px-14 py-5 rounded-[2.5rem] border border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.15)]" dir="ltr">
                    {countdown}
                  </div>
               </div>
             ) : (
               <div className="flex gap-6 justify-center mt-14 opacity-20">
                 <div className="w-20 h-1 bg-yellow-400 rounded-full"></div>
                 <div className="w-20 h-1 bg-yellow-400 rounded-full"></div>
               </div>
             )}
          </div>
        </div>
      </main>

      {/* BOTTOM ZMANIM RIBBON */}
      <footer className="w-full bg-black/40 backdrop-blur-xl border-t border-white/5 py-8">
        <div className="flex flex-row overflow-x-auto no-scrollbar justify-start lg:justify-center gap-6 px-10 pb-2">
          {zmanim.map((z) => (
            <div 
              key={z.id} 
              onClick={() => toggleNotification(z.id)}
              className={`zman-card relative cursor-pointer px-8 py-5 rounded-3xl flex flex-col items-center min-w-[175px] group active:scale-95 transition-transform ${nextZman?.id === z.id ? 'active-zman' : ''}`}
            >
              <span className="text-[13px] text-white/40 font-bold mb-3 uppercase tracking-tighter">
                {z.labelHebrew}
              </span>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-3xl digital-font font-bold text-white/90">
                  {z.time.slice(0, 5)}
                </span>
                <span className="text-lg digital-font text-white/40">
                  :{z.time.slice(6, 8)}
                </span>
              </div>
              
              <div className={`absolute top-3 left-3 text-[10px] transition-opacity duration-300 ${notifPreferences.includes(z.id) ? 'opacity-100 text-yellow-400' : 'opacity-0 group-hover:opacity-30 text-white'}`}>
                <i className="fas fa-bell"></i>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full text-center text-[11px] text-white/10 uppercase tracking-[0.5em] mt-6 font-bold">
           Ashdod (31.8N, 34.6E) • Solar API: SunRiseSet.io • Method: Gra 
        </div>
      </footer>
    </div>
  );
};

export default App;