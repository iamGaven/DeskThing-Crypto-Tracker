import {
  AppSettings,
  DESKTHING_EVENTS,
  SETTING_TYPES,
} from "@deskthing/types";
import { createDeskThing } from "@deskthing/server";
import cryptoService from "./CoinService";
import { ToClientData, GenericTransitData } from "./types";

const DeskThing = createDeskThing<GenericTransitData, ToClientData>();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  initialDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 1.5
};

let retryCount = 0;
let retryTimeout: NodeJS.Timeout | null = null;

// Calculate delay with exponential backoff
const getRetryDelay = (attempt: number): number => {
  const delay = Math.min(
    RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelay
  );
  return delay;
};

// Retry mechanism for getting prices
const retryGetPrices = async (attempt: number = 0) => {
  console.log(`=== RETRY GET PRICES (Attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}) ===`);
  
  try {
    const prices = await cryptoService.getPrices();
    
    if (prices && Object.keys(prices).length > 0) {
      console.log("Prices fetched successfully on retry!");
      retryCount = 0; // Reset retry count on success
      DeskThing.send({ type: "cryptoPrices", payload: prices });
      return true;
    } else {
      throw new Error("No prices available");
    }
  } catch (error) {
    console.warn(`Retry attempt ${attempt + 1} failed:`, error);
    
    if (attempt < RETRY_CONFIG.maxRetries - 1) {
      const delay = getRetryDelay(attempt);
      console.log(`Retrying in ${delay}ms...`);
      
      retryTimeout = setTimeout(() => {
        retryGetPrices(attempt + 1);
      }, delay);
    } else {
      console.error("Max retries reached, giving up");
      DeskThing.send({ 
        type: "cryptoError", 
        payload: { message: "Unable to fetch prices after multiple attempts. Please check your configuration." } 
      });
      retryCount = 0;
    }
    return false;
  }
};

// Setup all listeners FIRST, before start is called
console.log("=== INITIALIZING CRYPTO TRACKER SERVER ===");

// Handle get requests from client
DeskThing.on("get", async (data: any) => {
  console.log("=== GET REQUEST RECEIVED ===");
  console.log("Full data object:", JSON.stringify(data, null, 2));
  
  if (data?.request === "prices") {
    console.log("Request is for prices, fetching...");
    try {
      const prices = await cryptoService.getPrices();
      console.log("Prices fetched successfully:", prices ? "YES" : "NO");
      
      if (prices && Object.keys(prices).length > 0) {
        console.log("Sending cryptoPrices to client...");
        retryCount = 0; // Reset on success
        DeskThing.send({ type: "cryptoPrices", payload: prices });
        console.log("cryptoPrices sent!");
      } else {
        console.warn("No prices available, starting retry mechanism");
        await retryGetPrices(0);
      }
    } catch (error) {
      console.error("Error in get handler:", error);
      // Start retry mechanism
      await retryGetPrices(0);
    }
  } else {
    console.log("Request is NOT for prices, ignoring. Request:", data?.request);
  }
});

// Handle settings updates
DeskThing.on(DESKTHING_EVENTS.SETTINGS, async (settings) => {
  console.log("=== SETTINGS UPDATE RECEIVED ===");
  if (settings) {
    console.log("Settings:", settings);
    const payload = settings.payload as any;
    
    cryptoService.updateSettings(settings.payload);
    
    // After settings update, try to fetch prices if coins are configured
    const coins = payload?.coins;
    if (coins && Array.isArray(coins) && coins.length > 0) {
      console.log("Coins configured, attempting to fetch prices...");
      setTimeout(() => {
        retryGetPrices(0);
      }, 1000);
    }
  }
});

// Handle manual refresh requests
DeskThing.on("refreshPrices", async () => {
  console.log("=== MANUAL REFRESH REQUESTED ===");
  await cryptoService.updatePrices();
  
  // Trigger a retry attempt to ensure prices are sent
  setTimeout(() => {
    retryGetPrices(0);
  }, 500);
});

