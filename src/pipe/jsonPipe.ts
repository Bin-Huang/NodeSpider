import * as fs from "fs-extra";
import { IPipe } from "../interfaces";

class JsonPipe {
  private stream: fs.WriteStream;
  private isFirst: boolean;
  private space: number;
  constructor(path: string, space = 4) {
    if (typeof path !== "string") {
      throw new TypeError('the string-typed parameter "path" is required');
    }
    this.space = space;
    this.stream = fs.createWriteStream(path);
    this.isFirst = true;
  }
  public convert(data: object) {
    return data;
  }
  public write(data: object) {
    const str = JSON.stringify(data, null, this.space);
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

export default function jsonPipe(path: string, space?: number): IPipe {
  return new JsonPipe(path, space);
}
