import { MandiPrice } from './types';

export type PricePredictionInput = {
  crop: string;
  quantityKg?: number;
  demandKg?: number;
  supplyKg?: number;
  quality?: string;
  currentPrice?: number;
};

export type PricePredictionResult = {
  crop: string;
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  trend: 'Rising' | 'Stable' | 'Falling';
  demandLevel: 'High' | 'Balanced' | 'Low' | 'Unknown';
  confidence: number;
  baselinePrice: number;
  demandAdjustmentPct: number;
  trainingPoints: number;
  model: string;
  recommendation: string;
};

type Sample = {
  features: number[];
  target: number;
};

type TreeNode =
  | { leaf: true; value: number }
  | { leaf: false; feature: number; threshold: number; left: TreeNode; right: TreeNode };

// Small, dependency-free Random Forest regressor for the demo/MVP.
// It is intentionally kept in TypeScript so the Vercel deployment needs no Python runtime.
function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function variance(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildTree(samples: Sample[], depth: number, random: () => number): TreeNode {
  if (samples.length <= 2 || depth >= 3 || variance(samples.map((s) => s.target)) < 0.01) {
    return { leaf: true, value: mean(samples.map((s) => s.target)) };
  }

  const featureCount = samples[0].features.length;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  // Random feature subset at every split keeps the trees diverse.
  const candidates = Math.max(1, Math.ceil(Math.sqrt(featureCount)));
  const seen = new Set<number>();
  while (seen.size < candidates) seen.add(Math.floor(random() * featureCount));

  for (const feature of seen) {
    const sorted = [...new Set(samples.map((s) => s.features[feature]))].sort((a, b) => a - b);
    if (sorted.length < 2) continue;

    // Try a small random subset of valid midpoints.
    const attempts = Math.min(6, sorted.length - 1);
    for (let i = 0; i < attempts; i++) {
      const index = Math.floor(random() * (sorted.length - 1));
      const threshold = (sorted[index] + sorted[index + 1]) / 2;
      const left = samples.filter((s) => s.features[feature] <= threshold);
      const right = samples.filter((s) => s.features[feature] > threshold);
      if (!left.length || !right.length) continue;
      const score = left.length * variance(left.map((s) => s.target)) + right.length * variance(right.map((s) => s.target));
      if (score < bestScore) {
        bestScore = score;
        bestFeature = feature;
        bestThreshold = threshold;
      }
    }
  }

  if (bestFeature < 0) return { leaf: true, value: mean(samples.map((s) => s.target)) };

  const left = samples.filter((s) => s.features[bestFeature] <= bestThreshold);
  const right = samples.filter((s) => s.features[bestFeature] > bestThreshold);
  if (!left.length || !right.length) return { leaf: true, value: mean(samples.map((s) => s.target)) };

  return {
    leaf: false,
    feature: bestFeature,
    threshold: bestThreshold,
    left: buildTree(left, depth + 1, random),
    right: buildTree(right, depth + 1, random),
  };
}

function predictTree(tree: TreeNode, features: number[]): number {
  if (tree.leaf) return tree.value;
  return features[tree.feature] <= tree.threshold
    ? predictTree(tree.left, features)
    : predictTree(tree.right, features);
}

function randomForestPredict(samples: Sample[], features: number[], seed: number) {
  if (samples.length < 5) return null;
  const random = seededRandom(seed);
  const predictions: number[] = [];
  const treeCount = 31;

  for (let t = 0; t < treeCount; t++) {
    const bootstrap: Sample[] = [];
    for (let i = 0; i < samples.length; i++) {
      bootstrap.push(samples[Math.floor(random() * samples.length)]);
    }
    const tree = buildTree(bootstrap, 0, random);
    predictions.push(predictTree(tree, features));
  }

  return { prediction: mean(predictions), spread: Math.sqrt(variance(predictions)) };
}

function cropSamples(history: MandiPrice[]): Sample[] {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const samples: Sample[] = [];

  for (let i = 3; i < sorted.length; i++) {
    const previous = sorted.slice(i - 3, i);
    const prices = previous.map((p) => p.price_per_kg);
    const avg3 = mean(prices);
    const trend3 = prices[prices.length - 1] - prices[0];
    const volatility = Math.sqrt(variance(prices));
    const current = sorted[i].price_per_kg;
    samples.push({
      features: [avg3, trend3, volatility, current],
      target: current,
    });
  }

  return samples;
}

function qualityFactor(quality?: string) {
  const normalized = (quality || '').toLowerCase();
  if (normalized.includes('premium')) return 1.06;
  if (normalized.includes('grade a')) return 1.03;
  if (normalized.includes('grade b')) return 0.98;
  if (normalized.includes('grade c')) return 0.94;
  return 1;
}

export function predictPrice(input: PricePredictionInput, allPrices: MandiPrice[]): PricePredictionResult {
  const crop = input.crop.trim() || 'Tomato';
  const history = allPrices
    .filter((p) => p.crop.toLowerCase() === crop.toLowerCase())
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!history.length) {
    throw new Error(`No historical mandi price data available for ${crop}`);
  }

  const recent = history.slice(-7);
  const recentPrices = recent.map((p) => p.price_per_kg);
  const baseline = mean(recentPrices);
  const shortAvg = mean(recentPrices.slice(-3));
  const first = recentPrices[0];
  const last = recentPrices[recentPrices.length - 1];
  const trendDelta = last - first;
  const trendPct = baseline ? (trendDelta / baseline) * 100 : 0;
  const volatility = Math.sqrt(variance(recentPrices));

  const samples = cropSamples(history);
  const latest = recentPrices[recentPrices.length - 1];
  const latestAvg3 = mean(recentPrices.slice(-3));
  const latestTrend3 = recentPrices.length >= 3 ? recentPrices[recentPrices.length - 1] - recentPrices[recentPrices.length - 3] : 0;
  const latestVolatility = Math.sqrt(variance(recentPrices.slice(-3)));

  const forest = randomForestPredict(samples, [latestAvg3, latestTrend3, latestVolatility, latest], crop.length * 997 + history.length);
  const modelPrice = forest?.prediction ?? shortAvg + trendDelta / Math.max(1, recentPrices.length - 1);

  const demand = Math.max(0, input.demandKg || 0);
  const supply = Math.max(0, input.supplyKg || input.quantityKg || 0);
  const ratio = supply > 0 ? demand / supply : 0;

  let demandAdjustmentPct = 0;
  if (ratio >= 1.5) demandAdjustmentPct = 5;
  else if (ratio >= 1.1) demandAdjustmentPct = 3;
  else if (ratio >= 0.9) demandAdjustmentPct = 0;
  else if (ratio >= 0.6) demandAdjustmentPct = -3;
  else if (supply > 0) demandAdjustmentPct = -5;

  const adjusted = modelPrice * (1 + demandAdjustmentPct / 100) * qualityFactor(input.quality);
  const predictedPrice = Number(Math.max(0.01, adjusted).toFixed(2));

  const modelSpread = forest?.spread ?? volatility * 0.35;
  const uncertainty = Math.max(0.04, Math.min(0.12, modelSpread / Math.max(predictedPrice, 1) + 0.04));
  const minPrice = Number((predictedPrice * (1 - uncertainty)).toFixed(2));
  const maxPrice = Number((predictedPrice * (1 + uncertainty)).toFixed(2));

  const trend: PricePredictionResult['trend'] = trendPct > 3 ? 'Rising' : trendPct < -3 ? 'Falling' : 'Stable';
  const demandLevel: PricePredictionResult['demandLevel'] =
    !demand || !supply ? 'Unknown' : ratio >= 1.1 ? 'High' : ratio >= 0.9 ? 'Balanced' : 'Low';

  const dataConfidence = Math.min(1, history.length / 14);
  const stabilityConfidence = Math.max(0, 1 - volatility / Math.max(baseline, 1));
  const confidence = Math.round(Math.max(55, Math.min(94, 55 + 25 * dataConfidence + 14 * stabilityConfidence)));

  let recommendation = `Target ₹${minPrice.toFixed(2)}–₹${maxPrice.toFixed(2)}/kg`;
  if (trend === 'Rising') recommendation += ' and consider negotiating toward the upper end.';
  if (trend === 'Falling') recommendation += ' and avoid delaying the sale without a strong buyer offer.';
  if (demandLevel === 'High') recommendation += ' Buyer demand is strong.';

  return {
    crop,
    predictedPrice,
    minPrice,
    maxPrice,
    trend,
    demandLevel,
    confidence,
    baselinePrice: Number(baseline.toFixed(2)),
    demandAdjustmentPct,
    trainingPoints: history.length,
    model: forest ? 'Random Forest Regression + demand/supply adjustment' : 'Trend baseline + demand/supply adjustment',
    recommendation,
  };
}
