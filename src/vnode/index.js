/**
 * render() = _c('div',{id:app},_v('Hello'+_s(msg)))
 * 在Vue原型上添加_render()函数
 * 生成虚拟DOM vnode
 * @param {*} Vue
 */
export function renderMixin(Vue) {
  // 标签
  Vue.prototype._c = function () {
    // 创建标签节点
    return createElementVNode(this, ...arguments);
  };
  // 文本
  Vue.prototype._v = function (text) {
    return createTextVNode(this, text);
  };
  // 变量
  Vue.prototype._s = function (val) {
    return val === null
      ? ""
      : typeof val === "object"
      ? JSON.stringify(val)
      : val;
  };

  Vue.prototype._render = function () {
    // render函数变为vnode
    const vm = this;
    const render = vm.$options.render;

    //执行render函数_c,_v,_s函数都在Vue原型上！！！
    const vnode = render.call(this);

    return vnode;
  };
}

const isReservedTag = (tag) => {
  return ["a", "div", "p", "button", "ul", "li", "span"].includes(tag);
};

// 创建元素节点
function createElementVNode(vm, tag, data = {}, ...children) {
  let key = data.key;
  if (key) {
    delete data.key;
  }
  if (isReservedTag(tag)) {
    return vnode(tag, key, data, children);
  } else {
    // 创造一个组件的虚拟节点（包含组件的构造函数）
    // Ctor就是组件的定义，可能是一个Sub类，也可能是组件的obj选项
    let Ctor = vm.$options.components[tag]; //组件的构造函数
    return createComponentVNode(vm, tag, key, data, children, Ctor);
  }
}

function createComponentVNode(vm, tag, key, data, children, Ctor) {
  if (typeof Ctor === "object") {
    // Ctor = Vue.extend(Ctor)
    Ctor = vm.$options._base.extend(Ctor);
  }
  data.hook = {
    // 稍后创造真实节点的时候，如果是组件则调用此init方法
    init(vnode) {
      const instance = (vnode.componentInstance =
        new vnode.componentOptions.Ctor());
      instance.$mount();
    },
  };
  return vnode(tag, key, data, children, null, { Ctor });
}

function createTextVNode(vm, text) {
  return vnode(undefined, undefined, undefined, undefined, text);
}

// 创建虚拟DOM
function vnode(tag, key, data, children, text, componentOptions) {
  return { tag, key, data, children, text, componentOptions };
}

export function isSameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
}
