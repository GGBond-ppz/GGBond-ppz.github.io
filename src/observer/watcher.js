import { pushTarget, popTarget } from "./dep";

/**
 * 观察者模式
 *    每个属性有一个dep（属性就是被观察者），watcher就是观察者（属性变化了会通知观察者来更新）
 * 将vm._updata(vm._render())，页面渲染的方法交给Watcher
 *    不同的组件有不同的watcher，目的只有一个，渲染根实例
 * 1. 当我们创建渲染watcher的时候会把当前的渲染watcher放到Dep.target上
 * 2. 调用_render() 会取值，走到get()上
 */
let id = 0;
class Watcher {
  constructor(vm, exprOrFn, options, cb) {
    this.vm = vm;
    this.cb = cb;
    this.options = options;
    this.id = id++;
    this.deps = []; // 后续我们实现计算属性，和一些清理工作需要使用
    this.depsId = new Set();
    if (typeof exprOrFn === "string") {
      this.getter = function () {
        return vm[exprOrFn];
      };
    } else {
      if (typeof exprOrFn === "function") {
        this.getter = exprOrFn;
      }
    }

    // computed
    this.lazy = options.lazy;
    this.dirty = this.lazy; // 缓存值 脏值检测
    // watch
    this.user = options.user; // 是否是用户自己的watch

    // 初次渲染
    this.value = this.lazy ? undefined : this.get();
  }

  /**
   * 需要给每个属性增加一个dep，目的就是收集watcher，
   *    用于在响应式数据变化后执行页面渲染的操作
   * 一个视图(组件)对应一个Watcher，有多个属性 => n个属性对应一个视图(n个dep对应一个Watcher)
   * 一个属性对应多个视图(组件) => 1个dep可对应多个Watcher
   *    重复的属性不用记录
   * 添加Dep对象
   * 再调用dep.addSub(this)将自己添加到Dep对象中
   * 双向记忆（双向绑定）
   * @param {*} dep
   */
  addDep(dep) {
    // 去重
    let id = dep.id;
    if (!this.depsId.has(id)) {
      this.deps.push(dep);
      this.depsId.add(id);
      dep.addSub(this); // watcher已经记录了dep并且去重，此时让dep也记录watcher
    }
  }
  evaluate() {
    // 获取到用户函数的返回值，并且标识为脏
    this.value = this.get();
    this.dirty = false;
  }
  get() {
    // 给Dep.target添加当前watcher
    pushTarget(this);
    // 渲染页面 会去vm上取值 vm._updata(vm._render())
    const value = this.getter.call(this.vm);
    // 将Dep.target设置为null
    popTarget();
    return value;
  }
  depend() {
    let i = this.deps.length;
    while (i--) {
      // 让计算属性watcher也收集渲染watcher
      this.deps[i].depend();
    }
  }
  // 更新
  update() {
    // 如果是计算属性
    if (this.lazy) {
      // 如果依赖的属性变化了，就标识计算属性是脏值
      this.dirty = true;
    } else {
      queueWatcher(this); // 把当前watcher暂存起来
    }
    // this.get(); // 重新渲染
  }

  run() {
    let oldValue = this.value;
    let newValue = this.get(); // 渲染的时候用的最新的值
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue);
    }
  }
}

let queue = [];
let has = {};
let pending = false; // 防抖

function flushSchedulerQueue() {
  let flushQueue = queue.slice(0);
  queue = []; // 在刷新的过程中可能有新的watcher，重新放到queue中
  has = {};
  pending = false;
  flushQueue.forEach((q) => q.run());
}

function queueWatcher(watcher) {
  const id = watcher.id;
  if (!has[id]) {
    queue.push(watcher);
    has[id] = true;
    // 不管update执行多少次，但最终只执行一轮刷新
    if (!pending) {
      nextTick(flushSchedulerQueue, 0);
      pending = true;
    }
  }
}

/**
 * 开发者可能在更新响应式数据前后，使用setTimeout或者Promise获取DOM
 * 渲染页面时一个异步行为，事件循环中计时任务和微任务优先级也不同
 * 为了防止出现响应式数据更新，但获取不到最新的页面DOM的情况
 * 推荐使用nextTick方法，统一使用的异步方法
 */
let callbacks = [];
let waiting = false;
function flushCallbacks() {
  let cbs = callbacks.slice(0);
  waiting = false;
  callbacks = [];
  cbs.forEach((cb) => cb()); // 按照顺序依次执行
}

/**
 * 将任务维护到队列中
 * 源码中nextTick没有使用某个api，而是采用优雅降级的方式
 * 内部先采用的时promise(ie不兼容) => MutationObserver(h5) => ie专享的 setImmediate => setTimeout
 * @param {*} cb
 */

let timerFunc;
if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  let observer = new MutationObserver(flushCallbacks); //这里传入的回调时异步执行的
  let textNode = document.createTextNode(1);
  observer.observe(textNode, {
    characterData: true,
  });
  timerFunc = () => {
    textNode.textContent = 2;
  };
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks);
  };
}
export function nextTick(cb) {
  callbacks.push(cb); // 维护nextTick中的callback方法
  if (!waiting) {
    setTimeout(() => {
      timerFunc(); // 最后一起刷新
    }, 0);
    waiting = true;
  }
}

export default Watcher;

/**
 * 收集依赖 vue dep watcher
 * data:{name,msg} dep和data中的属性是一一对应的
 * watcher: 在视图上用了几个，就有几个watcher
 * dep与watcher:
 */
