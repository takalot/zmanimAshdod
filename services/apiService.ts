import { SolarData, HebrewDateData } from '../types';

export async function fetchSolarData(lat: number, lng: number, dateStr: string): Promise<SolarData> {
  const response = await fetch(`https://api.sunrisesunset.io/json?lat=${lat}&lng=${lng}&date=${dateStr}`);
  const data = await response.json();
  if (data.status !== 'OK') throw new Error('Failed to fetch solar data');
  return data.results;
}

export async function fetchHebrewDate(date: Date): Promise<HebrewDateData> {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const response = await fetch(`https://www.hebcal.com/converter?cfg=json&gy=${y}&gm=${m}&gd=${d}&g2h=1`);
  return await response.json();
}

export async function fetchDailyData(date: Date): Promise<{ daf: string, dafHebrew: string, parasha: string, parashaHebrew: string }> {
  const today = new Date(date);
  const startStr = today.toISOString().split('T')[0];
  
  // Calculer le samedi de la semaine en cours
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  const saturdayStr = saturday.toISOString().split('T')[0];

  // Requête étendue pour inclure Daf Yomi et Parasha (ss=on, s=on pour Shabbat)
  const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&start=${startStr}&end=${saturdayStr}&ss=on&mf=on&c=off&geo=none&F=on&heb=on&s=on`);
  const data = await response.json();
  
  // Extraire le Daf d'aujourd'hui
  const dafEvent = data.items?.find((item: any) => item.category === 'dafyomi' && item.date === startStr);
  
  // Extraire la Paracha du samedi
  const parashaEvent = data.items?.find((item: any) => item.category === 'parashat' && item.date === saturdayStr);

  return {
    daf: dafEvent ? dafEvent.title : 'Non disponible',
    dafHebrew: dafEvent ? dafEvent.hebrew : '---',
    parasha: parashaEvent ? parashaEvent.title : '',
    parashaHebrew: parashaEvent ? parashaEvent.hebrew.replace(/^פרשת\s+/, '') : 'לא נמצא'
  };
}