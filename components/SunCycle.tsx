
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

    const width = 300;
    const height = 150;
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .html(''); // Clear previous content

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${height - margin.bottom})`);

    // Horizon line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', innerWidth)
      .attr('y2', 0)
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2);

    // Path for sun arc
    const arcPath = d3.path();
    arcPath.arc(innerWidth / 2, 0, innerWidth / 2, Math.PI, 0);

    g.append('path')
      .attr('d', arcPath.toString())
      .attr('fill', 'none')
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5');

    // Current Sun Position (simplified)
    const now = new Date();
    const hr = now.getHours();
    const min = now.getMinutes();
    const totalMin = hr * 60 + min;
    
    // Approximate progress: 6am to 6pm
    const startMin = 6 * 60;
    const endMin = 18 * 60;
    const progress = Math.max(0, Math.min(1, (totalMin - startMin) / (endMin - startMin)));
    const angle = Math.PI + (progress * Math.PI);
    
    const sunX = (innerWidth / 2) + (innerWidth / 2) * Math.cos(angle);
    const sunY = (innerWidth / 2) * Math.sin(angle);

    g.append('circle')
      .attr('cx', sunX)
      .attr('cy', sunY)
      .attr('r', 8)
      .attr('fill', '#f59e0b')
      .attr('filter', 'drop-shadow(0px 0px 4px rgba(245, 158, 11, 0.5))');

  }, [sunrise, sunset]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Cycle Solaire</h3>
      <svg ref={svgRef}></svg>
      <div className="flex justify-between w-full mt-2 text-xs font-medium text-gray-400">
        <span>{sunrise}</span>
        <span>{sunset}</span>
      </div>
    </div>
  );
};

export default SunCycle;
