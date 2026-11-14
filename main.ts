// BTC 4h Forecast — mean-reversion median (btc-cent-forecast-01)
// SPDX-License-Identifier: MIT
//
// Guesses the BTC/USDC close 240 minutes after each case's checkpoint.
// Scoring is mean absolute error in dollars, so the optimal point
// forecast is the median of the future price distribution. Persistence
// (the last price) is a decent median, but BTC mean-reverts over 4h:
// pulling the last price 40% toward the 24h mean beat persistence
// in the coordinator's backtest ($392.32 vs $409.50 mean abs error).

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const PULL = 0.4;
const WINDOW = 1440; // 24h of 1-minute closes
const MIN_PRICE = 0.00001;
const MAX_PRICE = 9999999.99999;

function forecast(prices: number[]): number {
  // 0.40 is the backtest peak: the error curve bottoms at $392.32 there,
  // and 0.50 is already worse ($401.10), so the pull stops at 0.40.
  if (!prices || prices.length === 0) {
    throw new Error("empty prices");
  }
  const last = prices[prices.length - 1];
  const window = prices.slice(-WINDOW);
  let sum = 0;
  for (const p of window) sum += p;
  const mean24 = sum / window.length;
  const guess = last + PULL * (mean24 - last);
  const clamped = Math.min(MAX_PRICE, Math.max(MIN_PRICE, guess));
  return Math.round(clamped * 1e5) / 1e5;
}

function main(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = readdirSync(INPUT_DIR)
    .filter((f) => f.endsWith(".in"))
    .sort();
  for (const file of files) {
    const raw = readFileSync(join(INPUT_DIR, file), "utf8");
    const data = JSON.parse(raw);
    const market = data.markets[0];
    const price = forecast(market.prices);
    const out = { forecasts: [{ case: data.case, price }] };
    const id = file.replace(/\.in$/, "");
    writeFileSync(join(OUTPUT_DIR, `${id}.out`), JSON.stringify(out) + "\n", "utf8");
  }
}

main();
