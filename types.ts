export enum ToolType {
  HOE = 'HOE',
  WATERING_CAN = 'WATERING_CAN',
  BASKET = 'BASKET',
  SEED_CARROT = 'SEED_CARROT',
  SEED_CORN = 'SEED_CORN',
  SEED_PUMPKIN = 'SEED_PUMPKIN',
}

export interface CropConfig {
  name: string;
  seedCost: number;
  sellPrice: number;
  growthDays: number;
  emoji: string; // The fruit/veg
  seedEmoji: string; // The seed icon
}

export enum PlotStatus {
  EMPTY = 'EMPTY',
  TILLED = 'TILLED',
  PLANTED = 'PLANTED',
}

export interface Plot {
  id: number;
  status: PlotStatus;
  cropType?: ToolType; // Which seed was planted
  growthStage: number; // 0 to max
  isWatered: boolean;
  isWithered: boolean;
}

export interface GameState {
  day: number;
  money: number;
  energy: number;
  inventory: Partial<Record<ToolType, number>>; // Counts for seeds
}

export interface DailyEvent {
  message: string;
  weather: 'Sunny' | 'Rainy' | 'Cloudy';
  buff?: string;
}