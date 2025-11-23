import React from 'react';
import { ToolType } from '../types';
import { CROPS } from '../constants';

interface ControlsProps {
  selectedTool: ToolType | null;
  onSelectTool: (tool: ToolType) => void;
  money: number;
  waterLevel: number;
  maxWater: number;
  onRefill: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ 
  selectedTool, 
  onSelectTool, 
  money,
  waterLevel,
  maxWater,
  onRefill
}) => {
  
  const tools = [
    { id: ToolType.HOE, icon: '🪓', name: 'Hoe', cost: 0 },
    { id: ToolType.WATERING_CAN, icon: '💧', name: 'Water', cost: 0 },
    { id: ToolType.BASKET, icon: '🧺', name: 'Harvest', cost: 0 },
  ];

  const seeds = [
    { id: ToolType.SEED_CARROT, ...CROPS[ToolType.SEED_CARROT] },
    { id: ToolType.SEED_CORN, ...CROPS[ToolType.SEED_CORN] },
    { id: ToolType.SEED_PUMPKIN, ...CROPS[ToolType.SEED_PUMPKIN] },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Tools */}
      <div className="bg-white p-3 rounded-xl shadow-md border border-stone-200">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Tools</h3>
        <div className="flex gap-2 justify-around">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg transition-all relative ${
                selectedTool === tool.id 
                  ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-200' 
                  : 'bg-stone-50 hover:bg-stone-100'
              }`}
            >
              <span className="text-2xl mb-1">{tool.icon}</span>
              <span className="text-xs font-medium text-stone-700">{tool.name}</span>

              {/* Water Capacity Indicator */}
              {tool.id === ToolType.WATERING_CAN && (
                <div className="absolute bottom-1 w-8 sm:w-12 h-1.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300 mt-1">
                   <div 
                     className={`h-full transition-all duration-300 ${waterLevel === 0 ? 'bg-transparent' : 'bg-blue-500'}`} 
                     style={{ width: `${(waterLevel / maxWater) * 100}%` }}
                   />
                </div>
              )}
              
              {/* Empty Warning Badge */}
              {tool.id === ToolType.WATERING_CAN && waterLevel === 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
                   EMPTY
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Well / Refill Station */}
      <div className="bg-blue-50 p-3 rounded-xl shadow-md border border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <span className="text-2xl drop-shadow-sm">⛲</span>
            <div>
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Old Well</h3>
                <div className="text-[10px] text-blue-600 font-medium">Refill your can here</div>
            </div>
        </div>
        <button 
            onClick={onRefill}
            disabled={waterLevel >= maxWater}
            className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:transform active:scale-95 transition-all"
        >
            {waterLevel >= maxWater ? 'Full' : 'Refill'}
        </button>
      </div>

      {/* Seeds */}
      <div className="bg-white p-3 rounded-xl shadow-md border border-stone-200">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Market</h3>
        <div className="grid grid-cols-3 gap-2">
          {seeds.map((seed) => {
            const canAfford = money >= seed.seedCost;
            return (
              <button
                key={seed.id}
                onClick={() => canAfford && onSelectTool(seed.id)}
                disabled={!canAfford}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  selectedTool === seed.id 
                    ? 'bg-green-100 border-green-500 ring-2 ring-green-200' 
                    : canAfford 
                      ? 'bg-stone-50 border-stone-200 hover:bg-stone-100' 
                      : 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-xl mb-1">{seed.seedEmoji}</span>
                <div className="text-xs font-bold text-stone-800">{seed.name}</div>
                <div className="text-[10px] font-medium text-amber-600">🪙 {seed.seedCost}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};