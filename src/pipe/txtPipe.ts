import * as fs from "fs-extra";
import { IPipe, IPipeItems } from "../interfaces";

export interface ITxtPipeOpts {
  name: string;
  path: string;
  items?: IPipeItems;
}

class TxtPipe {
  public name: string;
  public items?: IPipeItems;
  private stream: fs.WriteStream;
  private header: string[];
  constructor(opts: ITxtPipeOpts) {
    this.name = opts.name;
    this.items = opts.items;
    this.stream = fs.createWriteStream(opts.path);
    this.header = [];
  }
  /**
   * 根据表头写入新数据
   * @param {Object} data
   */
  public write(data: any) {
    if (this.header.length === 0) {
      this.header = Object.keys(data);
      this.write(this.header);
    }
    const items = this.header.map((key) => data[key]);
    const chunk = items.reduce((str, c) => `${str}\t${c}`) + "\n";
    this.stream.write(chunk);
  }
  public end() {
    this.stream.end();
  }
}

export default function txtPipe(opts: ITxtPipeOpts): IPipe {
  return new TxtPipe(opts);
}
