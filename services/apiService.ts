
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
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // Fetch with h=on for Hebrew labels
  const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${y}&month=${m}&ss=on&mf=on&c=off&geo=none&F=on&d=on&heb=on`);
  const data = await response.json();
  
  const dafEvent = data.items?.find((item: any) => item.category === 'dafyomi');
  const parashaEvent = data.items?.find((item: any) => item.category === 'parashat');

  return {
    daf: dafEvent ? dafEvent.title : 'Non disponible',
    dafHebrew: dafEvent ? dafEvent.hebrew : 'לא זמין',
    parasha: parashaEvent ? parashaEvent.title : '',
    parashaHebrew: parashaEvent ? parashaEvent.hebrew : ''
  };
}
