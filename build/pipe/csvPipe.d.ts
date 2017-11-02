import { IPipe } from "../types";
export interface ICsvPipeOption {
    name: string;
    path: string;
    header: {
        [index: string]: (v: string) => string;
    };
}
export default function csvPipe(opts: ICsvPipeOption): IPipe;
