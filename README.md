<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Qualitative Investment Analyst AI & Strategy Backtesting

This application combines AI-powered qualitative investment analysis with algorithmic trading strategy backtesting, specifically featuring a Moving Average Crossover strategy optimized for the Indian Nifty index.

## Features

### 1. Qualitative Investment Analysis
- AI-powered company analysis using Google Gemini
- Document upload support (PDF, TXT)
- Web-based research and citation
- Comprehensive investment reports

### 2. Algorithmic Trading Backtesting
- **Moving Average Crossover Strategy** for Nifty index
- **Parameter Optimization** across multiple MA combinations
- **4 years of historical simulation** (2020-2024)
- **Comprehensive performance metrics**:
  - Total return vs benchmark (Nifty buy-and-hold)
  - Risk-adjusted returns (Sharpe ratio)
  - Win rate and drawdown analysis
  - Detailed trade history

## Strategy Results

The optimal parameters found were **5-day × 50-day MA crossover** with:
- **Total Return**: 139.83% (vs 175.99% buy-and-hold)
- **Annualized Return**: 24.83%
- **Sharpe Ratio**: 1.66
- **Win Rate**: 70%
- **Max Drawdown**: 11.06%

View your app in AI Studio: https://ai.studio/apps/drive/1HOLT4e47cK3i6fblal6zJaQWOxsSmazG

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (required for qualitative analysis only)
3. Run the app:
   ```bash
   npm run dev
   ```

## Usage

1. **Strategy Backtesting**: Click the "Strategy Backtest" tab to run the moving average crossover optimization
2. **Qualitative Analysis**: Click the "Qualitative Analysis" tab to analyze companies using AI (requires API key)

## Technical Details

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backtesting Engine**: Custom JavaScript implementation
- **AI Analysis**: Google Gemini with web search integration
- **Strategy**: Moving Average Crossover with parameter optimization
- **Data**: Simulated Nifty historical data with realistic price movements

## Disclaimer

This application is for educational and research purposes only. Past performance does not guarantee future results. Always conduct your own research and consult with financial advisors before making investment decisions.
