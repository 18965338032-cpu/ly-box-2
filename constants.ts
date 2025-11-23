import { CropConfig, ToolType } from './types';

export const GRID_SIZE = 25; // 5x5 grid
export const MAX_ENERGY = 50;
export const MAX_WATER_CAPACITY = 12;

export const CROPS: Record<string, CropConfig> = {
  [ToolType.SEED_CARROT]: {
    name: 'Carrot',
    seedCost: 10,
    sellPrice: 25,
    growthDays: 3,
    emoji: '🥕',
    seedEmoji: '🌰',
  },
  [ToolType.SEED_CORN]: {
    name: 'Corn',
    seedCost: 20,
    sellPrice: 55,
    growthDays: 5,
    emoji: '🌽',
    seedEmoji: '🌽',
  },
  [ToolType.SEED_PUMPKIN]: {
    name: 'Pumpkin',
    seedCost: 50,
    sellPrice: 150,
    growthDays: 8,
    emoji: '🎃',
    seedEmoji: '🎃',
  },
};

export const INITIAL_MONEY = 100;

export const ENERGY_COSTS = {
  TILL: 2,
  WATER: 2,
  PLANT: 1,
  HARVEST: 3,
};