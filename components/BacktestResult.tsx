import React from 'react';
import { BacktestResults, OptimizationResult } from '../types';
import { CheckCircleIcon, XCircleIcon, TrendingUpIcon, TrendingDownIcon } from './icons';

interface BacktestResultProps {
  optimizationResult: OptimizationResult;
  onReset: () => void;
}

const BacktestResult: React.FC<BacktestResultProps> = ({ optimizationResult, onReset }) => {
  const { bestResult, allResults } = optimizationResult;
  
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toLocaleString('en-IN', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatCurrency = (num: number): string => {
    return `₹${formatNumber(num, 0)}`;
  };

  const MetricCard: React.FC<{ title: string; value: string; isPositive?: boolean; icon?: React.ReactNode }> = ({ 
    title, 
    value, 
    isPositive, 
    icon 
  }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-xl font-bold ${isPositive !== undefined ? (isPositive ? 'text-green-600' : 'text-red-600') : 'text-gray-800'}`}>
            {value}
          </p>
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
    </div>
  );

  const TradeRow: React.FC<{ trade: any; index: number }> = ({ trade, index }) => (
    <tr className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
      <td className="px-4 py-2 text-sm">{trade.entryDate}</td>
      <td className="px-4 py-2 text-sm">{formatNumber(trade.entryPrice)}</td>
      <td className="px-4 py-2 text-sm">{trade.exitDate}</td>
      <td className="px-4 py-2 text-sm">{formatNumber(trade.exitPrice)}</td>
      <td className={`px-4 py-2 text-sm font-medium ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatCurrency(trade.profit)}
      </td>
      <td className={`px-4 py-2 text-sm font-medium ${trade.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {formatNumber(trade.profitPercent)}%
      </td>
    </tr>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="text-center border-b pb-6 mb-6">
          <h2 className="text-3xl font-bold text-brand-text mb-2">
            Moving Average Crossover Strategy - Nifty Backtest Results
          </h2>
          <p className="text-lg text-gray-600">
            Optimal Parameters: {bestResult.parameters.shortMA}-day × {bestResult.parameters.longMA}-day MA
          </p>
        </div>

        {/* Performance Summary */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-brand-text">Performance Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Return"
              value={`${formatNumber(bestResult.totalReturn)}%`}
              isPositive={bestResult.totalReturn > 0}
              icon={bestResult.totalReturn > 0 ? <TrendingUpIcon className="h-6 w-6 text-green-500" /> : <TrendingDownIcon className="h-6 w-6 text-red-500" />}
            />
            <MetricCard
              title="Nifty Buy & Hold"
              value={`${formatNumber(bestResult.benchmarkReturn)}%`}
              isPositive={bestResult.benchmarkReturn > 0}
            />
            <MetricCard
              title="Outperformance"
              value={`${formatNumber(bestResult.outperformance)}%`}
              isPositive={bestResult.outperformance > 0}
            />
            <MetricCard
              title="Annualized Return"
              value={`${formatNumber(bestResult.annualizedReturn)}%`}
              isPositive={bestResult.annualizedReturn > 0}
            />
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-brand-text">Risk Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Max Drawdown"
              value={`${formatNumber(bestResult.maxDrawdown)}%`}
              isPositive={false}
            />
            <MetricCard
              title="Sharpe Ratio"
              value={formatNumber(bestResult.sharpeRatio)}
              isPositive={bestResult.sharpeRatio > 1}
            />
            <MetricCard
              title="Total Trades"
              value={bestResult.totalTrades.toString()}
            />
            <MetricCard
              title="Win Rate"
              value={`${formatNumber(bestResult.winRate)}%`}
              isPositive={bestResult.winRate > 50}
            />
          </div>
        </div>

        {/* Trading Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-brand-text">Trading Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-green-700">Winning Trades</p>
                  <p className="text-xl font-bold text-green-800">{bestResult.winningTrades}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-sm text-red-700">Losing Trades</p>
                  <p className="text-xl font-bold text-red-800">{bestResult.losingTrades}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm text-blue-700">Average Trade</p>
                <p className="text-xl font-bold text-blue-800">
                  {bestResult.totalTrades > 0 
                    ? formatCurrency(bestResult.trades.reduce((sum, t) => sum + t.profit, 0) / bestResult.totalTrades)
                    : '₹0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Parameter Optimization Results */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-brand-text">Top 10 Parameter Combinations</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Rank</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Short MA</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Long MA</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Total Return</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Sharpe Ratio</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Max Drawdown</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {allResults.slice(0, 10).map((result, index) => (
                  <tr key={index} className={index === 0 ? 'bg-yellow-50 font-semibold' : (index % 2 === 0 ? 'bg-gray-50' : 'bg-white')}>
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{result.parameters.shortMA}</td>
                    <td className="border border-gray-300 px-4 py-2">{result.parameters.longMA}</td>
                    <td className={`border border-gray-300 px-4 py-2 ${result.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(result.totalReturn)}%
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{formatNumber(result.sharpeRatio)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-red-600">{formatNumber(result.maxDrawdown)}%</td>
                    <td className="border border-gray-300 px-4 py-2">{formatNumber(result.winRate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade History */}
        {bestResult.trades.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-brand-text">Trade History (Last 10 Trades)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Entry Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Entry Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Exit Date</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Exit Price</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Profit (₹)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Profit (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {bestResult.trades.slice(-10).reverse().map((trade, index) => (
                    <TradeRow key={index} trade={trade} index={index} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Strategy Description */}
        <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold mb-3 text-blue-800">Strategy Description</h3>
          <p className="text-blue-700 leading-relaxed">
            The <strong>Moving Average Crossover Strategy</strong> generates buy signals when the {bestResult.parameters.shortMA}-day 
            moving average crosses above the {bestResult.parameters.longMA}-day moving average, and sell signals when it crosses below. 
            This is a trend-following strategy that aims to capture medium to long-term price movements in the Nifty index.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Key Advantages:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Simple and objective entry/exit signals</li>
                <li>• Reduces market noise and emotional trading</li>
                <li>• Works well in trending markets</li>
                <li>• Historically tested approach</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Considerations:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• May produce false signals in sideways markets</li>
                <li>• Lags behind price movements</li>
                <li>• Requires disciplined execution</li>
                <li>• Past performance doesn't guarantee future results</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={onReset} 
            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            Run New Backtest
          </button>
        </div>
      </div>
    </div>
  );
};

export default BacktestResult;