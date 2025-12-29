import { SolarData, Zman } from '../types';

function parseTime(timeStr: string, date: Date): Date {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes, seconds] = time.split(':').map(Number);
  
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  const d = new Date(date);
  d.setHours(hours, minutes, seconds, 0);
  return d;
}

function formatTime(date: Date): string {
  // Always return HH:mm:ss for consistency with the design
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function calculateZmanim(solar: SolarData, baseDate: Date): Zman[] {
  const sunrise = parseTime(solar.sunrise, baseDate);
  const sunset = parseTime(solar.sunset, baseDate);
  const dawn = parseTime(solar.dawn, baseDate);
  const dusk = parseTime(solar.dusk, baseDate);
  const noon = parseTime(solar.solar_noon, baseDate);

  const dayDurationMs = sunset.getTime() - sunrise.getTime();
  const shaahZemanitMs = dayDurationMs / 12;

  // Basic list of core zmanim as seen in the image grid
  // Fix: Assigning to a variable with explicit Zman[] type prevents literal widening of 'importance'
  const zmanim: Zman[] = [
    {
      id: 'alot',
      label: 'Alot HaShachar',
      labelHebrew: 'עלות השחר',
      fullTime: dawn,
      time: formatTime(dawn),
      description: "Aube",
      icon: 'fa-cloud-sun',
      importance: 'secondary'
    },
    {
      id: 'sunrise',
      label: 'Hanetz HaChama',
      labelHebrew: 'נץ החמה',
      fullTime: sunrise,
      time: formatTime(sunrise),
      description: 'Lever du soleil',
      icon: 'fa-sun',
      importance: 'primary'
    },
    {
      id: 'shema',
      label: 'Kriyat Shema',
      labelHebrew: 'סוף זמן שמע',
      fullTime: new Date(sunrise.getTime() + 3 * shaahZemanitMs),
      time: formatTime(new Date(sunrise.getTime() + 3 * shaahZemanitMs)),
      description: 'Fin du temps du Chéma',
      icon: 'fa-book-open',
      importance: 'primary'
    },
    {
      id: 'chatzot',
      label: 'Chatzot HaYom',
      labelHebrew: 'חצות היום',
      fullTime: noon,
      time: formatTime(noon),
      description: 'Midi solaire',
      icon: 'fa-clock',
      importance: 'secondary'
    },
    {
      id: 'mincha_g',
      label: 'Mincha Gedola',
      labelHebrew: 'מנחה גדולה',
      fullTime: new Date(noon.getTime() + 0.5 * shaahZemanitMs),
      time: formatTime(new Date(noon.getTime() + 0.5 * shaahZemanitMs)),
      description: 'Début Mincha',
      icon: 'fa-arrow-down',
      importance: 'secondary'
    },
    {
      id: 'plag',
      label: 'Plag HaMincha',
      labelHebrew: 'פלג המנחה',
      fullTime: new Date(sunrise.getTime() + 10.75 * shaahZemanitMs),
      time: formatTime(new Date(sunrise.getTime() + 10.75 * shaahZemanitMs)),
      description: 'Fin de journée précoce',
      icon: 'fa-mountain-sun',
      importance: 'secondary'
    },
    {
      id: 'shkia',
      label: 'Shkiat HaChama',
      labelHebrew: 'שקיעה',
      fullTime: sunset,
      time: formatTime(sunset),
      description: 'Coucher du soleil',
      icon: 'fa-moon',
      importance: 'primary'
    },
    {
      id: 'tzeit',
      label: 'Tzeit HaKochavim',
      labelHebrew: 'צאת הכוכבים',
      fullTime: dusk,
      time: formatTime(dusk),
      description: 'Sortie des étoiles',
      icon: 'fa-stars',
      importance: 'primary'
    },
    {
      id: 'chatzot_l',
      label: 'Chatzot Laila',
      labelHebrew: 'חצות לילה',
      fullTime: new Date(noon.getTime() + 12 * 60 * 60 * 1000),
      time: formatTime(new Date(noon.getTime() + 12 * 60 * 60 * 1000)),
      description: 'Minuit',
      icon: 'fa-bed',
      importance: 'secondary'
    }
  ];

  return zmanim.sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime());
}