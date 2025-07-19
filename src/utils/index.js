export const LIFECYCLE = [
  "beforeCreate",
  "created",
  "beforeMount",
  "mounted",
  "beforeUpdate",
  "updated",
  "beforeDestroy",
  "destroyed",
];

// 策略模式
let strats = {};
// 合并data
strats.data = function (parentVal, childVal) {
  return childVal;
};
// 合并computed
// strats.computed = function () {};
// 合并watch
// strats.watch = function () {};
// 合并methods
// strats.methods = function () {};

strats.components = function (parentVal, childVal) {
  const res = Object.create(parentVal);
  if (childVal) {
    for (const key in childVal) {
      // 返回的是构造的对象，可以拿到父亲原型上的属性，并且将儿子的都拷贝到自己身上
      res[key] = childVal[key];
    }
  }
  return res;
};

// 遍历生命周期
LIFECYCLE.forEach((hook) => {
  strats[hook] = mergeHook;
});

/**
 * {} {created:function(){}} => {created:[fn]
 * {created:[fn]} {created:function(){}} => {created:[fn,fn]}
 */
function mergeHook(parentVal, childVal) {
  //{created:[a,b,c],watch:[]}
  if (childVal) {
    // 儿子有父亲有，合并
    if (parentVal) {
      return parentVal.concat(childVal);
    } else {
      // 儿子有父亲没有，把儿子包装成数组
      return [childVal];
    }
  } else {
    // 如果儿子没有则返回父亲
    return parentVal;
  }
}

/**
 * 合并全局与局部同属性钩子
 * @param {*} parent Vue.options
 * @param {*} child mixin...
 */
export function mergeOptions(parent, child) {
  // Vue.options = {created:[a,b,c],watch:[]}
  const options = {};
  for (const key in parent) {
    mergeField(key);
  }
  for (const key in child) {
    if (!parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  function mergeField(key) {
    // 策略模式 减少 if/else
    if (strats[key]) {
      // options[created] = strats["created"]() = mergeHook()
      options[key] = strats[key](parent[key], child[key]);
    } else {
      // 如果不在策略中则以儿子为主
      options[key] = child[key] || parent[key];
    }
  }
  return options;
}
