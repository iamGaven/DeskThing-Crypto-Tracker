import {
  AppSettings,
  DESKTHING_EVENTS,
  SETTING_TYPES,
} from "@deskthing/types";
import { createDeskThing } from "@deskthing/server";
import cryptoService from "./CoinService";
import { ToClientData, GenericTransitData } from "./types";

const DeskThing = createDeskThing<GenericTransitData, ToClientData>();

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
      
      if (prices) {
        console.log("Sending cryptoPrices to client...");
        DeskThing.send({ type: "cryptoPrices", payload: prices });
        console.log("cryptoPrices sent!");
      } else {
        console.warn("No prices available, sending error");
        DeskThing.send({ 
          type: "cryptoError", 
          payload: { message: "No prices available yet" } 
        });
      }
    } catch (error) {
      console.error("Error in get handler:", error);
      DeskThing.send({ 
        type: "cryptoError", 
        payload: { message: `Error: ${error}` } 
      });
    }
  } else {
    console.log("Request is NOT for prices, ignoring. Request:", data?.request);
  }
});

// Handle settings updates
DeskThing.on(DESKTHING_EVENTS.SETTINGS, (settings) => {
  console.log("=== SETTINGS UPDATE RECEIVED ===");
  if (settings) {
    console.log("Settings:", settings);
    cryptoService.updateSettings(settings.payload);
  }
});

// Handle manual refresh requests
DeskThing.on("refreshPrices", async () => {
  console.log("=== MANUAL REFRESH REQUESTED ===");
  await cryptoService.updatePrices();
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
      value: "ethereum",
      description: "Comma-separated list of coin IDs from CoinGecko (e.g., bitcoin,ethereum,solana)",
      type: SETTING_TYPES.STRING,
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
  
  // Test send to confirm communication works
  setTimeout(() => {
    console.log("Sending test message to client...");
    DeskThing.send({ 
      type: "cryptoError", 
      payload: { message: "Server is alive and running!" } 
    });
  }, 2000);
};
const stop = async () => {
  console.log("=== STOPPING CRYPTO TRACKER ===");
  cryptoService.stop();
};

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

console.log("=== SERVER FILE LOADED, WAITING FOR START EVENT ===");