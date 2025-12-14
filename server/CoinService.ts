import { DeskThingClass } from "@deskthing/server";
import { ToClientData, GenericTransitData, CryptoPriceData, CryptoPrice } from "./types";
import * as fs from 'fs';
import * as path from 'path';

class CryptoService {
  private priceData: CryptoPriceData | null = null;
  private lastUpdateTime: Date | null = null;
  private updateIntervalId: NodeJS.Timeout | null = null;
  private static instance: CryptoService | null = null;
  private DeskThing: DeskThingClass<GenericTransitData, ToClientData> | null = null;
  
  private apiKey: string = "";
  private coins: string[] = [];
  private currency: string = "usd";
  private updateInterval: number = 60; // seconds
  private rotationInterval: number = 30; // seconds - how often to switch between coins on display
  private imageCache: Map<string, string> = new Map(); // Cache for base64 images

  private constructor() {}

  static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  public setDeskThing(deskThing: DeskThingClass<GenericTransitData, ToClientData>) {
    this.DeskThing = deskThing;
  }

  public start() {
    console.log("Starting crypto service...");
    this.updatePrices();
    this.scheduleUpdates();
  }

  private async downloadImageAsBase64(imageUrl: string): Promise<string | null> {
    // Check cache first
    if (this.imageCache.has(imageUrl)) {
      return this.imageCache.get(imageUrl)!;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.error(`Failed to download image: ${response.status}`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      // Determine image type from URL
      const ext = imageUrl.split('.').pop()?.split('?')[0] || 'png';
      const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
      
      const base64Image = `data:${mimeType};base64,${base64}`;
      
      // Cache the result
      this.imageCache.set(imageUrl, base64Image);
      
      return base64Image;
    } catch (error) {
      console.error(`Error downloading image from ${imageUrl}:`, error);
      return null;
    }
  }

  public async updatePrices() {
    console.log("Updating crypto prices...");

    if (!this.coins || this.coins.length === 0) {
      console.warn("No coins configured! Skipping crypto price update");
      
      // Send empty data to client
      if (this.DeskThing) {
        this.DeskThing.send({ 
          type: "cryptoPrices", 
          payload: {
            prices: [],
            currency: this.currency.toUpperCase(),
            lastUpdated: Date.now(),
            rotationInterval: this.rotationInterval,
          }
        });
      }
      return;
    }

    try {
      // Use the /coins/markets endpoint which includes images and more data
      const coinIds = this.coins.map(c => c.toLowerCase()).join(",");
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${this.currency}&ids=${coinIds}&order=market_cap_desc&per_page=${this.coins.length}&page=1&sparkline=false&price_change_percentage=1h,24h,7d&locale=en&precision=2`;

      console.log(`Fetching crypto data from CoinGecko API for: ${coinIds}`);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add API key if provided - ensure it's a string and not empty
      if (this.apiKey && typeof this.apiKey === 'string' && this.apiKey.trim() !== "") {
        headers["x-cg-demo-api-key"] = this.apiKey.trim();
        console.log("Using CoinGecko API key");
      } else {
        console.log("Using CoinGecko public API (no key)");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(
          `CoinGecko API request failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(`Crypto data received: ${data.length} coins`);

      // Transform the data into our format and download images
      const prices: CryptoPrice[] = await Promise.all(data.map(async (coin: any) => {
        // Get the small image URL
        let imageUrl = coin.image || "";
        if (imageUrl.includes('/large/')) {
          imageUrl = imageUrl.replace('/large/', '/small/');
        } else if (imageUrl.includes('/thumb/')) {
          imageUrl = imageUrl.replace('/thumb/', '/small/');
        }
        
        // Download and convert image to base64
        let base64Image = null;
        if (imageUrl) {
          console.log(`Downloading image for ${coin.name}...`);
          base64Image = await this.downloadImageAsBase64(imageUrl);
          if (base64Image) {
            console.log(`Successfully converted ${coin.name} image to base64`);
          }
        }
        
        return {
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price || 0,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          volume24h: coin.total_volume || 0,
          lastUpdated: coin.last_updated ? new Date(coin.last_updated).getTime() : Date.now(),
          image: base64Image || imageUrl, // Use base64 if available, fallback to URL
          rank: coin.market_cap_rank || 0,
          high24h: coin.high_24h || 0,
          low24h: coin.low_24h || 0,
          priceChange24h: coin.price_change_24h || 0,
          circulatingSupply: coin.circulating_supply || 0,
          totalSupply: coin.total_supply || 0,
          maxSupply: coin.max_supply || null,
          ath: coin.ath || 0,
          athChangePercentage: coin.ath_change_percentage || 0,
          athDate: coin.ath_date ? new Date(coin.ath_date).getTime() : null,
          atl: coin.atl || 0,
          atlChangePercentage: coin.atl_change_percentage || 0,
          atlDate: coin.atl_date ? new Date(coin.atl_date).getTime() : null,
          fullyDilutedValuation: coin.fully_diluted_valuation || null,
          marketCapChange24h: coin.market_cap_change_24h || 0,
          marketCapChangePercentage24h: coin.market_cap_change_percentage_24h || 0,
        };
      }));

      this.priceData = {
        prices,
        currency: this.currency.toUpperCase(),
        lastUpdated: Date.now(),
        rotationInterval: this.rotationInterval, // Send rotation interval to client
      };

      this.lastUpdateTime = new Date();

      console.log(`Successfully fetched ${prices.length} crypto prices with images`);
      
      if (this.DeskThing) {
        console.log("Sending crypto prices to client");
        this.DeskThing.send({ type: "cryptoPrices", payload: this.priceData });
      } else {
        console.warn("DeskThing not set, cannot send prices to client");
      }
    } catch (error) {
      console.error(`Failed to fetch crypto prices:`, error);
      if (this.DeskThing) {
        this.DeskThing.send({
          type: "cryptoError",
          payload: { message: `Failed to fetch prices: ${error}` },
        });
      }
    }
  }

  private scheduleUpdates() {
    // Clear existing interval
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
    }

    const intervalMs = this.updateInterval * 1000;
    console.log(`Scheduling crypto updates every ${this.updateInterval} seconds`);

    // Set up recurring updates
    this.updateIntervalId = setInterval(() => {
      this.updatePrices();
    }, intervalMs);
  }

