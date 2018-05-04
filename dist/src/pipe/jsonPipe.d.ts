import { IPipe, IPipeItems } from "../interfaces";
export interface IJsonPipeOpts {
    name: string;
    path: string;
    space?: number;
    items: IPipeItems;
}
export default function jsonPipe(opts: IJsonPipeOpts): IPipe;
