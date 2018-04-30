import { EventEmitter } from "events";
import * as pRetry from "p-retry";
import * as uuid from "uuid";
import {
  IOptions,
  IOpts,
  IPipe,
  IPipeItems,
  IPlan,
  IQueue,
  IState,
  IStatus,
  ITask,
} from "./interfaces";
import defaultPlan from "./plan/defaultPlan";
import downloadPlan from "./plan/downloadPlan";
import Queue from "./queue";

const defaultOption: IOpts = {
  concurrency: 20,
  queue: new Queue(),
  pool: new Set<string>(),
  heartbeat: 4000,
  genUUID: uuid,
};

const event = {
  statusChange: "statusChange",
  addTask: "addTask",
  taskDone: "taskDone",
  queueEmpty: "queueEmpty",
  heartbeat: "heartbeat",
  goodbye: "goodbye",
};

/**
 * class of NodeSpider
 * @class NodeSpider
 */
export default class NodeSpider extends EventEmitter {
  public _STATE: IState;
  /**
   * create an instance of NodeSpider
   * @param option
   */
  constructor(option: IOptions = {}) {
    super();
    const opts = { ...defaultOption, ...option };
    this._STATE = {
      opts,
      currentTasks: [],
      pipeStore: [],
      planStore: [],
      queue: opts.queue,
      heartbeat: setInterval(() => this.emit(event.heartbeat), opts.heartbeat),
      pool: opts.pool,
      status: "vacant",   // 初始化后，在获得新任务前，将保持“空闲”状态
    };

    this.on(event.queueEmpty, () => {
      if (this._STATE.currentTasks.length === 0) {
        changeStatus("vacant", this);
      }
    });
    this.on(event.addTask, () => {
      if (this._STATE.status === "vacant") {
        changeStatus("active", this);
      }
      startTask(this);
    });
    this.on(event.heartbeat, () => startTask(this));
    this.on(event.taskDone, () => {
      if (this._STATE.status === "active") {
        startTask(this);
      } else if (this._STATE.status === "end" && this._STATE.currentTasks.length === 0) {
        for (const pipe of this._STATE.pipeStore) {
          pipe.end();
        }
        clearInterval(this._STATE.heartbeat);
        this.emit(event.goodbye);
      }
    });
  }

  /**
   * 终止爬虫
   */
  public end() {
    changeStatus("end", this);
  }

  /**
   * Check whether the url has been added
   * @param {string} url
   * @returns {boolean}
   */
  public has(url: string): boolean {
    if (typeof url !== "string") {
      throw new TypeError(`the parameter of method isExist should be a string`);
    }
    return this._STATE.pool.has(url);
  }

  /**
   * 过滤掉一个数组中的重复链接，以及所有已被添加的链接，返回一个新数组
   * @param urlArray {array}
   * @returns {array}
   */
  public filter(urlArray: string[]): string[] {
    if (!Array.isArray(urlArray)) {
      throw new TypeError("the parameter of the method filter is required, and can only be an array of strings");
    } else {
      const s = new Set(urlArray);
      const result: string[] = [];
      for (const url of s) {
        if (typeof url !== "string") {
          throw new TypeError(
            "the parameter of the method filter is required, and can only be an array of strings",
          );
        }
        if (!this.has(url)) {
          result.push(url);
        }
      }
      return result;
    }
  }

  /**
   * add new plan
   * @param  {IPlan}  plan plan object
   * @return {void}
   */
  public plan(plan: IPlan): void {
    if (this._STATE.planStore.find((p) => p.name === plan.name)) {
      throw new TypeError(`method add: there already have a plan named "${plan.name}"`);
    }
    this._STATE.planStore.push(plan);
  }

  /**
   * connect new pipe
   * @param  {IPipe}  target pipe object
   * @return {void}
   */
  public pipe(newPipe: IPipe): void {
    if (this._STATE.pipeStore.find((p) => p.name === newPipe.name)) {
      throw new TypeError(`method connect: there already have a pipe named "${name}"`);
    }
    this._STATE.pipeStore.push(newPipe);
  }

