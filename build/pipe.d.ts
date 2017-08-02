import { IPipe } from "./types";
export declare function txtPipe(path: string, header: string[]): IPipe;
export declare function jsonPipe(path: string, space?: number): IPipe;
export declare function csvPipe(path: string, header: string[]): IPipe;
