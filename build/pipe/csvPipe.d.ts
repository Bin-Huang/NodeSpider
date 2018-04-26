import { IPipe, IPipeItems } from "../interfaces";
export interface ICsvPipeOpts {
    name: string;
    path: string;
    items?: IPipeItems;
}
export default function csvPipe(opts: ICsvPipeOpts): IPipe;
