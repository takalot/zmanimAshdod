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
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 7); // Look ahead 7 days to catch next Shabbat's parasha

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  // Fetch with start/end range to guarantee we catch the upcoming Saturday even at month boundaries
  const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&start=${startStr}&end=${endStr}&ss=on&mf=on&c=off&geo=none&F=on&heb=on`);
  const data = await response.json();
  
  // Daf Yomi is usually returned for every day
  const dafEvent = data.items?.find((item: any) => item.category === 'dafyomi' && item.date === startStr);
  
  // Parasha is usually on Saturday. We take the first one found in our 7-day window.
  const parashaEvent = data.items?.find((item: any) => item.category === 'parashat');

  return {
    daf: dafEvent ? dafEvent.title : 'Non disponible',
    dafHebrew: dafEvent ? dafEvent.hebrew : 'לא זמין',
    parasha: parashaEvent ? parashaEvent.title : '',
    // We strip "פרשת " prefix if it exists to avoid double "Parasha" in the UI
    parashaHebrew: parashaEvent ? parashaEvent.hebrew.replace(/^פרשת\s+/, '') : ''
  };
}