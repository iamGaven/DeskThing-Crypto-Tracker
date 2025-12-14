/**
 * Type definitions for Crypto Tracker DeskThing App
 */

// Individual coin price data
export type CryptoPrice = {
  id: string;          // CoinGecko coin ID (e.g., "bitcoin")
  symbol: string;      // Short symbol (e.g., "BTC")
  name: string;        // Display name (e.g., "Bitcoin")
  price: number;       // Current price in selected currency
  change24h: number;   // 24h change percentage
  marketCap: number;   // Market capitalization
  volume24h: number;   // 24h trading volume
  lastUpdated: number; // Unix timestamp of last update
  image: string;       // Coin image URL (small size)
  rank: number;        // Market cap rank
  high24h: number;     // 24h high price
  low24h: number;      // 24h low price
  priceChange24h: number; // 24h price change (absolute value)
  circulatingSupply: number; // Circulating supply
  totalSupply: number;       // Total supply
  maxSupply: number | null;  // Max supply (null if unlimited)
  ath: number;              // All-time high price
  athChangePercentage: number; // ATH change percentage
  athDate: number | null;   // All-time high date
  atl: number;              // All-time low price
  atlChangePercentage: number; // ATL change percentage
  atlDate: number | null;   // All-time low date
  fullyDilutedValuation: number | null; // Fully diluted valuation
  marketCapChange24h: number; // 24h market cap change
  marketCapChangePercentage24h: number; // 24h market cap change %
};

// Main price data structure
export type CryptoPriceData = {
  prices: CryptoPrice[];
  currency: string;
  lastUpdated: number;
  rotationInterval?: number; // Add this line

};

// App settings structure
export type CryptoSettings = {
  apiKey: string;          // CoinGecko API key (optional)
  coins: string[];         // Array of coin IDs to track
  currency: string;        // Display currency (usd, eur, etc.)
  updateInterval: number;  // Update interval in seconds
};

export type CoinGeckoResponse = {
  [coinId: string]: {
    [key: string]: number | undefined;            // Dynamic keys for price, market_cap, 24h_vol, 24h_change, last_updated_at
  };
};

// Data sent to client from server
export type ToClientData = 
  | {
      type: 'cryptoPrices';
      payload: CryptoPriceData | null; // Allow null for cases where data isn't available yet
    }
  | {
      type: 'cryptoError';
      payload: { message: string };
    };

// Data sent from client to server
export type GenericTransitData = 
  | {
      type: 'get';
      request: 'prices';
      payload?: string;
    }
  | {
      type: 'refreshPrices';
      payload?: string;
    }
  | {
      type: 'settings';
      payload: any;
    };