  public updateSettings(settings: any) {
    if (!settings) {
      console.log("No settings provided");
      return;
    }

    try {
      console.log("Updating crypto service settings");

      // Extract settings - handle both direct values and nested .value properties
      // Ensure apiKey is always a string
      const rawApiKey = settings.api_key?.value ?? settings.api_key;
      const newApiKey = rawApiKey ? String(rawApiKey) : "";
      
      const rawCoinsStr = settings.coins?.value ?? settings.coins;
      const newCoinsStr = rawCoinsStr ? String(rawCoinsStr) : "";
      
      const rawCurrency = settings.currency?.value ?? settings.currency;
      const newCurrency = rawCurrency ? String(rawCurrency) : "usd";
      
      const rawInterval = settings.update_interval?.value ?? settings.update_interval;
      const newInterval = parseInt(String(rawInterval || "60"));

      const rawRotationInterval = settings.rotation_interval?.value ?? settings.rotation_interval;
      const newRotationInterval = parseInt(String(rawRotationInterval || "30"));

      // Parse coins (comma-separated, trim whitespace, lowercase)
      // Allow empty coins array
      const newCoins = newCoinsStr
        ? newCoinsStr
            .split(",")
            .map((c: string) => c.trim().toLowerCase())
            .filter((c: string) => c.length > 0)
        : [];

      const changes =
        newApiKey !== this.apiKey ||
        JSON.stringify(newCoins) !== JSON.stringify(this.coins) ||
        newCurrency !== this.currency ||
        newInterval !== this.updateInterval ||
        newRotationInterval !== this.rotationInterval;

      this.apiKey = newApiKey;
      this.coins = newCoins;
      this.currency = newCurrency;
      this.updateInterval = newInterval;
      this.rotationInterval = newRotationInterval;

      if (changes) {
        console.log(
          `Settings changed - Coins: ${this.coins.length > 0 ? this.coins.join(",") : "(empty)"}, Currency: ${this.currency}, Update Interval: ${this.updateInterval}s, Rotation Interval: ${this.rotationInterval}s`
        );
        // Clear image cache on settings change
        this.imageCache.clear();
        // Restart updates with new settings
        this.scheduleUpdates();
        this.updatePrices();
      } else {
        console.log("No settings changed");
      }
    } catch (error) {
      console.error("Error updating crypto settings: " + error);
    }
  }

  public stop() {
    console.log("Stopping crypto service...");
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
    this.lastUpdateTime = null;
    this.imageCache.clear();
  }

  public async getPrices(): Promise<CryptoPriceData | null> {
    // If it's been more than the update interval since the last update, refresh
    const intervalMs = this.updateInterval * 1000;
    if (
      !this.lastUpdateTime ||
      new Date().getTime() - this.lastUpdateTime.getTime() > intervalMs
    ) {
      console.log("Cache expired, fetching fresh crypto prices...");
      await this.updatePrices();
    } else {
      console.log("Returning cached crypto prices");
    }
    return this.priceData;
  }
}

export default CryptoService.getInstance();