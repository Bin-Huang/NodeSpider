import { IPipe } from "../types";
export interface ICsvPipeOption {
    path: string;
    header: {
        [index: string]: (v: string) => string;
    };
}
export default function csvPipe(opts: ICsvPipeOption): IPipe;
