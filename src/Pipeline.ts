
export type IFunc = (data: any) => any

export default class Pipeline {
  private pipes: Pipeline[]
  private func: (data: any) => any
  constructor(func: Pipeline | IFunc = (d) => d) {
    this.pipes = []
    if (func instanceof Pipeline) {
      this.func = (d) => d
      this.pipes.push(func)
    } else {
      this.func = func
    }
  }

  public to(pipe: Pipeline | IFunc) {
    if (pipe instanceof Pipeline) {
      this.pipes.push(pipe)
    } else {
      this.pipes.push(new Pipeline(pipe))
    }
    return this
  }

  public async save(data: any) {
    let d = this.func(data)
    for (const pipe of this.pipes) {
      d = await pipe.save(d)
    }
    return d
  }

}
