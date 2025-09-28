import { 
  HistoricalDataPoint, 
  MovingAverageParameters, 
  BacktestResults, 
  Trade, 
  OptimizationResult 
} from '../types';

// Sample Nifty historical data (in a real implementation, this would be fetched from an API)
// This represents daily Nifty values over a significant period for backtesting
const SAMPLE_NIFTY_DATA: HistoricalDataPoint[] = generateSampleNiftyData();

/**
 * Generate sample Nifty data for backtesting
 * In a real implementation, this would fetch actual historical data from APIs like Yahoo Finance, Alpha Vantage, etc.
 */
function generateSampleNiftyData(): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const startDate = new Date('2020-01-01');
  const endDate = new Date('2024-01-01');
  let currentPrice = 10000; // Starting Nifty value
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    // Generate realistic price movements with some trend and volatility
    const dailyReturn = (Math.random() - 0.48) * 0.04; // Slight upward bias with 4% daily volatility
    const open = currentPrice;
    const change = currentPrice * dailyReturn;
    const close = currentPrice + change;
    
    // Generate intraday high/low
    const volatility = Math.abs(change) * 2;
    const high = Math.max(open, close) + volatility * Math.random();
    const low = Math.min(open, close) - volatility * Math.random();
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
    
    currentPrice = close;
  }
  
  return data;
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN); // Not enough data points
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
}

/**
 * Implement Moving Average Crossover Strategy
 */
export function backtestMovingAverageCrossover(
  data: HistoricalDataPoint[], 
  parameters: MovingAverageParameters,
  initialCapital: number = 100000
): BacktestResults {
  const { shortMA, longMA } = parameters;
  const closePrices = data.map(d => d.close);
  
  // Calculate moving averages
  const shortMAValues = calculateSMA(closePrices, shortMA);
  const longMAValues = calculateSMA(closePrices, longMA);
  
  const trades: Trade[] = [];
  const equityCurve: { date: string; equity: number; niftyValue: number }[] = [];
  
  let currentPosition = 0; // 0 = no position, 1 = long
  let entryPrice = 0;
  let entryDate = '';
  let currentEquity = initialCapital;
  let shares = 0;
  let cash = initialCapital;
  
  // Start analysis after we have enough data for long MA
  for (let i = longMA; i < data.length; i++) {
    const currentDate = data[i].date;
    const currentPrice = data[i].close;
    const shortMAValue = shortMAValues[i];
    const longMAValue = longMAValues[i];
    const prevShortMA = shortMAValues[i - 1];
    const prevLongMA = longMAValues[i - 1];
    
    // Skip if we don't have valid MA values
    if (isNaN(shortMAValue) || isNaN(longMAValue) || isNaN(prevShortMA) || isNaN(prevLongMA)) {
      continue;
    }
    
    // Crossover detection
    const bullishCrossover = prevShortMA <= prevLongMA && shortMAValue > longMAValue;
    const bearishCrossover = prevShortMA >= prevLongMA && shortMAValue < longMAValue;
    
    // Entry signal (bullish crossover)
    if (bullishCrossover && currentPosition === 0) {
      currentPosition = 1;
      entryPrice = currentPrice;
      entryDate = currentDate;
      shares = Math.floor(cash / currentPrice);
      cash = cash - (shares * currentPrice);
    }
    
    // Exit signal (bearish crossover)
    if (bearishCrossover && currentPosition === 1) {
      const exitPrice = currentPrice;
      const profit = (exitPrice - entryPrice) * shares;
      const profitPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
      
      trades.push({
        entryDate,
        entryPrice,
        exitDate: currentDate,
        exitPrice,
        type: 'long',
        profit,
        profitPercent
      });
      
      cash = cash + (shares * exitPrice);
      shares = 0;
      currentPosition = 0;
    }
    
    // Calculate current equity value
    const portfolioValue = cash + (shares * currentPrice);
    currentEquity = portfolioValue;
    
    equityCurve.push({
      date: currentDate,
      equity: currentEquity,
      niftyValue: currentPrice
    });
  }
  
  // Close any open position at the end
  if (currentPosition === 1 && shares > 0) {
    const lastPrice = data[data.length - 1].close;
    const profit = (lastPrice - entryPrice) * shares;
    const profitPercent = ((lastPrice - entryPrice) / entryPrice) * 100;
    
    trades.push({
      entryDate,
      entryPrice,
      exitDate: data[data.length - 1].date,
      exitPrice: lastPrice,
      type: 'long',
      profit,
      profitPercent
    });
    
    currentEquity = cash + (shares * lastPrice);
  }
  
  // Calculate performance metrics
  const totalReturn = ((currentEquity - initialCapital) / initialCapital) * 100;
  const tradingDays = data.length - longMA;
  const years = tradingDays / 252; // Assuming 252 trading days per year
  const annualizedReturn = Math.pow(currentEquity / initialCapital, 1 / years) - 1;
  
  const winningTrades = trades.filter(t => t.profit > 0).length;
  const losingTrades = trades.filter(t => t.profit < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = initialCapital;
  for (const point of equityCurve) {
    if (point.equity > peak) {
      peak = point.equity;
    }
    const drawdown = ((peak - point.equity) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  // Calculate Sharpe ratio (simplified)
  const returns = equityCurve.map((point, index) => {
    if (index === 0) return 0;
    return (point.equity - equityCurve[index - 1].equity) / equityCurve[index - 1].equity;
  }).slice(1);
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const returnStdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0;
  
  // Calculate benchmark (buy and hold) return
  const startPrice = data[longMA].close;
  const endPrice = data[data.length - 1].close;
  const benchmarkReturn = ((endPrice - startPrice) / startPrice) * 100;
  
  return {
    parameters,
    totalReturn,
    annualizedReturn: annualizedReturn * 100,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    maxDrawdown,
    sharpeRatio,
    trades,
    equityCurve,
    benchmarkReturn,
    outperformance: totalReturn - benchmarkReturn
  };
}

/**
 * Optimize Moving Average parameters
 */
export function optimizeMovingAverageStrategy(
  data: HistoricalDataPoint[] = SAMPLE_NIFTY_DATA
): OptimizationResult {
  const results: BacktestResults[] = [];
  let bestResult: BacktestResults | null = null;
  
  // Parameter ranges to test
  const shortMARange = [5, 10, 15, 20, 25, 30];
  const longMARange = [30, 40, 50, 60, 70, 80, 100];
  
  console.log('Starting parameter optimization...');
  
  for (const shortMA of shortMARange) {
    for (const longMA of longMARange) {
      // Skip if short MA >= long MA
      if (shortMA >= longMA) continue;
      
      const parameters: MovingAverageParameters = { shortMA, longMA };
      const result = backtestMovingAverageCrossover(data, parameters);
      results.push(result);
      
      // Track best result based on Sharpe ratio (risk-adjusted returns)
      if (!bestResult || result.sharpeRatio > bestResult.sharpeRatio) {
        bestResult = result;
      }
    }
  }
  
  if (!bestResult) {
    throw new Error('No valid backtest results found');
  }
  
  console.log(`Optimization complete. Best parameters: ${bestResult.parameters.shortMA}/${bestResult.parameters.longMA}`);
  
  return {
    bestParameters: bestResult.parameters,
    bestResult,
    allResults: results.sort((a, b) => b.sharpeRatio - a.sharpeRatio) // Sort by Sharpe ratio
  };
}

/**
 * Get sample Nifty data for backtesting
 */
export function getNiftyData(): HistoricalDataPoint[] {
  return SAMPLE_NIFTY_DATA;
}