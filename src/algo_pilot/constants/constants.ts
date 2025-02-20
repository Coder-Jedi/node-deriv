import { DerivFeed } from "../feed/deriv-feed.js";
import { DerivStore } from "../store/deriv-store.js";
import { TripleEmaStrategy } from "../strategy/triple-ema.strategy.js";


/**
 * VALID_OPTIONS contains the configuration options for brokers, strategies, configurableParams, and additional parameters.
 */
export const VALID_OPTIONS: any = {
  brokers: [
    {
      brokerName: "Deriv",
      desc: "Deriv Broker",
      storeClass: DerivStore, // The class representing the broker store
      strategies: [
        {
          strategyName: "triple_ema",
          desc: "Triple EMA Strategy",
          strategyClass: TripleEmaStrategy, // The class representing the test strategy
          feedClass: DerivFeed, // The feed class associated with the test strategy
          contract_types: ["CALE", "PUTE"],
          supportingFeedKeys: ["T2"],
          configurableParams: [
            {
              name: "T2",
              type: "number",
              title: "T2 Timeframe(in seconds)",
              desc: "The timeframe for T2 feed (tide)",
              required: true
            },
            {
              name: "duration",
              type: "number",
              title: "Duration",
              desc: "The duration for the contract in seconds",
              required: false,
              default: 120
            },
            {
              name: "payout",
              type: "number",
              title: "Payout",
              desc: "The minimum payout for the contract",
              required: false,
              default: 0.90
            },
            {
              name: "ema1",
              type: "number",
              title: "EMA 1",
              desc: "The period for EMA 1",
              required: false,
              default: 5
            },
            {
              name: "ema2",
              type: "number",
              title: "EMA 2",
              desc: "The period for EMA 2",
              required: false,
              default: 13
            },
            {
              name: "ema3",
              type: "number",
              title: "EMA 3",
              desc: "The period for EMA 3",
              required: false,
              default: 21
            },
          ],
        }
      ],
      additionalParams: [
{ 
          name: 'appId',
          type: 'number', 
          title: 'Application ID', 
          desc: 'The application ID provided by the broker.',
          required: true,
        },
        { 
          name: 'authToken',
          type: 'text', 
          title: 'Authentication Token', 
          desc: 'The authentication token provided by the broker.',
          required: true,
        }
      ]
    }
  ]
};

// function to check if the parameters provided in the bot configuration are valid
// the function will check: broker, strategy, configurableParams, and additionalParams
/**
 * Function to check if the parameters provided in the bot configuration are valid.
 * @param botConfig The bot configuration object.
 * @returns The error message if the parameters are invalid, or null if the parameters are valid.
 */
export function checkBotConfig(botConfig: any): string | null {
  // broker check
  if (!botConfig.broker || !VALID_OPTIONS.brokers.find((b: any) => b.brokerName === botConfig.broker)) {
    return "Invalid broker";
  }
  const broker = VALID_OPTIONS.brokers.find((b: any) => b.brokerName === botConfig.broker);
  // strategy check
  if (!botConfig.strategy || !broker.strategies.find((s: any) => s.strategyName === botConfig.strategy)) {
    return "Invalid strategy";
  }
  const strategy = broker.strategies.find((s: any) => s.strategyName === botConfig.strategy);

  // symbol and timeframe check
  if (!botConfig.symbol || !botConfig.timeframe) {
    return "Missing symbol or timeframe";
  }
  // check if timeframe is a number
  if (isNaN(botConfig.timeframe)) {
    return "Timeframe should be a number";
  }

  // check if all the required configurableParams are present
  if(strategy.configurableParams.length && !botConfig.configurableParams) {
    return "Missing Configurable Parameters";
  }
  // check if all the configurableParams which are required are present
  for (let param of strategy.configurableParams) {
    if (param.required && !botConfig.configurableParams[param.name]) {
        return `Missing Configurable Parameter: ${param.name}`;
    }
    // check if the type of the configurableParam is correct
    if (botConfig.configurableParams[param.name] && param.type === "number" && isNaN(botConfig.configurableParams[param.name])) {
      return `Invalid type for Configurable Parameter: ${param.name}`;
    }
  }

  // check if all the required additionalParams are present
  if(broker.additionalParams.length && !botConfig.additionalParams) {
    return "Missing Additional Parameters";
  }
  // check if all the additionalParams which are required are present
  for (let param of broker.additionalParams) {
    if (param.required && !botConfig.additionalParams[param.name]) {
        return `Missing Additional Parameter: ${param.name}`;
    }
    // check if the type of the additionalParam is correct
    if (botConfig.additionalParams[param.name] && param.type === "number" && isNaN(botConfig.additionalParams[param.name])) {
      return `Invalid type for Additional Parameter: ${param.name}`;
    }
  }

  return null;
}
