/// <reference types="got" />
/// <reference types="node" />
import * as got from "got";
import * as http from "http";
import * as stream from "stream";
import { IPlan, ITask } from "../interfaces";
import Spider from "../spider";
export interface IOption {
    name: string;
    handle: (stream: got.GotEmitter & stream.Duplex, done: (e?: Error) => any, current: ITask, s: Spider) => any;
    retries?: number;
    failed?: (error: Error, task: ITask, spider: Spider) => any;
    requestOpts?: http.RequestOptions;
}
export default function streamPlan({name, requestOpts, handle, retries, failed}: IOption): IPlan;