  /**
   * add new tasks, return tasks' uuids
   * @param planName target plan name
   * @param url url(s)
   * @param info attached information
   */
  public add(planName: string, url: string | string[], info?: { [index: string]: any }): string[] {
    const plan = this._STATE.planStore.find((p) => p.name === planName);
    if (!plan) {
      throw new TypeError(`method queue: no such plan named "${planName}"`);
    }
    const urls = Array.isArray(url) ? url : [url];

    const tasks = urls.map((u) => ({ uid: this._STATE.opts.genUUID(), url: u, planName, info }));
    for (const task of tasks) {
      this._STATE.queue.add(task);
      this._STATE.pool.add(task.url);
      this.emit(event.addTask, task);
    }

    return tasks.map((t) => t.uid);
  }

  /**
   * filter new tasks and add, return tasks' uuids
   * @param planName target plan name
   * @param url url(s)
   * @param info attached information
   */
  public addU(planName: string, url: string | string[], info?: { [index: string]: any }): string[] {
    const urls = Array.isArray(url) ? url : [url];
    return this.add(planName, this.filter(urls), info);
  }

  // public download(path: string, url: string, filename?: string) {
  //     if (typeof path !== "string") {
  //         throw new TypeError(`method download: the parameter 'path' should be a string`);
  //     }
  //     if (typeof url !== "string") {
  //         throw new TypeError(`method download: the parameter 'url' should be a string`);
  //     }
  //     // 如果不存在与该path相对应的 download plan，则新建一个
  //     if (! this._STATE.planStore.has(path)) {
  //         const newPlan = downloadPlan({
  //             callback: (err, current, s) => {
  //                 if (err) {
  //                     return s.retry(current, 3, () => console.log(err));
  //                 }
  //             },
  //             path,
  //         });
  //         this.plan(name, newPlan);
  //     }
  //     // 添加下载链接 url 到队列
  //     this.add(path, url, { filename });
  // }

  /**
   * Save data through a pipe
   * @param  {string} pipeName pipe name
   * @param  {any}    data     data you need to save
   * @return {void}
   */
  public save(pipeName: string, data: { [index: string]: any }) {
    if (typeof pipeName !== "string") {
      throw new TypeError(`methdo save: the parameter "pipeName" should be a string`);
    }
    if (typeof data !== "object") {
      throw new TypeError(`method save: the parameter "data" should be an object`);
    }
    const pipe = this._STATE.pipeStore.find((p) => p.name === pipeName);
    if (!pipe) {
      throw new TypeError(`method save: no such pipe named ${pipeName}`);
    }

    if (! pipe.items) {
      pipe.items = Object.keys(data);
    }

    const d = (Array.isArray(pipe.items)) ?
      pipe.items.map((item) => (typeof data[item] !== "undefined") ? data[item] : null)
      : Object.entries(pipe.items).map(([ item, fn ]) => (typeof data[item] !== "undefined") ? fn(data[item]) : null);

    pipe.write(d);
  }
}

function changeStatus(status: IStatus, spider: NodeSpider) {
  const preStatus = spider._STATE.status;
  spider._STATE.status = status;
  spider.emit(event.statusChange, status, preStatus);
}

async function startTask(spider: NodeSpider) {
  if (spider._STATE.status === "active") {
    const maxConcurrency = spider._STATE.opts.concurrency;
    const currentTasksNum = spider._STATE.currentTasks.length;
    if (maxConcurrency - currentTasksNum > 0) {
      const currentTask = spider._STATE.queue.next();
      if (!currentTask) {
        spider.emit(event.queueEmpty);
      } else {
        spider._STATE.currentTasks.push(currentTask);
        startTask(spider);    // 不断递归，使爬虫并发任务数量尽可能达到最大限制

        const plan = spider._STATE.planStore.find((p) => p.name === currentTask.planName) as IPlan;
        await pRetry(() => plan.process(currentTask, spider), { retries: plan.retries })
          .catch((err) => plan.catch(err, currentTask, spider));

        spider._STATE.currentTasks = spider._STATE.currentTasks.filter(({ uid }) => uid !== currentTask.uid);
        spider.emit(event.taskDone, currentTask);
      }
    }
  }
}
