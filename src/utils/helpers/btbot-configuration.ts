
// The function will take in VALID_OPTIONS and return the configuration JSON.
/**
 * Function to create the configuration JSON based on VALID_OPTIONS.
 * @param validOptions - The valid configurations for use in live trading class
 * @returns The configuration JSON.
 * 
 */
export const createConfigurationJson = (validOptions: any) => {
  // Create the configuration JSON
  let input = JSON.parse(JSON.stringify(validOptions)); // Deep copy the object
  // remove keys: storeClass, strategyClass, feedClass
  input.brokers.forEach((broker: any) => {
    delete broker.storeClass;
    broker.strategies.forEach((strategy: any) => {
      delete strategy.strategyClass;
      delete strategy.feedClass;
    });
  });
  return input;
}
