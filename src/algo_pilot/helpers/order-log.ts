// the OrderLog class will maintain the log of the orders that are placed by the strategy, but are yet to be updated in the mongodb
// it will act as a medium between the strategy and the livetrader
// it will maintain the orders in the array of orders
// it will have methods to add the order to the array(called by strategy), get all the orders (called by function adding orders to mongodb), clear the orders(called after adding current orders to mongodb)

// export interface IBinaryOrderDoc {
//     broker: string,
//     strategy: string,
//     symbol: string,
//     timeframe: string,
//     orderId: string,
//     binaryOrder: IBinaryOrder
// }

import { IBinaryOrder, IBinaryOrderDoc, ILiveTraderInput } from "../constants/interfaces.js";

export class OrderLog {
    orders: IBinaryOrderDoc[] = [];
    liveTraderInput: ILiveTraderInput;

    constructor(liveTraderInput: ILiveTraderInput){
        this.liveTraderInput = liveTraderInput;
    }

    // if orderId already exists, update the order
    addOrder(order: IBinaryOrder){
        let orderDoc: IBinaryOrderDoc = {
            broker: this.liveTraderInput.broker,
            strategy: this.liveTraderInput.strategy,
            symbol: order.symbol,
            timeframe: this.liveTraderInput.timeframe,
            orderId: order.orderId,
            binaryOrder: order
        }

        let orderIndex = this.orders.findIndex((orderDoc: IBinaryOrderDoc) => orderDoc.orderId === order.orderId);
        if(orderIndex !== -1){
            this.orders[orderIndex] = orderDoc;
        }else{
            this.orders.push(orderDoc);
        }
    }

    getOrders(){
        return this.orders;
    }

    clearOrders(){
        this.orders = [];
    }
}