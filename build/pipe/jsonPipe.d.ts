import { IPipe } from "../types";
export interface IJsonPipeOption {
    path: string;
    space: number;
}
export default function jsonPipe(opts: IJsonPipeOption): IPipe;