const setupSettings = async () => {
  console.log("Setting up crypto tracker settings...");
  const settings: AppSettings = {
    api_key: {
      label: "CoinGecko API Key",
      id: "api_key",
      value: "",
      description: "Optional API key for CoinGecko. Leave blank to use public API.",
      type: SETTING_TYPES.STRING,
    },
    coins: {
      label: "Cryptocurrencies",
      id: "coins",
      value: ["bitcoin", "ethereum"],
      description: "Select cryptocurrencies to track",
      type: SETTING_TYPES.MULTISELECT,
      options: [
        { label: "Bitcoin (BTC)", value: "bitcoin" },
        { label: "Ethereum (ETH)", value: "ethereum" },
        { label: "Tether (USDT)", value: "tether" },
        { label: "BNB (BNB)", value: "binancecoin" },
        { label: "Solana (SOL)", value: "solana" },
        { label: "XRP (XRP)", value: "ripple" },
        { label: "USD Coin (USDC)", value: "usd-coin" },
        { label: "Cardano (ADA)", value: "cardano" },
        { label: "Dogecoin (DOGE)", value: "dogecoin" },
        { label: "TRON (TRX)", value: "tron" },
        { label: "Avalanche (AVAX)", value: "avalanche-2" },
        { label: "Chainlink (LINK)", value: "chainlink" },
        { label: "Polkadot (DOT)", value: "polkadot" },
        { label: "Polygon (MATIC)", value: "matic-network" },
        { label: "Litecoin (LTC)", value: "litecoin" },
        { label: "Shiba Inu (SHIB)", value: "shiba-inu" },
        { label: "Bitcoin Cash (BCH)", value: "bitcoin-cash" },
        { label: "Uniswap (UNI)", value: "uniswap" },
        { label: "Stellar (XLM)", value: "stellar" },
        { label: "Cosmos (ATOM)", value: "cosmos" },
        { label: "Monero (XMR)", value: "monero" },
        { label: "Ethereum Classic (ETC)", value: "ethereum-classic" },
        { label: "Hedera (HBAR)", value: "hedera-hashgraph" },
        { label: "Filecoin (FIL)", value: "filecoin" },
        { label: "Aptos (APT)", value: "aptos" },
      ],
    },
    currency: {
      label: "Currency",
      id: "currency",
      value: "usd",
      type: SETTING_TYPES.SELECT,
      options: [
        { label: "USD", value: "usd" },
        { label: "EUR", value: "eur" },
        { label: "GBP", value: "gbp" },
        { label: "JPY", value: "jpy" },
      ],
    },
    update_interval: {
      label: "Update Interval (seconds)",
      id: "update_interval",
      value: 60,
      description: "How often to fetch new crypto prices (minimum 10 seconds)",
      type: SETTING_TYPES.NUMBER,
      min: 10,
      max: 3600,
    },
    rotation_interval: {
      label: "Coin Rotation Interval",
      id: "rotation_interval",
      description: "How many seconds to display each coin before switching (when multiple coins configured)",
      type: SETTING_TYPES.NUMBER,
      value: 30,
      min: 5,
      max: 300
    },
  };

  await DeskThing.initSettings(settings);
  console.log("Settings initialized");
};

const start = async () => {
  console.log("=== STARTING CRYPTO TRACKER APP ===");
  cryptoService.setDeskThing(DeskThing);
  await setupSettings();
  
  // Load initial settings after they're set up
  const initialSettings = await DeskThing.getData();
  console.log("Loading initial settings:", initialSettings);
  if (initialSettings) {
    cryptoService.updateSettings(initialSettings);
  }
  
  cryptoService.start();
  console.log("=== CRYPTO TRACKER APP STARTED SUCCESSFULLY ===");
  
  // Wait for service to initialize, then try to fetch prices
  setTimeout(async () => {
    console.log("Initial price fetch attempt...");
    const settings = await DeskThing.getData();
    const coins = (settings as any)?.coins;
    
    if (coins && Array.isArray(coins) && coins.length > 0) {
      console.log("Coins configured, starting initial fetch with retry...");
      await retryGetPrices(0);
    } else {
      console.log("No coins configured yet. Waiting for settings...");
      DeskThing.send({ 
        type: "cryptoError", 
        payload: { message: "Please configure cryptocurrencies in settings" } 
      });
    }
  }, 3000);
};

const stop = async () => {
  console.log("=== STOPPING CRYPTO TRACKER ===");
  
  // Clear any pending retry timeouts
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
  
  cryptoService.stop();
};

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

console.log("=== SERVER FILE LOADED, WAITING FOR START EVENT ===");