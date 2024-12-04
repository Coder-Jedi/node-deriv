import { IValidOptions, VALID_OPTIONS } from '../../algo_pilot/constants/constants.js';

// Interface definitions for the configuration JSON structure

/**
 * Interface representing the configuration JSON structure.
 */
interface Configuration {
  brokers: Broker[];
}

/**
 * Interface representing a broker in the configuration.
 */
interface Broker {
  name: string;
  strategies: Strategy[];
  additionalParams?: Record<string, Param>;
}

/**
 * Interface representing a strategy in the configuration.
 */
interface Strategy {
  name: string;
  feedClass: string;
  symbols: Symbol[];
}

/**
 * Interface representing a symbol in the configuration.
 */
interface Symbol {
  symbol: string;
  timeframes: Timeframe[];
}

/**
 * Interface representing a timeframe for a symbol in the configuration.
 */
interface Timeframe {
  timeframe: string;
  timeframeInSeconds: number;
  supportingSymbolAndTF: SupportingSymbolAndTF[];
}

/**
 * Interface representing a supporting symbol and timeframe in the configuration.
 */
interface SupportingSymbolAndTF {
  symbol: string;
  timeframe: string;
  timeframeInSeconds: number;
}

/**
 * Interface representing additional parameters required for a broker.
 */
interface Param {
  type: string;
  required: boolean;
  title: string;
  desc: string;
}

/**
 * Function to create the configuration JSON based on VALID_OPTIONS.
 * @param {IValidOptions} validOptions - The valid configurations for use in live trading class
 * @returns {Configuration} The configuration JSON.
 * 
 */
export const createConfigurationJson = (validOptions:IValidOptions): Configuration => {
  // Map over the brokers in VALID_OPTIONS.stores to create the brokers array
  const brokers: Broker[] = Object.keys(validOptions.stores).map(brokerName => {
    const broker = validOptions.stores[brokerName];
    
    // Map over the strategies for each broker to create the strategies array
    const strategies: Strategy[] = Object.keys(broker.strategies).map(strategyName => {
      const strategy = broker.strategies[strategyName];
      
      // Map over the symbols for each strategy to create the symbols array
      const symbols: Symbol[] = strategy.symbols.map(symbol => ({
        symbol: symbol.symbol,
        timeframes: [{
          timeframe: symbol.timeframe,
          timeframeInSeconds: symbol.timeframeInSeconds,
          supportingSymbolAndTF: symbol.supportingSymbolAndTF.map(supporting => ({
            symbol: supporting.symbol,
            timeframe: supporting.timeframe,
            timeframeInSeconds: supporting.timeframeInSeconds
          }))
        }]
      }));
      
      // Return the strategy object
      return {
        name: strategyName,
        feedClass: strategy.feedClass.name,
        symbols
      };
    });

    // Get the additional parameters for the broker, if any
    const additionalParams: Record<string, Param> = broker.additionalParams || {};

    // Return the broker object
    return {
      name: brokerName,
      strategies,
      additionalParams: Object.keys(additionalParams).length ? additionalParams : undefined
    };
  });

  // Return the configuration JSON
  return { brokers };
}

