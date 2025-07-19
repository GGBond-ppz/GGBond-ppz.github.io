import { patch } from "./vnode/patch";
import Watcher from "./observer/watcher";

// 源码
// 1. vm._render 将render函数变为vnode虚拟DOM
// 2. vm._updata 将vnode变成真实DOM放到页面
/**
 * 挂在组件
 * @param {*} vm Vue对象
 * @param {*} el #app
 */
export function mountComponent(vm, el) {
  callHook(vm, "beforeMount");
  const updataComponent = () => {
    vm._update(vm._render());
  };
  const watcher = new Watcher(vm, updataComponent, true, () => {}); // true用于标识是一个渲染watcher
  callHook(vm, "mounted");
}

/**
 * 生命周期
 * @param {*} Vue
 */
export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this;
    const el = vm.$el;

    const prevVnode = vm._vnode;
    /**
     * 把组件第一次产生的虚拟节点保存到_vnode上
     */
    vm._vnode = vnode;
    if (prevVnode) {
      vm.$el = patch(prevVnode, vnode);
    } else {
      vm.$el = patch(el, vnode);
    }
  };
}

// 生命周期的调用
export function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    for (let i = 0; i < handlers.length; i++) {
      handlers[i].call(vm);
    }
  }
}
