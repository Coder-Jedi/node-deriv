import { BaseFeed } from "../feed/base-feed.js";
import { DerivFeed } from "../feed/deriv-feed.js";
import { DerivStore } from "../store/deriv-store.js";
import { BaseStrategy } from "../strategy/base-strategy.js";
import { TestDerivStrategy } from "../strategy/test-deriv-strategy.js";

// Interface definitions for the structure of VALID_OPTIONS

/**
 * Interface representing the structure of VALID_OPTIONS.
 */
export interface IValidOptions {
  stores: {
    [brokerName: string]: IBrokerOptions;
  };
}

/**
 * Interface representing the options for each broker.
 */
export interface IBrokerOptions {
  class: any;
  strategies: {
    [strategyName: string]: IStrategyOptions;
  };
  additionalParams: {
    [paramName: string]: IParamOptions;
  };
}

/**
 * Interface representing the options for each strategy.
 */
export interface IStrategyOptions {
  class: any;
  feedClass: any;
  symbols: ISymbolOptions[];
}

/**
 * Interface representing the options for each symbol.
 */
export interface ISymbolOptions {
  symbol: string;
  timeframe: string;
  timeframeInSeconds: number;
  supportingSymbolAndTF: ISupportingSymbolAndTFOptions[];
}

/**
 * Interface representing the supporting symbol and timeframe options.
 */
export interface ISupportingSymbolAndTFOptions {
  symbol: string;
  timeframe: string;
  timeframeInSeconds: number;
}

/**
 * Interface representing the additional parameters required for a broker.
 */
export interface IParamOptions {
  type: string;
  required: boolean;
  title: string;
  desc: string;
}

// Definition of VALID_OPTIONS with detailed comments

/**
 * VALID_OPTIONS contains the configuration options for brokers, strategies, symbols, and additional parameters.
 */
export const VALID_OPTIONS: IValidOptions = {
  stores: {
    "deriv": {
      class: DerivStore, // The class representing the broker store
      strategies: {
        "base": {
          class: BaseStrategy, // The class representing the strategy
          feedClass: BaseFeed, // The feed class associated with the strategy
          symbols: [
            {
              symbol: "EURUSD", // The symbol name
              timeframe: "M1", // The timeframe name
              timeframeInSeconds: 60, // The timeframe duration in seconds
              supportingSymbolAndTF: [
                {
                  symbol: "EURUSD", // The supporting symbol name
                  timeframe: "M5", // The supporting timeframe name
                  timeframeInSeconds: 300 // The supporting timeframe duration in seconds
                }
              ]
            }
          ]
        },
        "test_deriv": {
          class: TestDerivStrategy, // The class representing the test strategy
          feedClass: DerivFeed, // The feed class associated with the test strategy
          symbols: [
            {
              symbol: "R_10", // The symbol name
              timeframe: "M1", // The timeframe name
              timeframeInSeconds: 60, // The timeframe duration in seconds
              supportingSymbolAndTF: [
                {
                  symbol: "R_10", // The supporting symbol name
                  timeframe: "M2", // The supporting timeframe name
                  timeframeInSeconds: 120 // The supporting timeframe duration in seconds
                },
                {
                  symbol: "R_10", // The supporting symbol name
                  timeframe: "M3", // The supporting timeframe name
                  timeframeInSeconds: 180 // The supporting timeframe duration in seconds
                }
              ]
            }
          ]
        }
      },
      additionalParams: {
        appId: { 
          type: 'number', 
          required: true, 
          title: 'Application ID', 
          desc: 'The application ID provided by the broker.' 
        },
        authToken: { 
          type: 'string', 
          required: true, 
          title: 'Authentication Token', 
          desc: 'The authentication token provided by the broker.' 
        }
      }
    }
  }
};

// function to check if the parameters provided in the bot configuration are valid
// it will check if the broker, strategy, symbol and timeframe are valid
// it will also check if the additional parameters provided are valid
// it will return the error message if the parameters are invalid
// it will return null if the parameters are valid
/**
 * Function to check if the parameters provided in the bot configuration are valid.
 * @param botConfig The bot configuration object.
 * @returns The error message if the parameters are invalid, or null if the parameters are valid.
 */
export function checkBotConfig(botConfig: any): string | null {
  if (!botConfig.broker || !VALID_OPTIONS.stores[botConfig.broker]) {
    return "Invalid broker";
  }
  if (!botConfig.strategy || !VALID_OPTIONS.stores[botConfig.broker].strategies[botConfig.strategy]) {
    return "Invalid strategy";
  }
  if (!botConfig.symbol || !botConfig.timeframe) {
    return "Symbol and timeframe are required";
  }
  if (!VALID_OPTIONS.stores[botConfig.broker].strategies[botConfig.strategy].symbols.find((symbol: ISymbolOptions) => symbol.symbol === botConfig.symbol && symbol.timeframe === botConfig.timeframe)) {
    return "Invalid symbol or timeframe";
  }
  if (VALID_OPTIONS.stores[botConfig.broker].additionalParams) {
    for (const paramKey in VALID_OPTIONS.stores[botConfig.broker].additionalParams) {
      const param = VALID_OPTIONS?.stores[botConfig.broker]?.additionalParams[paramKey];

      if (param && param.required && !(botConfig["params"] && botConfig["params"][paramKey]) ) {
        return `Missing parameter: ${paramKey}: ${param.title}`;
      }
    }
  }
  return null;
}
