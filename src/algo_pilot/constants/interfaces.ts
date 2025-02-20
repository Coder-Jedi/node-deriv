
//define interface for the constructor input
export interface ILiveTraderInput {
    botId: string,
    broker: string,
    strategy: string,
    symbol: string,
    timeframe: string,
    additionalParams?: any,
    configurableParams?: any
}

// define interface for Bar representing the candle/tick data
export interface Bar {
    timestamp: number,
    open: number,
    high: number,
    low: number,
    close: number,
    volume: number
}

//define interface for observable which will emit when the new candle/tick data is added in the TimeSeries maintained in the feed class
// it will have a property for symbol, timeframe and the new candle/tick data
export interface INewCandleObsData {
    symbol: string,
    timeframeInSeconds: number,
    data: Bar[]
}

//define interface for the symbol and timeframe pair
// supportingSymbolAndTF is an array of symbols and timeframes that are also required for the strategy to work. So the strategy will be provided with the data of these symbols and timeframes as well
export interface ISymbolAndTF {
    symbol: string,
    timeframe: number,
    supportingSymbolAndTF: {symbol:string, timeframe:number}[]
}

// define interface for the buy contract input
export interface IBuyContractInput {
    symbol: string,
    amount: number,
    basis: string,
    contract_type: string,
    duration: number,
    duration_unit: string
}

// define interface for the Binary Order
export interface IBinaryOrder {
    orderId: string;
    symbol: string;
    amount: number;
    basis: string,
    contract_type: string,
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    result: 'WIN' | 'LOSS' | 'TIE' | null;
    expectedPayout: number | null;
    actualPayout: number | null;
    startTime: number;
    duration: number;
    duration_unit: string;
    signalSnapshot: any;
    optionalMessage?: string;               // can be used in case of failure
}

// define interface for the binary order document to be added in the mongodb
export interface IBinaryOrderDoc {
    botId: string,         // the unique id of the bot for which the order is placed
    broker: string,
    strategy: string,
    symbol: string,
    timeframe: string,
    orderId: string,
    binaryOrder: IBinaryOrder
}

// define interface for the binary bot document to be added in the mongodb
export interface IBinaryBotDoc {
    broker: string,
    strategy: string,
    symbol: string,
    timeframe: string,
    botId: string,
    botName: string,
    additionalParams: any,
    configurableParams: any,
    // status: 'ACTIVE' | 'INACTIVE',
    runningLogs: IRunningLog[],
}

// define interface for the running logs of the bot
export interface IRunningLog {
    type: 'START' | 'STOP',
    timestamp: number,
    message: string,
    data: any
}