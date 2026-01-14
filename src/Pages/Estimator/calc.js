import {
  HIGH_CEILING_FT,
  FURNITURE_ADDON_WALL,
  HIGH_CEILING_ADDON_WALL,
  SQFT_PER_HOUR,
  SQFT_PER_GALLON,
} from "./constants";

const parse = (v) => {
  if (v == null) return 0;

  const normalized = String(v)
    .trim()
    .replace(/\s+/g, "")   // remove spaces
    .replace(",", ".");    // allow 1,75 → 1.75

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
};

const parseMoney = parse;
const parseIntSafe = (v) => {
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : 0;
};

export function computeAreaCalc(area, pricing) {
  const wallsOn = !!area.paintWalls;
  const ceilingOn = !!area.paintCeiling;
  const doorsOn = !!area.paintDoors;
  const baseboardOn = !!area.paintBaseboard;

  const L = (wallsOn || ceilingOn || baseboardOn) ? parse(area.length) : 0;
  const W = (wallsOn || ceilingOn || baseboardOn) ? parse(area.width) : 0;
  const H = wallsOn ? parse(area.height) : 0;

  const doorCount = doorsOn ? parseIntSafe(area.doorCount) : 0;

  const wallSqft = wallsOn ? (2 * (L + W) * H) : 0;
  const ceilingSqft = ceilingOn ? (L * W) : 0;

  const isHighCeiling = wallsOn ? (H > HIGH_CEILING_FT) : false;

  const wallRate = wallsOn
    ? (pricing.wallRate +
        (area.furnitureMove ? FURNITURE_ADDON_WALL : 0) +
        (isHighCeiling ? HIGH_CEILING_ADDON_WALL : 0))
    : 0;

  // NOTE: your current code applies furniture/high-ceiling add-ons to ceilingRate too
  // (it might be intentional). Keeping same behavior:
  const ceilingRate =
    pricing.ceilingRate +
    (area.furnitureMove ? FURNITURE_ADDON_WALL : 0) +
    (isHighCeiling ? HIGH_CEILING_ADDON_WALL : 0);

  const wallCost = wallSqft * wallRate;
  const ceilingCost = ceilingSqft * ceilingRate;

  // Doors
  const doorWft = doorsOn ? parse(area.doorWidthIn) / 12 : 0;
  const doorHft = doorsOn ? parse(area.doorHeightIn) / 12 : 0;
  const doorSqftPerDoor = doorWft * doorHft * 2;
  const doorSqft = doorsOn ? doorCount * doorSqftPerDoor : 0;
  const doorCost = doorsOn ? doorCount * pricing.doorRate : 0;

  // Baseboard
  const baseboardHeightIn =
    area.baseboardHeightChoice === "custom"
      ? parse(area.baseboardHeightCustomIn)
      : parse(area.baseboardHeightChoice);

  const baseboardHeightFt = baseboardOn ? baseboardHeightIn / 12 : 0;
  const baseboardLf = baseboardOn ? 2 * (L + W) : 0;
  const baseboardSqft = baseboardOn ? baseboardLf * baseboardHeightFt : 0;
  const baseboardCost = baseboardOn ? baseboardLf * pricing.baseboardRate : 0;

  // Gallons (ceil up like you do now)
  const wallGallons = wallsOn ? Math.ceil(wallSqft / SQFT_PER_GALLON) : 0;
  const ceilingGallons = ceilingOn ? Math.ceil(ceilingSqft / SQFT_PER_GALLON) : 0;
  const doorGallons = doorsOn ? Math.ceil(doorSqft / SQFT_PER_GALLON) : 0;
  const baseboardGallons = baseboardOn ? Math.ceil(baseboardSqft / SQFT_PER_GALLON) : 0;

  // Hours (keep same behavior: only walls+ceiling hours)
  const wallHours = wallsOn ? Math.ceil(wallSqft / SQFT_PER_HOUR) : 0;
  const ceilingHours = ceilingOn ? Math.ceil(ceilingSqft / SQFT_PER_HOUR) : 0;

  const totalCost = wallCost + ceilingCost + doorCost + baseboardCost;
  const totalGallons = wallGallons + ceilingGallons + doorGallons + baseboardGallons;
  const totalHours = wallHours + ceilingHours;

  return {
    id: area.id,
    wallSqft,
    ceilingSqft,
    wallRate,
    ceilingRate,
    wallCost,
    ceilingCost,
    wallHours,
    ceilingHours,
    totalHours,
    wallGallons,
    ceilingGallons,
    doorCount,
    doorSqft,
    doorSqftPerDoor,
    doorCost,
    doorGallons,
    baseboardLf,
    baseboardSqft,
    baseboardCost,
    baseboardGallons,
    baseboardHeightIn,
    totalGallons,
    totalCost,
    isHighCeiling,
  };
}

export function computeJobTotals(perArea, paintPricePerGallon) {
  const grandTotal = perArea.reduce((sum, a) => sum + a.totalCost, 0);

  const totalJobHours = Math.ceil(
    perArea.reduce((sum, a) => sum + (a.wallHours + a.ceilingHours), 0)
  );

  const totalJobGallons = perArea.reduce((sum, a) => sum + (a.totalGallons || 0), 0);
  const totalPaintMaterialCost = (totalJobGallons || 0) * (paintPricePerGallon || 0);

  return { grandTotal, totalJobHours, totalJobGallons, totalPaintMaterialCost };
}

export const parseMoneySafe = parseMoney;

export const EMPTY_CALC = {
  wallSqft: 0,
  ceilingSqft: 0,
  wallRate: 0,
  ceilingRate: 0,
  wallCost: 0,
  ceilingCost: 0,
  wallHours: 0,
  ceilingHours: 0,
  totalHours: 0,
  wallGallons: 0,
  ceilingGallons: 0,
  doorCount: 0,
  doorSqft: 0,
  doorSqftPerDoor: 0,
  doorCost: 0,
  doorGallons: 0,
  baseboardLf: 0,
  baseboardSqft: 0,
  baseboardCost: 0,
  baseboardGallons: 0,
  baseboardHeightIn: 0,
  totalGallons: 0,
  totalCost: 0,
  isHighCeiling: false,
};
