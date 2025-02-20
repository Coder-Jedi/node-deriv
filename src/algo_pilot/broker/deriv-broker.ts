import { from, map, Observable, Subject } from "rxjs";
import { DerivStore } from "../store/deriv-store.js";
import { Bar, IBinaryOrder, IBuyContractInput, INewCandleObsData } from "../constants/interfaces.js";


export class DerivBroker {

    store : DerivStore;
    binaryOrders: IBinaryOrder[] = [];

    constructor(store: DerivStore) {
        this.store = store;
    }

    getLiveCandles(symbol: string, timeframeInSeconds: number, history_count: number = 0) : Observable<INewCandleObsData> {
        const candles_history_payload = {
            "ticks_history": symbol,
            "adjust_start_time": 1,
            "count": history_count,
            "end": "latest",
            "start": 1,
            "style": "candles",
            "granularity": timeframeInSeconds
        }

        const candlesHistoryObs = from(this.store.basicApi.subscribe({...candles_history_payload, subscribe: 1}));

        return candlesHistoryObs.pipe(
            map((res:any)=>{
                if(res?.msg_type === 'candles'){
                    const bars : Bar[] = [];
                    for(let i = 0; i < res.candles.length; i++){
                        let candle = res.candles[i];
                        let d = new Date(candle.epoch*1000);
                        if(d.getSeconds()===0){
                            const bar : Bar = {
                                open : parseFloat(candle?.open),
                                high : parseFloat(candle?.high),
                                low : parseFloat(candle?.low),
                                close : parseFloat(candle?.close),
                                volume : parseFloat(candle?.volume),
                                timestamp : parseInt(candle.epoch)*1000
                            };
                            bars.push(bar);
                        }
                    }
                    return {
                        symbol: symbol,
                        timeframeInSeconds: timeframeInSeconds,
                        data: bars
                    }
                }
                if(res?.msg_type === 'ohlc'){
                    let tick = res.ohlc;
                    let d = new Date(tick.epoch*1000);
                    if(d.getSeconds()===0){
                        const bar : Bar = {
                            open : parseFloat(tick?.open),
                            high : parseFloat(tick?.high),
                            low : parseFloat(tick?.low),
                            close : parseFloat(tick?.close),
                            volume : parseFloat(tick?.volume),
                            timestamp : parseInt(tick.epoch)*1000
                        };
                        return {
                            symbol: symbol,
                            timeframeInSeconds: timeframeInSeconds,
                            data: [bar]
                        };
                    }
                }
                
                // default return
                return {
                    symbol: symbol,
                    timeframeInSeconds: timeframeInSeconds,
                    data: []
                };
            })
        );

    }

    // function to buy a contract on Deriv
    // it will take the input as an object of IBuyContractInput, then get the proposal id for the contract from the getProposal function
    // it will also take the signalSnapshot which is the snapshot of the data at the time of signal generation: this is to analyze the performance of the strategy
    // signalSnapshot: whatever indicator and othrer values are used to generate the signal will be passed here
    // then buy the contract using the buy api
    // the function will return the observabele which will emit the response of the buy api
    // example payload for buy api: {"buy": "uw2mk7no3oktoRVVsB4Dz7TQnFfABuFDgO95dlxfMxRuPUsz","price": 100} . where buy is the proposal id and price is the amount to buy the contract
    buyContract(input: IBuyContractInput, signalSnapshot: any): Observable<any> {
        // return a combined observable of getProposal and buy api
        return new Observable((observer) => {
            this.getProposal(input).subscribe((res) => {
                if(res.proposal_id){
                    const buy_payload = {
                        "buy": res.proposal_id,
                        "price": input.amount
                    };
                    const buyObs = from(this.store.basicApi.subscribe({...buy_payload}));
                    buyObs.subscribe({
                        next: (res:any) => {
                            if(res?.msg_type === 'buy'){
                                const order : IBinaryOrder = {
                                    orderId: res?.buy?.contract_id,
                                    symbol: input.symbol,
                                    amount: input.amount,
                                    basis: input.basis,
                                    contract_type: input.contract_type,
                                    status: 'PENDING',
                                    result: null,
                                    expectedPayout: res?.buy?.payout,
                                    actualPayout: null,
                                    startTime: res?.buy?.start_time,
                                    duration: input.duration,
                                    duration_unit: input.duration_unit,
                                    signalSnapshot: signalSnapshot
                                };
                                this.binaryOrders.push(order);
                                this.store.orderLog.addOrder(order);
                                observer.next(order);
                                return;
                            }
                            else if(res?.msg_type === 'proposal_open_contract'){
                                const order = this.binaryOrders.find((order) => order.orderId === res?.proposal_open_contract?.contract_id);

                                if(res?.proposal_open_contract?.is_sold){
                                    if(order){
                                        order.status = 'COMPLETED';
                                        order.actualPayout = res?.proposal_open_contract?.sell_price;
                                        if(res?.proposal_open_contract?.status === 'won'){
                                            order.result = 'WIN';
                                        }else if(res?.proposal_open_contract?.status === 'lost'){
                                            order.result = 'LOSS';
                                        }else {
                                            order.result = 'TIE';
                                        }
                                    }
                                }
                                if(order){
                                    this.store.orderLog.addOrder(order);
                                }
                                observer.next(order);
                                return;
                            }
                            observer.next(res);
                        },
                        error: (err:any) => {
                            observer.error(err);
                        }
                    });
                } else {
                    // add order to the order log with status as FAILED
                    const order : IBinaryOrder = {
                        orderId: "",
                        symbol: input.symbol,
                        amount: input.amount,
                        basis: input.basis,
                        contract_type: input.contract_type,
                        status: 'FAILED',
                        result: null,
                        expectedPayout: 0,
                        actualPayout: 0,
                        startTime: 0,
                        duration: input.duration,
                        duration_unit: input.duration_unit,
                        signalSnapshot: signalSnapshot,
                        optionalMessage: "No proposal id found"
                    };
                    this.binaryOrders.push(order);
                    this.store.orderLog.addOrder(order);
                    
                    observer.error("No proposal id found");
                }
            });
        });
    }

    // function to get the proposal id for the contract
    getProposal(input: IBuyContractInput): Observable<{proposal_id:string, proposal:any}> {
        const proposal_payload = {
            "proposal": 1,
            "amount": input.amount,
            "basis": input.basis,
            "contract_type": input.contract_type,
            "currency": "USD",
            "duration": input.duration,
            "duration_unit": input.duration_unit,
            "symbol": input.symbol
        };

        const proposalObs = from(this.store.basicApi.subscribe({...proposal_payload}));

        return proposalObs.pipe(
            map((res:any)=>{
                if(res?.msg_type === 'proposal'){
                    return {
                        proposal_id: res?.proposal?.id,
                        proposal: res?.proposal
                    };
                }
                return {
                    proposal_id: "",
                    proposal: {}
                };
            })
        );

    }


}