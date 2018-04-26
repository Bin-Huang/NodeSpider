import * as fs from "fs-extra";
import { IPipe, IPipeItems } from "../interfaces";

export interface ICsvPipeOpts {
  name: string;
  path: string;
  items?: IPipeItems;
}

class CsvPipe {
  public name: string;
  public items?: IPipeItems;
  private stream: fs.WriteStream;
  private header: string[];
  constructor(opts: ICsvPipeOpts) {
    this.name = opts.name;
    this.items = opts.items;
    this.stream = fs.createWriteStream(opts.path);
    this.header = [];
  }
  /**
   * 根据表头写入新数据
   * @param {Object} data
   */
  public write(data: object) {
    if (this.header.length === 0) {
      this.header = Object.keys(data);
      this.write(this.header);
    }
    const items = this.header.map((key) => data[key]);
    const chunk = items.reduce((str, c) => `${str},${c}`) + "\n";
    this.stream.write(chunk);
  }
  public end() {
    this.stream.end();
  }
}

export default function csvPipe(opts: ICsvPipeOpts): IPipe {
  return new CsvPipe(opts);
}
