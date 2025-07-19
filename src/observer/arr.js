// 数组劫持
// 重写数组
// 1. 获取原来的数组方法
let oldArrayProtoMethods = Array.prototype;

// 2. 继承 oldArrayProtoMethods中的所有方法
export let ArrayMethods = Object.create(oldArrayProtoMethods);

// 需要劫持的方法数组
let methods = ["push", "pop", "unshift", "shift", "splice", "reverse", "sort"];

methods.forEach((item) => {
  ArrayMethods[item] = function (...args) {
    // 执行原数组的方法
    let result = oldArrayProtoMethods[item].apply(this, args);
    // 执行自己的逻辑
    // 对数组追加的对象进行劫持
    let inserted;
    switch (item) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.splice(2);
    }
    const ob = this.__ob__;
    if (inserted) {
      ob.observerArray(inserted);
    }
    ob.dep.notify(); // 数组本身变化了通知Watcher更新
    return result;
  };
});
