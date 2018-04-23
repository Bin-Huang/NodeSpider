/// <reference types="got" />
/// <reference types="node" />
import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
export interface ICurrent extends ITask {
    done: () => any;
}
export declare type ICallback = (stream: got.GotEmitter & stream.Duplex, current: ICurrent, s: Spider) => any;
export interface IOption {
    callback: ICallback;
    requestOpts?: http.RequestOptions;
}
export default function streamPlan(option: IOption): IPlan;
