import { ArrayMethods } from "./arr.js";
import Dep from "./dep.js";
/**
 * 数据劫持 基本类型 对象
 * @param {Object} data 劫持对象
 * @returns
 */
export function observer(data) {
  // 判断data是否是一个对象
  // 若不是对象直接返回data
  if (typeof data != "object" || data == null) {
    return data;
  }
  if (data.__ob__ instanceof Observer) {
    return data.__ob__;
  }
  // 若data是一个对象，交给Observer对象进行数据劫持
  return new Observer(data);
}

/**
 * 数据劫持对象
 */
class Observer {
  constructor(value) {
    // 给对象本身增加dep
    this.dep = new Dep(value);
    // 给data中的每个数据value定义一个属性，目的：保存Observer对象
    Object.defineProperty(value, "__ob__", {
      enumerable: false,
      value: this,
      configurable: false,
    });
    /**
     * 1. 我们要给所有对象类型增加一个dep
     * 2. 获取数组的值，会调用get方法，我们希望让当前数组记住这个渲染的watcher
     *    2.1 需要获取到当前的dep
     *    2.2 当前对面数组取值的时候，我们就让数组的dep机制这个watcher
     * 3. 我们更新数组的时候，调用push等方法，我们找到watcher进行更新
     * */
    // 判断数据
    if (Array.isArray(value)) {
      // 数组的原型改为函数劫持后的方法
      value.__proto__ = ArrayMethods;
      // 如果数组中存放的是对象，监控到对象的变化
      this.observerArray(value);
    } else {
      this.walk(value); // 遍历
    }
  }

  /**
   * 对对象中每个属性进行劫持
   * @param {*} data
   */
  walk(data) {
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      // 对对象中每个属性进行劫持
      let key = keys[i];
      let value = data[key];
      defineReactive(data, key, value);
    }
  }

  /**
   * 对数组中的对象劫持
   * 深层次嵌套会递归，递归多了性能差，不存在的属性监控不到，存在的属性要重写方法
   * @param {Array} value 数组
   */
  observerArray(value) {
    for (let i = 0; i < value.length; i++) {
      // 若数组项是对象 [{a:1}]
      observer(value[i]);
    }
  }
}

/**
 * 对data中的对象进行数据劫持
 * vue响应式原理：Object.defineProperty
 * vue2 Object.defineProperty 缺点：只能对对象中的某一个属性进行劫持
 * @param {Object} data 劫持对象
 * @param {String} key 劫持对象的属性
 * @param {any} value 劫持对象的值
 */
function defineReactive(data, key, value) {
  // 递归判断value是否是一个对象，如果是则进行劫持
  // 对所有的对象都进行数据劫持 childOb.dep用来收集依赖
  let childOb = observer(value);

  // 给每一个属性添加Dep(准备收集依赖)
  const dep = new Dep(key);
  Object.defineProperty(data, key, {
    get() {
      if (Dep.target) {
        dep.depend();
        if (childOb.dep) {
          childOb.dep.depend(); // 对象类型依赖收集
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value;
    },
    set(newVal) {
      // 判断新值是否变化
      if (newVal === value) return;
      // 判断重新设置的value是否是一个对象, 如果是则进行劫持
      observer(newVal);
      value = newVal;
      dep.notify(); // 通知更新
    },
  });
}

// 数组 {list: [1,2,3,4], arr: [{a:1}]}
// 方法函数劫持， 劫持数组方法 arr.push()...
function dependArray(value) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i];
    if (e && e.__ob__) {
      e.__ob__.dep.depend();
    }
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}
