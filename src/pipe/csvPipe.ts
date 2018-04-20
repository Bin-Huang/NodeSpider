import * as fs from "fs-extra";
import { IPipe } from "../interfaces";

class CsvPipe {
  /**
   * Creates an instance of csv pipe.
   * @param {string} path 写入文件路径
   * @memberOf TxtTable
   */
  private stream: fs.WriteStream;
  private header: string[];
  constructor(path: string) {
    if (typeof path !== "string") {
      throw new Error('the string-typed parameter "path" is required');
    }
    this.stream = fs.createWriteStream(path);
    this.header = [];
  }
  public convert(data: object): any[] {
    if (this.header.length === 0) {
      this.header = Object.keys(data);
      this.write(this.header);
    }
    return this.header.map((key) => data[key]);
  }
  /**
   * 根据表头写入新数据
   * @param {Object} data
   */
  public write(items: any[]) {
    const chunk = items.reduce((str, c) => `${str},${c}`) + "\n";
    this.stream.write(chunk);
  }
  public end() {
    this.stream.end();
  }
}

export default function csvPipe(path: string): IPipe {
  return new CsvPipe(path);
}
