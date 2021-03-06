import * as fs from "fs-extra";
import { IPipe, IPipeItems } from "../interfaces";

export interface IJsonPipeOpts {
  name: string;
  path: string;
  space?: number;
  items: IPipeItems;
}

class JsonPipe {
  public name: string;
  public items: IPipeItems;
  private stream: fs.WriteStream;
  private isFirst: boolean;
  private space: number;
  private keys: string[];
  constructor(opts: IJsonPipeOpts) {
    this.name = opts.name;
    this.items = opts.items;
    this.space = (typeof opts.space !== "undefined") ? opts.space : 4;
    this.stream = fs.createWriteStream(opts.path);
    this.isFirst = true;
    this.keys = (Array.isArray(this.items)) ? this.items : Object.keys(this.items);
  }
  public write(data: any[]) {
    const obj: {[x: string]: any} = {};
    for (const [ix, key] of this.keys.entries()) {
      obj[key] = data[ix];
    }
    const str = JSON.stringify(obj, null, this.space);
    if (this.isFirst) {
      this.stream.write(`[\n${str}`);
      this.isFirst = false;
    } else {
      this.stream.write(`,\n${str}`);
    }
  }
  public end() {
    this.stream.end("\n]");
  }
}

export default function jsonPipe(opts: IJsonPipeOpts): IPipe {
  return new JsonPipe(opts);
}
