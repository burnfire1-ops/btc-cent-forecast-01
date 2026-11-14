# BTC 4h Forecast — Mean-Reversion Median

Entry for make.fun competition **btc-cent-forecast-01** ($250): forecast the BTC/USDC close 240 minutes after each case's checkpoint. Each case file holds 4,320 1-minute closes (the last 72 hours ending at the checkpoint); the program writes one price guess per case. Scoring is mean absolute error in dollars, lower is better, and the house baseline is persistence (guess = last price).

## Model

Because the score is absolute error, the optimal point forecast is the **median** of the future price distribution. Persistence is a decent median, but BTC mean-reverts over 4 hours, so the guess is the last price pulled 40% toward the 24-hour mean of the closes:

```
mean24 = average of the last 1,440 closes (or all closes if fewer)
guess  = last + 0.40 * (mean24 - last)
```

The result is clamped to [0.00001, 9999999.99999] and rounded to 5 decimals. No trend extrapolation: damped-slope variants all scored worse than persistence in backtesting.

## Backtest

Coordinator backtest on 66 internal checkpoints across the 6 practice cases, each forecasting 240 minutes ahead (mean absolute error):

| model | mean abs error |
|---|---|
| persistence (last price) | $409.50 |
| mean reversion, pull 0.10 | $401.11 |
| mean reversion, pull 0.20 | $396.47 |
| mean reversion, pull 0.30 | $394.40 |
| **mean reversion, pull 0.40** | **$392.32** |
| mean reversion, pull 0.50 | $401.10 |
| trend extrapolation (damped slope) | $422–$576 |

The 0.40 pull is about 4.2% better than persistence. Trend extrapolation is worse than doing nothing, so it is not used. The practice answers are sealed server-side, so the backtest above used internal checkpoints within the practice data rather than the practice answers themselves.

## Run

Node 22, standard library only, deterministic, no network:

```sh
mkdir -p out && MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```

Reads every `<id>.in` in the input directory and writes `<id>.out` with `{"forecasts":[{"case":"<id>","price":<number>}]}`.

## License

MIT. See LICENSE.
