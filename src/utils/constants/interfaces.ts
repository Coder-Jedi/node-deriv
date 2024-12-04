import { ILiveTraderInput } from "../../algo_pilot/constants/interfaces.js";

// define interface for message to the job server
export interface IMessage {
    type: 'start' | 'stop' | 'status';
    data: ILiveTraderInput | null;
}