import { IPipe } from "../types";
export interface IJsonPipeOption {
    name: string;
    path: string;
    space: number;
}
export default function jsonPipe(opts: IJsonPipeOption): IPipe;
