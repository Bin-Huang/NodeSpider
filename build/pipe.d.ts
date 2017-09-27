import { IPipe } from "./types";
export declare function txtPipe(name: string, path: string, header: string[]): IPipe;
export declare function jsonPipe(name: string, path: string, space?: number): IPipe;
export declare function csvPipe(name: string, path: string, header: string[]): IPipe;
