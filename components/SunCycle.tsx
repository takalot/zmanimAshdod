import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SunCycleProps {
  sunrise: string;
  sunset: string;
}

const SunCycle: React.FC<SunCycleProps> = ({ sunrise, sunset }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 480; // Increased from 400
    const height = 216; // Increased from 180
    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .html(''); 

    const margin = { top: 48, right: 36, bottom: 24, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${height - margin.bottom})`);

    // Horizon line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', innerWidth)
      .attr('y2', 0)
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 1.5);

    // Path for sun arc
    const arcPath = d3.path();
    arcPath.arc(innerWidth / 2, 0, innerWidth / 2, Math.PI, 0);

    g.append('path')
      .attr('d', arcPath.toString())
      .attr('fill', 'none')
      .attr('stroke', 'rgba(251, 206, 7, 0.2)')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,5');

    // Helper to parse time string to minutes from midnight
    const parseTimeToMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const sunriseMin = parseTimeToMinutes(sunrise);
    const sunsetMin = parseTimeToMinutes(sunset);
    
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    
    // Calculate progress: 0 at sunrise, 1 at sunset
    const isDay = currentMin >= sunriseMin && currentMin <= sunsetMin;
    const progress = isDay 
      ? (currentMin - sunriseMin) / (sunsetMin - sunriseMin)
      : (currentMin < sunriseMin ? 0 : 1);
      
    const angle = Math.PI + (progress * Math.PI);
    
    const radius = innerWidth / 2;
    const sunX = radius + radius * Math.cos(angle);
    const sunY = radius * Math.sin(angle);

    // Glow for sun
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'sun-glow');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '5')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    if (isDay) {
      g.append('circle')
        .attr('cx', sunX)
        .attr('cy', sunY)
        .attr('r', 8) // Increased radius
        .attr('fill', '#fbce07')
        .attr('filter', 'url(#sun-glow)');
    }

  }, [sunrise, sunset]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto opacity-70">
      <svg ref={svgRef} className="w-full h-auto"></svg>
      <div className="flex justify-between w-full px-12 -mt-6 text-[12px] font-bold text-white/30 tracking-widest uppercase">
        <div className="flex flex-col items-start">
          <span>{sunrise}</span>
          <span className="text-[10px] text-yellow-500/50">Lever</span>
        </div>
        <div className="flex flex-col items-end">
          <span>{sunset}</span>
          <span className="text-[10px] text-orange-500/50">Coucher</span>
        </div>
      </div>
    </div>
  );
};

export default SunCycle;