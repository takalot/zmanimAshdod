
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SolarData, HebrewDateData, Zman } from './types';
import { ASHDOD_LOCATION } from './constants';
import { fetchSolarData, fetchHebrewDate, fetchDailyData } from './services/apiService';
import { calculateZmanim } from './utils/zmanimCalculator';

const App: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [zmanim, setZmanim] = useState<Zman[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // User Preferences
  const [visibleIds, setVisibleIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('visibleZmanim_pref');
    return saved ? JSON.parse(saved) : ['alot', 'sunrise', 'shema', 'tefillah', 'chatzot', 'mincha_g', 'plag', 'shkia', 'tzeit'];
  });
  const [reminders, setReminders] = useState<string[]>(() => {
    const saved = localStorage.getItem('zmanReminders_pref');
    return saved ? JSON.parse(saved) : [];
  });

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

      setData({
        hebDate: hebDate.hebrew,
        parashaHeb: daily.parashaHebrew,
        parashaEng: daily.parasha,
        daf: daily.dafHebrew,
        dateStr: targetDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')
      });
      setZmanim(calculateZmanim(solar, targetDate));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem('visibleZmanim_pref', JSON.stringify(visibleIds));
  }, [visibleIds]);

  useEffect(() => {
    localStorage.setItem('zmanReminders_pref', JSON.stringify(reminders));
  }, [reminders]);

  const nextZman = useMemo(() => zmanim.find(z => z.fullTime > now) || null, [zmanim, now]);

  const countdown = useMemo(() => {
    if (!nextZman) return null;
    const diff = nextZman.fullTime.getTime() - now.getTime();
    if (diff > 0 && diff <= 1800000) {
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return null;
  }, [nextZman, now]);

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleVisibility = (id: string) => {
    setVisibleIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading && !data) return <div className="h-screen bg-black flex items-center justify-center text-yellow-500 font-bold text-2xl animate-pulse">ASHDOD...</div>;

  const timeString = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const visibleZmanim = zmanim.filter(z => visibleIds.includes(z.id));

  return (
    <div className="h-screen bg-black flex flex-col text-white overflow-hidden select-none">
      {/* HEADER */}
      <header className="w-full h-28 px-10 flex flex-row-reverse items-center justify-between border-b border-white/10">
        <div className="flex flex-row-reverse items-center gap-10">
          <span className="text-yellow-400 digital-font font-bold text-6xl tracking-tighter">{timeString.slice(0, 5)}</span>
          <div className="flex flex-row-reverse items-center gap-6">
            <span className="text-blue-400 text-4xl font-black">{hebrewDays[now.getDay()]}</span>
            <div className="flex flex-col items-end">
              <span className="text-blue-600 text-3xl font-black">{data.parashaHeb}</span>
              <span className="text-blue-600/40 text-sm font-bold uppercase tracking-widest">{data.parashaEng}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-row-reverse items-center gap-6 text-2xl font-black">
          <span className="text-blue-200">{data.hebDate}</span>
          <span className="opacity-20">|</span>
          <span className="text-green-400">דף: {data.daf}</span>
          <button onClick={() => setShowSettings(true)} className="text-white/20 p-2 hover:text-white transition-all"><i className="fa-solid fa-gear"></i></button>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        {countdown ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="text-red-500 text-3xl font-black uppercase mb-8 tracking-[0.5em]">{nextZman?.labelHebrew} בעוד</div>
            <div className="text-[20rem] leading-none digital-font font-black text-red-500 [text-shadow:0_0_50px_rgba(239,68,68,0.5)]">{countdown}</div>
            <div className="mt-8 text-4xl text-white/40 font-bold uppercase tracking-widest">HEURE: {timeString}</div>
          </div>
        ) : (
          <div className="text-center">
            {nextZman && (
              <div className="mb-8">
                <div className="text-white/20 uppercase tracking-[0.5em] text-sm font-bold mb-2">Prochain Horaire</div>
                <div className="text-7xl font-black text-white glow-text">{nextZman.labelHebrew}</div>
                <div className="text-3xl text-yellow-400 mt-2 font-bold">{nextZman.time.slice(0, 5)}</div>
              </div>
            )}
            <h1 className="text-[14rem] leading-none digital-font font-black tracking-tighter glow-text">{timeString}</h1>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full pb-8 px-6">
        <div className="flex flex-row-reverse flex-wrap gap-2 justify-center">
          {visibleZmanim.map(z => {
            const isActive = nextZman?.id === z.id;
            return (
              <div 
                key={z.id}
                onClick={() => toggleReminder(z.id)}
                className={`min-w-[140px] p-4 rounded-2xl flex flex-col items-center border transition-all cursor-pointer relative ${isActive ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(251,206,7,0.3)]' : 'border-white/10 bg-white/5'}`}
              >
                {reminders.includes(z.id) && <i className="fa-solid fa-bell text-[#fbce07] absolute top-2 right-2 text-[10px] animate-bounce"></i>}
                <span className="text-[10px] font-bold text-white/40 mb-2">{z.labelHebrew}</span>
                <span className={`digital-font text-3xl font-bold ${isActive ? 'text-yellow-400' : 'text-white'}`}>{z.time.slice(0, 5)}</span>
              </div>
            );
          })}
        </div>
      </footer>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-[#111] border border-white/20 rounded-[2rem] p-10 max-w-xl w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-yellow-400 mb-8 uppercase text-center tracking-widest">Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              {zmanim.map(z => (
                <label key={z.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer ${visibleIds.includes(z.id) ? 'bg-white/10' : 'bg-white/5 opacity-40'}`}>
                  <span className="font-bold">{z.labelHebrew}</span>
                  <input type="checkbox" checked={visibleIds.includes(z.id)} onChange={() => toggleVisibility(z.id)} className="w-6 h-6 accent-yellow-400" />
                </label>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-10 w-full bg-yellow-400 text-black py-4 rounded-xl font-black text-xl hover:bg-yellow-300">VALIDER</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
