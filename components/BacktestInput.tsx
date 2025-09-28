import React, { useState } from 'react';
import { ChartBarIcon } from './icons';

interface BacktestInputProps {
  onRunBacktest: () => void;
  isLoading: boolean;
}

const BacktestInput: React.FC<BacktestInputProps> = ({ onRunBacktest, isLoading }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <ChartBarIcon className="mx-auto h-16 w-16 text-brand-primary mb-4" />
          <h2 className="text-2xl font-bold text-brand-text mb-2">
            Moving Average Crossover Strategy
          </h2>
          <p className="text-gray-600">
            Backtest the moving average crossover strategy on Nifty index
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">Strategy Overview</h3>
          <div className="space-y-3 text-blue-700">
            <p className="text-sm">
              <strong>Objective:</strong> Find the optimal moving average parameters that maximize risk-adjusted returns on the Nifty index.
            </p>
            <p className="text-sm">
              <strong>Method:</strong> Test multiple combinations of short-term and long-term moving averages to identify the best performing parameters.
            </p>
            <p className="text-sm">
              <strong>Signal Logic:</strong> Buy when short MA crosses above long MA, Sell when short MA crosses below long MA.
            </p>
            <p className="text-sm">
              <strong>Optimization Criteria:</strong> Parameters are ranked by Sharpe ratio (risk-adjusted returns).
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Backtest Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <p><strong>Market:</strong> Nifty 50 Index</p>
              <p><strong>Period:</strong> 2020-2024 (4 years)</p>
              <p><strong>Initial Capital:</strong> ₹1,00,000</p>
            </div>
            <div>
              <p><strong>Short MA Range:</strong> 5-30 days</p>
              <p><strong>Long MA Range:</strong> 30-100 days</p>
              <p><strong>Transaction Costs:</strong> Not included</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={onRunBacktest}
            disabled={isLoading}
            className="w-full sm:w-auto bg-brand-accent hover:opacity-90 text-brand-text font-bold py-3 px-10 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? 'Running Backtest...' : 'Run Strategy Backtest'}
          </button>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            <strong>Disclaimer:</strong> This backtest is for educational purposes only. 
            Past performance does not guarantee future results. Always conduct your own research before making investment decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BacktestInput;