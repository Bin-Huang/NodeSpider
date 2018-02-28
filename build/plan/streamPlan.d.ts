/// <reference types="got" />
/// <reference types="node" />
import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import Spider from "../spider";
import { IPlan, ITask } from "../types";
export interface ICurrent extends ITask {
    done: () => any;
}
export declare type ICallback = (stream: got.GotEmitter & stream.Duplex, current: ICurrent, s: Spider) => any;
export interface IOption {
    callback: ICallback;
    requestOpts?: http.RequestOptions;
}
export default function streamPlan(option: IOption | ICallback): IPlan;
