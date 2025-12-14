import React, { useEffect, useState } from "react";
import Simple from "./components/Simple";
import TestPage from "./TestPage/TestPage";
import { createDeskThing } from "@deskthing/client";
import { ToClientData, GenericTransitData, CryptoPriceData } from "./types/Coin";

const DeskThing = createDeskThing<ToClientData, GenericTransitData>();

// Check if we're in development mode (Vite sets this)
const isDevelopment = import.meta.env.DEV;

const App: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoPriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // If in development mode, use the test page
  if (isDevelopment) {
    console.log("🧪 Running in TEST MODE - using mock data");
    return <TestPage />;
  }

  useEffect(() => {
    let invalid = false;
    
    console.log("=== APP MOUNTED, SETTING UP LISTENERS ===");
    
    // Listen for crypto price updates (both from fetch response and periodic updates)
    const removeListener = DeskThing.on('cryptoPrices', (data) => {
      if (invalid) return;
      console.log("=== RECEIVED CRYPTOPRICES EVENT ===", data);
      
      if (!data?.payload) {
        DeskThing.warn(`No crypto data in payload`);
        setIsLoading(false);
        return;
      }
      
      DeskThing.debug(`Crypto data updated`);
      setCryptoData(data.payload);
      setIsLoading(false);
    });

    // Listen for errors
    const removeErrorListener = DeskThing.on('cryptoError', (data) => {
      if (invalid) return;
      console.log("=== RECEIVED CRYPTOERROR ===", data);
      DeskThing.error(`Crypto error: ${data.payload?.message || 'Unknown error'}`);
      setIsLoading(false);
    });

    const fetchInitialData = async () => {
      console.log("=== REQUESTING INITIAL CRYPTO DATA ===");
      try {
        // Send a get request - the listener above will handle the response
        console.log("Sending: { type: 'get', request: 'prices' }");
        DeskThing.send({ type: 'get', request: 'prices' });
        console.log("Request sent successfully");
        
        // Set a backup timeout in case we don't get a response
        setTimeout(() => {
          if (!invalid && isLoading) {
            console.warn("=== NO RESPONSE RECEIVED WITHIN 10 SECONDS ===");
            setIsLoading(false);
          }
        }, 10000);
        
      } catch (error) {
        console.error("Error requesting crypto data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();

    return () => {
      invalid = true;
      removeListener();
      removeErrorListener();
    };
  }, []);

  console.log("Current cryptoData state:", cryptoData);

  if (isLoading) {
    return (
      <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
        <div className="text-white text-xl">Loading crypto data...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 w-screen h-screen flex justify-center items-center">
      <Simple cryptoData={cryptoData} />
    </div>
  );
};

export default App;