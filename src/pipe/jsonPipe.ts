import * as Apjson from "apjson";
import * as fs from "fs-extra";
import { IPipe } from "../interfaces";

// TODO C 加个header？
export interface IJsonPipeOption {
    name: string;
    path: string;
    space: number;
}

class JsonPipe {
    public name: string;
    private stream: fs.WriteStream;
    private space: string;
    private closeSign: boolean;
    private first: boolean;

    constructor(opts: IJsonPipeOption) {
        let { name, path, space } = opts;
        if (typeof path !== "string") {
            throw new TypeError('the string-typed parameter "path" is required');
        }
        fs.ensureFile(path, (err) => {
            if (err) {
                throw err;
            }
            this.stream = fs.createWriteStream(path);
            this.name = name;
            this.space = "";
            while (space > 0) {
                space --;
                this.space += " ";
            }
            this.stream.write("[");
            this.closeSign = false;
            this.first = true;
        });
    }
    public add(data: any) {
        if (this.closeSign) {
            throw new Error("Apjson WARN: can not append any more, because it has been closed.");
        }
        let newStr = JSON.stringify(data, null, this.space + this.space);
        if (this.first) {
            this.first = false;
            newStr = "\n" + newStr;
        } else {
            newStr = ",\n" + newStr;
        }

        newStr = newStr.replace(/\n/g, "\n" + this.space);

        this.stream.write(newStr, () => {
            if (this.closeSign) {
                this.stream.write("\n]");
                this.stream.close();
            }
        });
    }
    public close() {
        this.closeSign = true;
    }
}

export default function jsonPipe(opts: IJsonPipeOption): IPipe {
    return new JsonPipe(opts);
}
