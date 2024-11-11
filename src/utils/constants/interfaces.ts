// define interface for message to the job server
export interface IMessage {
    type: 'start' | 'stop' | 'status';
    data: any;
}