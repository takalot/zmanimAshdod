
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
  const [notifPreferences, setNotifPreferences] = useState<string[]>([]);
  const [dayOfWeekHebrew, setDayOfWeekHebrew] = useState('');

  // Mapping day of week to Hebrew
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
      setError("Erreur de chargement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(new Date());
    const timer = setInterval(() => {
      const d = new Date();
      setNow(d);
      
      // Basic notification check
      zmanim.forEach(z => {
        if (notifPreferences.includes(z.id)) {
          const diff = z.fullTime.getTime() - d.getTime();
          // Notify 1 minute before
          if (diff > 0 && diff < 60000 && !localStorage.getItem(`notif_${z.id}_${d.toDateString()}`)) {
            if (Notification.permission === 'granted') {
              new Notification(`Zman imminent: ${z.label}`, { body: `${z.labelHebrew} à ${z.time}` });
              localStorage.setItem(`notif_${z.id}_${d.toDateString()}`, 'true');
            }
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loadData, zmanim, notifPreferences]);

  const toggleNotification = (id: string) => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setNotifPreferences(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const nextZman = useMemo(() => {
    const sorted = [...zmanim].sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime());
    return sorted.find(z => z.fullTime > now) || null;
  }, [zmanim, now]);

  // Countdown logic: show if we are within 30 minutes of nextZman
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
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-yellow-400 font-bold uppercase tracking-widest">Initialisation Ashdod...</div>
      </div>
    );
  }

  const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateString = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center">
      {/* Top Header Bar */}
      <div className="w-full border-b border-white/10 px-6 py-2 flex flex-wrap justify-between items-center text-sm font-medium text-white/70">
        <div className="flex items-center gap-4">
           <span className="text-yellow-400 digital-font font-bold text-lg">{timeString}</span>
           <span className="opacity-30">|</span>
           <div className="flex items-center gap-2">
             <span className="hebrew-font text-blue-400">{dayOfWeekHebrew}</span>
             <span className="hebrew-font text-blue-500 font-bold">({extraData.parashaHebrew || '---'})</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <span className="hebrew-font text-blue-300">{hebrewDate?.hebrew}</span>
           <span className="opacity-30">|</span>
           <span>{dateString}</span>
           <span className="opacity-30">|</span>
           <div className="flex items-center gap-2">
             <span className="text-white/40">דף יומי:</span>
             <span className="hebrew-font text-green-400">{extraData.dafHebrew}</span>
           </div>
        </div>
      </div>

      {/* Main Clock Section */}
      <div className="flex-grow flex flex-col items-center justify-center w-full px-4 text-center">
        {nextZman && (
          <div className="mb-2">
            <span className="text-white/30 uppercase tracking-[0.3em] text-xs font-bold">Prochain Zman</span>
            <h2 className="text-2xl font-bold hebrew-font text-white/80 mt-1">{nextZman.labelHebrew}</h2>
          </div>
        )}

        <div className="my-8 relative">
           <div className="text-yellow-400 text-xs font-bold mb-2 uppercase tracking-widest opacity-80">
              Heure Actuelle (Ashdod)
           </div>
           <h1 className="text-[10rem] md:text-[16rem] leading-none font-black digital-font select-none tracking-tighter">
             {timeString}
           </h1>
           
           {/* Countdown Timer Display */}
           {countdown && (
             <div className="mt-4 flex flex-col items-center animate-pulse">
                <div className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
                  Décompte avant {nextZman?.labelHebrew}
                </div>
                <div className="text-6xl digital-font font-bold text-red-500 bg-red-500/10 px-6 py-2 rounded-xl border border-red-500/30">
                  {countdown}
                </div>
             </div>
           )}

           {/* Decorative elements */}
           {!countdown && (
             <div className="flex gap-2 justify-center mt-4">
               <div className="w-8 h-1 bg-yellow-400"></div>
               <div className="w-8 h-1 bg-yellow-400"></div>
             </div>
           )}
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full mb-12">
           <i className="fas fa-location-dot text-blue-400"></i>
           <span className="text-white/60 text-sm">Ashdod, Israël</span>
           <span className="opacity-30">|</span>
           <span className="text-white/60 text-sm">Altitude: 0m</span>
        </div>
      </div>

      {/* Bottom Zmanim Ribbon */}
      <div className="w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-4 pb-8 overflow-x-auto">
        <div className="flex justify-start md:justify-center items-center gap-4 min-w-max px-4">
          {zmanim.map((z) => (
            <div 
              key={z.id} 
              onClick={() => toggleNotification(z.id)}
              className={`zman-card relative cursor-pointer px-4 py-3 rounded-lg flex flex-col items-center min-w-[120px] ${nextZman?.id === z.id ? 'active-zman' : ''}`}
            >
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-tighter mb-1 hebrew-font">
                {z.labelHebrew}
              </div>
              <div className="text-lg digital-font font-bold text-white/90">
                {z.time.slice(0, 5)}
              </div>
              <div className="text-[9px] text-white/20 mt-1 digital-font">
                {z.time.slice(-2)}
              </div>
              
              {notifPreferences.includes(z.id) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-black flex items-center justify-center text-[6px]">
                  <i className="fas fa-bell text-black"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full py-4 text-center text-[10px] text-white/20 uppercase tracking-widest">
         Location: {ASHDOD_LOCATION.lat}°N {ASHDOD_LOCATION.lng}°E • Zmanim {new Date().getFullYear()} • Gra Method
      </div>
    </div>
  );
};

export default App;
