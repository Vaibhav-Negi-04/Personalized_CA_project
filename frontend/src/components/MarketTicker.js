import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './dashboards/Dashboard2.css';

// Fallback just in case backend is down
const FALLBACK_TICKERS = [
  { symbol: 'NIFTY50', price: 24350.50, change: 1.2 },
  { symbol: 'SENSEX', price: 80120.30, change: 0.8 },
  { symbol: 'BTC/USD', price: 64200.00, change: -2.4 },
  { symbol: 'GOLD', price: 72040.00, change: 0.3 },
  { symbol: 'USD/INR', price: 83.50, change: -0.1 },
  { symbol: 'RELIANCE', price: 3120.45, change: 2.1 },
  { symbol: 'HDFCBANK', price: 1640.20, change: 0.5 },
  { symbol: 'TCS', price: 4250.75, change: -1.1 }
];

function MarketTicker() {
  const [tickers, setTickers] = useState(FALLBACK_TICKERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/market/ticker');
        if (response.data && response.data.length > 0) {
          // Compare with current state to trigger flash animations
          setTickers(prevTickers => {
            return response.data.map(newData => {
              const oldData = prevTickers.find(t => t.symbol === newData.symbol);
              let tickDir = '';
              if (oldData) {
                if (newData.price > oldData.price) tickDir = 'up';
                else if (newData.price < oldData.price) tickDir = 'down';
              }
              return { ...newData, _tick: tickDir };
            });
          });
        }
      } catch (error) {
        console.error('Failed to fetch live market data. Using fallback.', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Poll every 10 seconds
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="market-ticker-wrapper">
      <div className="market-ticker-track">
        {/* Render twice for seamless infinite scroll loop */}
        {[...tickers, ...tickers].map((t, i) => {
          const isPositive = t.change >= 0;
          return (
            <div key={`${t.symbol}-${i}`} className={`ticker-item ${t._tick === 'up' ? 'flash-up' : t._tick === 'down' ? 'flash-down' : ''}`}>
              <span className="ticker-symbol">{t.symbol}</span>
              <span className="ticker-price">{t.price ? t.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}</span>
              <span className={`ticker-change ${isPositive ? 'text-green' : 'text-red'}`}>
                {isPositive ? '▲' : '▼'} {t.change ? Math.abs(t.change).toFixed(2) : '0.00'}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MarketTicker;
