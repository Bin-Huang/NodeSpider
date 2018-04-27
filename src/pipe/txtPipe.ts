import * as fs from "fs-extra";
import { IPipe, IPipeItems } from "../interfaces";

export interface ITxtPipeOpts {
  name: string;
  path: string;
  items: IPipeItems;
}

class TxtPipe {
  public name: string;
  public items: IPipeItems;
  private stream: fs.WriteStream;
  private isFirst: boolean;
  constructor(opts: ITxtPipeOpts) {
    this.name = opts.name;
    this.items = opts.items;
    this.stream = fs.createWriteStream(opts.path);
    this.isFirst = true;
  }
  /**
   * 根据表头写入新数据
   * @param {Object} data
   */
  public write(data: any[]) {
    let chunk = "";
    if (this.isFirst) {
      this.isFirst = false;
      const headers = (Array.isArray(this.items)) ? this.items : Object.keys(this.items);
      chunk += headers.reduce((str, c) => `${str}\t${c}`) + "\n";
    }
    chunk += data.reduce((str, c) => `${str}\t${c}`) + "\n";
    this.stream.write(chunk);
  }
  public end() {
    this.stream.end();
  }
}

export default function txtPipe(opts: ITxtPipeOpts): IPipe {
  return new TxtPipe(opts);
}
