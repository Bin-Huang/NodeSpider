import { IPipe } from "../types";
export interface ITxtPipeOption {
    name: string;
    path: string;
    header: {
        [index: string]: (v: string) => string;
    };
}
export default function txtPipe(opts: ITxtPipeOption): IPipe;
