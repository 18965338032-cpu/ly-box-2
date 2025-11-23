import React, { useState, useEffect, useCallback } from 'react';
import { FarmPlot } from './components/FarmPlot';
import { Controls } from './components/Controls';
import { GRID_SIZE, INITIAL_MONEY, MAX_ENERGY, ENERGY_COSTS, CROPS, MAX_WATER_CAPACITY } from './constants';
import { Plot, PlotStatus, ToolType, DailyEvent } from './types';
import { generateDailyEvent } from './services/geminiService';

// Initialize Grid
const createInitialGrid = (): Plot[] => {
  return Array.from({ length: GRID_SIZE }, (_, i) => ({
    id: i,
    status: PlotStatus.EMPTY,
    growthStage: 0,
    isWatered: false,
    isWithered: false,
  }));
};

export default function App() {
  // Game State
  const [plots, setPlots] = useState<Plot[]>(createInitialGrid());
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [day, setDay] = useState(1);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [waterLevel, setWaterLevel] = useState(MAX_WATER_CAPACITY);
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);
  
  // UI State
  const [dailyEvent, setDailyEvent] = useState<DailyEvent | null>(null);
  const [isSleeping, setIsSleeping] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load initial greeting
  useEffect(() => {
    setDailyEvent({
      weather: 'Sunny',
      message: "Welcome to Gemini Valley! Start by tilling the soil."
    });
  }, []);

  // Helper: Show ephemeral notification
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  };

  const handleRefill = () => {
    setWaterLevel(MAX_WATER_CAPACITY);
    showNotification("Watering can refilled! 💧");
  };

  // Helper: Handle Plot Interactions
  const handlePlotClick = (id: number) => {
    if (isSleeping) return;

    setPlots((prevPlots) => {
      const newPlots = [...prevPlots];
      const plotIndex = newPlots.findIndex((p) => p.id === id);
      const plot = newPlots[plotIndex];

      if (!plot || !selectedTool) return prevPlots;

      // Logic Map
      let newMoney = money;
      let newEnergy = energy;
      let actionSuccess = false;

      if (energy <= 0) {
        showNotification("Too tired! Need to sleep.");
        return prevPlots;
      }

      // 1. Tilling (Hoe)
      if (selectedTool === ToolType.HOE) {
        if (plot.status === PlotStatus.EMPTY) {
          newPlots[plotIndex] = { ...plot, status: PlotStatus.TILLED };
          newEnergy -= ENERGY_COSTS.TILL;
          actionSuccess = true;
        }
      }

      // 2. Planting (Seeds)
      else if (selectedTool.startsWith('SEED_')) {
        const cropConfig = CROPS[selectedTool];
        if (plot.status === PlotStatus.TILLED && cropConfig) {
            if (money >= cropConfig.seedCost) {
                newPlots[plotIndex] = {
                    ...plot,
                    status: PlotStatus.PLANTED,
                    cropType: selectedTool,
                    growthStage: 0,
                    isWatered: false,
                    isWithered: false,
                };
                newMoney -= cropConfig.seedCost;
                newEnergy -= ENERGY_COSTS.PLANT;
                actionSuccess = true;
            } else {
                showNotification("Not enough money!");
            }
        }
      }

      // 3. Watering (Area of Effect)
      else if (selectedTool === ToolType.WATERING_CAN) {
        // Check if empty
        if (waterLevel <= 0) {
            showNotification("Watering can is empty! Refill at the well.");
            return prevPlots; // Stop here
        }

        // Identify targets: Clicked plot + Horizontal Neighbors
        // Grid is 5 wide. 
        // Left: plotIndex - 1 (if in same row)
        // Right: plotIndex + 1 (if in same row)
        const rowStart = Math.floor(plotIndex / 5) * 5;
        const rowEnd = rowStart + 4;
        
        const potentialTargets = [plotIndex]; // Center
        if (plotIndex - 1 >= rowStart) potentialTargets.push(plotIndex - 1); // Left
        if (plotIndex + 1 <= rowEnd) potentialTargets.push(plotIndex + 1);   // Right

        let waterConsumed = 0;
        let didWaterSomething = false;

        potentialTargets.forEach((targetIdx) => {
            // Check if we still have water in this swing
            // Note: We check against `waterLevel - waterConsumed` because waterLevel is the start state
            if ((waterLevel - waterConsumed) <= 0) return;

            const targetPlot = newPlots[targetIdx];
            if (targetPlot.status !== PlotStatus.EMPTY && !targetPlot.isWatered) {
                newPlots[targetIdx] = { ...targetPlot, isWatered: true };
                waterConsumed++;
                didWaterSomething = true;
            }
        });

        if (didWaterSomething) {
          setWaterLevel((prev) => Math.max(0, prev - waterConsumed));
          newEnergy -= ENERGY_COSTS.WATER; // One action cost for the swing
          actionSuccess = true;
        } else {
             // Optional: If clicking already watered crops, maybe don't consume energy?
             // Or maybe just water them anyway (waste water)?
             // Let's play nice and do nothing if nothing needed water.
        }
      }

      // 4. Harvesting (Basket)
      else if (selectedTool === ToolType.BASKET) {
        if (plot.status === PlotStatus.PLANTED && plot.cropType) {
          const crop = CROPS[plot.cropType];
          // Harvest if fully grown or remove dead crop
          if (plot.isWithered) {
              // Remove dead crop
              newPlots[plotIndex] = { ...plot, status: PlotStatus.TILLED, cropType: undefined, isWithered: false, growthStage: 0, isWatered: false };
              newEnergy -= 1;
              actionSuccess = true;
              showNotification("Cleared dead crop.");
          } else if (plot.growthStage >= crop.growthDays) {
              // Success harvest
              newMoney += crop.sellPrice;
              newPlots[plotIndex] = { ...plot, status: PlotStatus.TILLED, cropType: undefined, growthStage: 0, isWatered: false };
              newEnergy -= ENERGY_COSTS.HARVEST;
              actionSuccess = true;
              showNotification(`Sold ${crop.name} for ${crop.sellPrice}!`);
          }
        }
      }

      if (actionSuccess) {
        setMoney(newMoney);
        setEnergy(newEnergy);
        return newPlots;
      }
      
      return prevPlots;
    });
  };

  // Handle Sleep / New Day
  const handleSleep = useCallback(async () => {
    setIsSleeping(true);
    
    // Process Overnight Logic
    setPlots((currentPlots) => {
        return currentPlots.map(plot => {
            if (plot.status === PlotStatus.PLANTED && plot.cropType) {
                if (plot.isWatered) {
                    return { ...plot, growthStage: plot.growthStage + 1, isWatered: false };
                }
                return { ...plot, isWatered: false };
            }
            if (plot.status === PlotStatus.TILLED) {
                if (Math.random() > 0.7) return { ...plot, status: PlotStatus.EMPTY };
            }
            return plot;
        });
    });

    setDay(prev => prev + 1);
    setEnergy(MAX_ENERGY); // Full restore
    // Note: Water does NOT restore automatically.

    // AI Daily Event
    try {
        const event = await generateDailyEvent(day + 1, money);
        setDailyEvent(event);
    } catch (e) {
        // Fallback handled in service
    } finally {
        setIsSleeping(false);
    }
  }, [day, money]);

  // Handle Rain effect (Simulated)
  useEffect(() => {
      if (dailyEvent?.weather === 'Rainy') {
          setPlots(prev => prev.map(p => 
             p.status !== PlotStatus.EMPTY ? { ...p, isWatered: true } : p
          ));
          showNotification("It's raining! Crops watered.");
          setWaterLevel(MAX_WATER_CAPACITY); // Bonus: Rain refills the can!
      }
  }, [dailyEvent]);

  return (
    <div className="min-h-screen bg-stone-100 text-stone-800 font-serif flex flex-col items-center pb-10">
      
      {/* Header */}
      <header className="w-full bg-green-700 text-amber-100 p-4 shadow-lg mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gemini Valley</h1>
            <p className="text-xs text-green-200 opacity-80">Day {day}</p>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <div className="flex items-center bg-green-800 px-3 py-1 rounded-full border border-green-600 shadow-inner">
               <span>🪙 {money}</span>
            </div>
            <div className="flex items-center bg-green-800 px-3 py-1 rounded-full border border-green-600 shadow-inner">
               <span className={`${energy < 10 ? 'text-red-300 animate-pulse' : 'text-amber-100'}`}>⚡ {energy}/{MAX_ENERGY}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Controls & Stats */}
        <div className="md:col-span-4 space-y-6 order-2 md:order-1">
            
            {/* Daily Event Card */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-stone-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <h3 className="text-xs font-bold text-stone-400 uppercase mb-2">Morning Report</h3>
                <div className="flex items-center gap-3 mb-2">
                   <span className="text-3xl">
                       {dailyEvent?.weather === 'Sunny' ? '☀️' : dailyEvent?.weather === 'Rainy' ? '🌧️' : '☁️'}
                   </span>
                   <span className="font-bold text-lg text-stone-700">{dailyEvent?.weather || 'Loading...'}</span>
                </div>
                <p className="text-sm text-stone-600 italic leading-relaxed">
                    "{dailyEvent?.message || 'Connecting to satellite...'}"
                </p>
            </div>

            {/* Controls */}
            <Controls 
                selectedTool={selectedTool} 
                onSelectTool={setSelectedTool}
                money={money}
                waterLevel={waterLevel}
                maxWater={MAX_WATER_CAPACITY}
                onRefill={handleRefill}
            />

            {/* Sleep Button */}
            <button
                onClick={handleSleep}
                disabled={isSleeping}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transform active:scale-95 transition-all font-bold flex items-center justify-center gap-2"
            >
                {isSleeping ? (
                   <span className="animate-pulse">Sleeping... 💤</span>
                ) : (
                   <>
                     <span>End Day</span>
                     <span>🌙</span>
                   </>
                )}
            </button>

            <div className="text-xs text-center text-stone-400">
                Tips: Use Hoe to till, Seeds to plant, Water to grow crops. Harvest when ready!
            </div>
        </div>

        {/* Right Column: Farm Grid */}
        <div className="md:col-span-8 order-1 md:order-2">
            <div className="bg-emerald-50 p-4 sm:p-6 rounded-2xl shadow-inner border-4 border-emerald-200/50">
                <div className="grid grid-cols-5 gap-2 sm:gap-3 aspect-square">
                    {plots.map((plot) => (
                        <FarmPlot 
                            key={plot.id} 
                            plot={plot} 
                            selectedTool={selectedTool}
                            onClick={handlePlotClick}
                        />
                    ))}
                </div>
            </div>
        </div>
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-stone-800 text-white px-6 py-2 rounded-full shadow-xl text-sm animate-bounce z-50 whitespace-nowrap">
           {notification}
        </div>
      )}
      
    </div>
  );
}