import React from 'react';
import { Plot, PlotStatus, ToolType } from '../types';
import { CROPS } from '../constants';

interface FarmPlotProps {
  plot: Plot;
  selectedTool: ToolType | null;
  onClick: (id: number) => void;
}

export const FarmPlot: React.FC<FarmPlotProps> = ({ plot, selectedTool, onClick }) => {
  
  const getPlotContent = () => {
    if (plot.status === PlotStatus.PLANTED && plot.cropType) {
      const crop = CROPS[plot.cropType];
      // Visual growth stages logic
      if (plot.isWithered) return '🥀';
      if (plot.growthStage >= crop.growthDays) return crop.emoji;
      if (plot.growthStage === 0) return '🌱';
      return '🌿';
    }
    return '';
  };

  // Dynamic styles based on state
  const getBaseClasses = () => {
    const base = "w-full h-16 sm:h-20 rounded-md border-2 flex items-center justify-center text-2xl sm:text-3xl cursor-pointer transition-all duration-200 relative shadow-sm";
    
    if (plot.status === PlotStatus.EMPTY) {
      return `${base} bg-green-100 border-green-200 hover:bg-green-200`;
    }
    if (plot.status === PlotStatus.TILLED) {
      return `${base} bg-amber-100 border-amber-200 hover:bg-amber-200`;
    }
    if (plot.status === PlotStatus.PLANTED) {
      return `${base} bg-amber-100 border-amber-300`;
    }
    return base;
  };

  return (
    <button 
      onClick={() => onClick(plot.id)}
      className={getBaseClasses()}
      aria-label={`Farm plot ${plot.id}`}
    >
      {/* Soil/Water Layer */}
      {plot.status !== PlotStatus.EMPTY && (
        <div className={`absolute inset-0 opacity-20 rounded-sm ${plot.isWatered ? 'bg-blue-600' : 'bg-transparent'}`}></div>
      )}
      
      {/* Crop Layer */}
      <span className="z-10 relative drop-shadow-sm transform hover:scale-110 transition-transform">
        {getPlotContent()}
      </span>

      {/* Hover Guide (optional, simple interaction hint) */}
      {plot.status === PlotStatus.PLANTED && !plot.isWithered && plot.cropType && (
        <div className="absolute bottom-0 right-1 text-[8px] sm:text-[10px] text-amber-800 font-bold opacity-50">
           {plot.growthStage}/{CROPS[plot.cropType].growthDays}
        </div>
      )}
    </button>
  );
};