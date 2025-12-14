import { useState } from "react";
import Simple from "../components/Simple";
import { CryptoPriceData } from "../types/Coin";

// Mock crypto data for testing
const mockCryptoData: CryptoPriceData = {
  prices: [
    {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      price: 90177,
      change24h: -0.09545864772963061,
      marketCap: 1800715219097.3684,
      volume24h: 35601956247.89487,
      lastUpdated: Date.now(),
      image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
      rank: 1,
      high24h: 91500,
      low24h: 89000,
      priceChange24h: -86.15,
      circulatingSupply: 19800000,
      totalSupply: 21000000,
      maxSupply: 21000000,
      ath: 69000,
      athChangePercentage: 30.72,
      athDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
      atl: 67.81,
      atlChangePercentage: 132948.52,
      atlDate: Date.now() - 10 * 365 * 24 * 60 * 60 * 1000,
      fullyDilutedValuation: 1893717000000,
      marketCapChange24h: -1577223456,
      marketCapChangePercentage24h: -0.087,
    },
    {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      price: 3114.06,
      change24h: 0.8819681135826105,
      marketCap: 376238902144.61993,
      volume24h: 10277451478.22697,
      lastUpdated: Date.now(),
      image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
      rank: 2,
      high24h: 3150.50,
      low24h: 3080.25,
      priceChange24h: 27.45,
      circulatingSupply: 120500000,
      totalSupply: 120500000,
      maxSupply: null,
      ath: 4878.26,
      athChangePercentage: -36.17,
      athDate: Date.now() - 730 * 24 * 60 * 60 * 1000,
      atl: 0.432979,
      atlChangePercentage: 718935.42,
      atlDate: Date.now() - 8 * 365 * 24 * 60 * 60 * 1000,
      fullyDilutedValuation: 376238902144,
      marketCapChange24h: 3294816234,
      marketCapChangePercentage24h: 0.88,
    },
    {
      id: "solana",
      symbol: "SOL",
      name: "Solana",
      price: 132.73,
      change24h: 0.35926023338308727,
      marketCap: 74584979260.07869,
      volume24h: 2325950857.3919973,
      lastUpdated: Date.now(),
      image: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
      rank: 5,
      high24h: 135.20,
      low24h: 131.15,
      priceChange24h: 0.48,
      circulatingSupply: 562000000,
      totalSupply: 582000000,
      maxSupply: null,
      ath: 259.96,
      athChangePercentage: -48.93,
      athDate: Date.now() - 365 * 24 * 60 * 60 * 1000,
      atl: 0.500801,
      atlChangePercentage: 26407.36,
      atlDate: Date.now() - 4 * 365 * 24 * 60 * 60 * 1000,
      fullyDilutedValuation: 77234820000,
      marketCapChange24h: 267123456,
      marketCapChangePercentage24h: 0.36,
    },
    {
      id: "cardano",
      symbol: "ADA",
      name: "Cardano",
      price: 0.410443,
      change24h: 0.09185069936589448,
      marketCap: 15024415392.18938,
      volume24h: 363475527.1240448,
      lastUpdated: Date.now(),
      image: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
      rank: 9,
      high24h: 0.4156,
      low24h: 0.4051,
      priceChange24h: 0.000377,
      circulatingSupply: 36600000000,
      totalSupply: 45000000000,
      maxSupply: 45000000000,
      ath: 3.09,
      athChangePercentage: -86.71,
      athDate: Date.now() - 1095 * 24 * 60 * 60 * 1000,
      atl: 0.01925275,
      atlChangePercentage: 2031.86,
      atlDate: Date.now() - 6 * 365 * 24 * 60 * 60 * 1000,
      fullyDilutedValuation: 18469935000,
      marketCapChange24h: 13762491,
      marketCapChangePercentage24h: 0.092,
    },
  ],
  currency: "USD",
  lastUpdated: Date.now(),
  rotationInterval: 0
};

const TestPage = () => {
  const [cryptoData] = useState<CryptoPriceData>(mockCryptoData);

  return (
    <div className="w-screen h-screen bg-slate-900">
      <Simple cryptoData={cryptoData} />
      
      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-black/70 text-white p-4 rounded-lg text-xs z-50">
        <p className="font-bold mb-2">🧪 TEST MODE</p>
        <p>Using mock data</p>
        <p className="mt-2 text-yellow-400">
          Build for production to see live data
        </p>
      </div>
    </div>
  );
};

export default TestPage;