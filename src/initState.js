// 初始化数据状态
import Dep from "./observer/dep.js";
import { observer } from "./observer/index.js";
import Watcher, { nextTick } from "./observer/watcher.js";

// 初始化数据
export function initState(vm) {
  let opts = vm.$options;
  // 判断
  if (opts.props) {
    initProps(vm);
  }
  if (opts.data) {
    initData(vm);
  }
  if (opts.watch) {
    initWatch(vm);
  }
  if (opts.computed) {
    initComputed(vm);
  }
  if (opts.methods) {
    initMethods(vm);
  }
}

function initMethods() {}
function initProps() {}
function initWatch(vm) {
  debugger;
  let watch = vm.$options.watch;
  for (const key in watch) {
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher(vm, key, handler) {
  // 字符串 函数
  if (typeof handler === "string") {
    handler = vm[handler];
  }

  return vm.$watch(key, handler);
}

// vue2 对data初始化
function initData(vm) {
  let data = vm.$options.data;

  // 判断data是对象还是函数，并改变函数data的this指向 ==> data.call(vm) ！！！
  data = vm._data = typeof data === "function" ? data.call(vm) : data;

  // 将data上所有属性代理到实例 vm(Vue) 实例上
  for (const key in data) {
    proxy(vm, "_data", key);
  }

  // data数据劫持
  observer(data);
}

// 给vm对象上添加data属性
function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newVal) {
      vm[source][key] = newVal;
    },
  });
}

/**
 * 初始化计算属性
 * 计算属性依赖真的值发生改变才会重写执行用户的方法
 * 计算属性要维护一个dirty属性，默认计算属性不会立即执行
 * 计算属性也是一个watcher，默认渲染会创建一个渲染watcher
 * */
function initComputed(vm) {
  const computed = vm.$options.computed;
  // 计算属性watcher保存到vm上
  const watchers = (vm._computedWatchers = {});
  for (const key in computed) {
    let userDef = computed[key];
    // 我们需要监控计算属性中get的变化
    const fn = typeof userDef === "function" ? userDef : userDef.get;
    // 如果直接new Watcher 默认执行fn
    // 将属性和watcher对应起来
    watchers[key] = new Watcher(vm, fn, { lazy: true });
    defineComputed(vm, key, userDef);
  }
}

function defineComputed(target, key, userDef) {
  const setter = userDef.set || (() => {});
  // 可以通过实例拿到对应的属性
  Object.defineProperty(target, key, {
    get: createComputedGetter(key),
    set: setter,
  });
}

/**
 * 检测是否需要执行getter
 * computed 缓存机制：脏值检测
 * 计算属性根本不会收集依赖，只会让自己的依赖属性去收集
 * @param {*} getter
 * @returns
 */
function createComputedGetter(key) {
  return function () {
    const watcher = this._computedWatchers[key];
    if (watcher.dirty) {
      // 如果是脏数据就去中用户传入的函数
      // 取过一次值后，dirty就变为false
      watcher.evaluate();
    }
    // 计算属性watcher出栈后还有渲染watcher
    // 让计算属性里的响应式属性也去收集上层watcher
    if (Dep.target) {
      watcher.depend();
    }
    return watcher.value;
  };
}

export function initStateMixin(Vue) {
  Vue.prototype.$nextTick = nextTick;

  // watch实现
  Vue.prototype.$watch = function (exprOrFn, cb, option = {}) {
    // firstName
    // ()=>vm.firstName
    // {user:true} 标识用户自己写的watch
    // firstName的值变化了，执行cb函数
    new Watcher(this, exprOrFn, { user: true }, cb);
  };
}
