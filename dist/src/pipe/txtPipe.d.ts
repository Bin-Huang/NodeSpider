import { IPipe, IPipeItems } from "../interfaces";
export interface ITxtPipeOpts {
    name: string;
    path: string;
    items: IPipeItems;
}
export default function txtPipe(opts: ITxtPipeOpts): IPipe;
