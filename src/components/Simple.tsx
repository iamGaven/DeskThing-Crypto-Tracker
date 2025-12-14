import { useEffect, useState } from "react";
import { createDeskThing } from '@deskthing/client';
import { ToClientData, GenericTransitData, CryptoPriceData } from "../types/Coin";
import { DEVICE_CLIENT, CLIENT_REQUESTS } from "@deskthing/types";

const DeskThing = createDeskThing<ToClientData, GenericTransitData>();

interface SimpleProps {
  cryptoData: CryptoPriceData | null;
}

const Simple = ({ cryptoData }: SimpleProps) => {
  const [time, setTime] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>();
  const [imageError, setImageError] = useState<boolean>(false);
  const [currentCoinIndex, setCurrentCoinIndex] = useState<number>(0);

  useEffect(() => {
    const fetchSong = () => {
      DeskThing.send({ app: 'client', type: CLIENT_REQUESTS.GET, request: 'music' });
    };

    const timeout = setTimeout(fetchSong, 1000);

    const unsubscribe = DeskThing.on(DEVICE_CLIENT.MUSIC, (data) => {
      if (data?.payload.thumbnail) {
        setThumbnail(data.payload.thumbnail);
      }
    });

    const removeTimeListener = DeskThing.on(DEVICE_CLIENT.TIME, (data) => {
      if (typeof data.payload === 'string') {
        setTime(data.payload);
      } else {
        const utcOffset = data.payload.timezoneOffset;
        const utcTime = data.payload.utcTime;
        const date = new Date(utcTime);
        date.setMinutes(date.getMinutes() + utcOffset);
        setTime(`${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}`);
      }
    });

    return () => {
      removeTimeListener();
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Auto-rotate through coins based on rotation interval from settings
  useEffect(() => {
    if (!cryptoData?.prices || cryptoData.prices.length <= 1) return;

    const rotationMs = (cryptoData.rotationInterval || 30) * 1000;
    console.log('=== ROTATION INTERVAL DEBUG ===');
    console.log('cryptoData.rotationInterval:', cryptoData.rotationInterval);
    console.log('Rotation interval in seconds:', cryptoData.rotationInterval || 30);
    console.log('Rotation interval in milliseconds:', rotationMs);
    console.log('Full cryptoData:', cryptoData);

    const interval = setInterval(() => {
      setCurrentCoinIndex((prev) => (prev + 1) % cryptoData.prices.length);
      setImageError(false); // Reset image error on coin change
    }, rotationMs);

    return () => clearInterval(interval);
  }, [cryptoData?.prices, cryptoData?.rotationInterval]);

  // Reset index when crypto data changes
  useEffect(() => {
    setCurrentCoinIndex(0);
    setImageError(false);
  }, [cryptoData]);

  if (!cryptoData?.prices || cryptoData.prices.length === 0) {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-80 z-10"></div>
        <div className="relative w-full h-full flex flex-col items-center justify-center z-20 text-white">
          <p className="text-5xl font-bold">No crypto data available</p>
          <p className="text-2xl font-light mt-4">Configure coins in settings</p>
        </div>
      </div>
    );
  }

  const currentCoin = cryptoData.prices[currentCoinIndex];
  const isPositive = currentCoin.change24h >= 0;

  // Debug: Log current coin data and image URL
  console.log('Current Coin Display:', {
    name: currentCoin.name,
    symbol: currentCoin.symbol,
    id: currentCoin.id,
    imageUrl: currentCoin.image,
    hasImage: !!currentCoin.image,
    imageError: imageError
  });

  // Format price based on value (remove decimals for high values, keep for low values)
  const formatPrice = (price: number): string => {
    if (price >= 1) {
      return Math.round(price).toLocaleString();
    } else if (price >= 0.01) {
      return price.toFixed(2);
    } else if (price >= 0.0001) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      
      {/* Blurred Background Image */}
      {thumbnail && (
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${thumbnail})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(25px)',
          }}
        ></div>
      )}

      {/* Overlay to adjust the brightness */}
      <div className="absolute inset-0 bg-black opacity-60 z-10"></div>

      {/* Content on top of background and overlay */}
      <div className="relative w-full h-full flex items-center justify-center z-20">
        
        {/* Main content: Crypto Price and Time */}
        <div className="flex flex-col items-center text-white">
          
          {/* Coin Icon */}
          {currentCoin.image && !imageError ? (
            <img 
              src={currentCoin.image} 
              alt={currentCoin.name}
              className="w-[15vw] h-[15vw] rounded-full mb-2"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
              }}
              onError={(e) => {
                console.error('Failed to load coin image:', {
                  coinName: currentCoin.name,
                  imageUrl: currentCoin.image,
                  error: e
                });
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Successfully loaded coin image:', {
                  coinName: currentCoin.name,
                  imageUrl: currentCoin.image
                });
              }}
            />
          ) : (
            <div 
              className="w-[15vw] h-[15vw] rounded-full mb-2 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600"
              style={{
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))'
              }}
            >
              <span className="text-[6vw] font-bold text-white">
                {currentCoin.symbol}
              </span>
            </div>
          )}
          
          {/* Coin Name */}
          <p className="text-[4vw] font-montserrat font-light opacity-80 mb-1">
            {currentCoin.name}
          </p>
          
          {/* Price */}
          <p className="text-[14vw] font-montserrat font-extrabold leading-none">
            ${formatPrice(currentCoin.price)}
          </p>
          
          {/* 24h Change */}
          <p className={`text-[5vw] font-montserrat font-light leading-none mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '↑' : '↓'} {Math.abs(currentCoin.change24h).toFixed(2)}%
          </p>
          
          {/* Time */}
          <p className="text-[7vw] font-montserrat font-extralight leading-none tracking-tighter mt-3">
            {time || '--:--'}
          </p>

          {/* Coin indicator dots (if multiple coins) */}
          {cryptoData.prices.length > 1 && (
            <div className="flex gap-2 mt-4">
              {cryptoData.prices.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentCoinIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white opacity-30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simple;