import { IPipe } from "../types";
export interface ITxtPipeOption {
    path: string;
    header: {
        [index: string]: (v: string) => string;
    };
}
export default function txtPipe(opts: ITxtPipeOption): IPipe;
