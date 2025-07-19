import { isSameVnode } from "./index";

function createComponent(vnode) {
  let i = vnode.data;
  if ((i = i.hook) && (i = i.init)) {
    i(vnode);
  }
  if (vnode.componentInstance) {
    return true; // 说明是组件
  }
}
/**
 * 根据虚拟节点生成真实DOM
 * @param {*} vnode 虚拟节点
 * @returns 返回真实DOM
 */
export function createElm(vnode) {
  let { tag, children, key, data, text } = vnode;
  // 标签
  if (typeof tag === "string") {
    // 创建真实元素也要区分组件还是元素
    // 组件 vnode.componentInstance.$el
    if (createComponent(vnode)) {
      return vnode.componentInstance.$el;
    }

    // 创建标签，并保存到虚拟节点el属性上
    vnode.el = document.createElement(tag);
    patchProps(vnode.el, {}, data);
    // children
    if (children && children.length > 0) {
      children.forEach((child) => {
        vnode.el.appendChild(createElm(child));
      });
    }
  } else {
    // 文本
    vnode.el = document.createTextNode(text);
  }

  return vnode.el;
}

/**
 * 将虚拟DOM转为真实DOM vnode => DOM
 * 将真实DOM替换并渲染到页面
 * @param {*} oldVNode 旧DOM节点
 * @param {*} vnode 新节点（虚拟节点）
 * @returns
 */
export function patch(oldVNode, vnode) {
  // 没有oldVNode说明是组件挂载
  if (!oldVNode) {
    return createElm(vnode); // vm.$el 对应的就是组件渲染的结果
  }

  /**
   * isRealElement是否是真实DOM（真实DOM上才有nodeType）
   */
  let isRealElement = oldVNode.nodeType;
  if (isRealElement) {
    // 如果是真实DOM，说明是第一次渲染，直接替换真实DOM
    const elm = oldVNode;
    const parentElm = elm.parentNode;
    let newElm = createElm(vnode);
    parentElm.insertBefore(newElm, oldVNode.nextSibling);
    parentElm.removeChild(oldVNode);
    return newElm;
  } else {
    /**
     * 如果不是真实DOM，是虚拟节点，则需要进行Diff算法比较
     *
     * diff算法是一个平级比较的过程
     * 1. 两个节点不是同一个节点，直接删除旧节点，换上新节点（不需要比较）
     * 2. 两个节点是同一个节点（判断节点的tag和节点的key）
     *    比较两个节点的属性是否有差异（复用旧节点，将差异属性更新）
     * 3. 节点比较完毕后就需要比较children
     */

    return patchVnode(oldVNode, vnode);
  }
}

function patchVnode(oldVNode, vnode) {
  // !(tag === tag && key === key)
  if (!isSameVnode(oldVNode, vnode)) {
    let el = createElm(vnode);
    oldVNode.el.parentNode.replaceChild(el, oldVNode.el);
    return el;
  }

  // tag === tag && key === key
  // 复用老节点的元素
  let el = (vnode.el = oldVNode.el);
  // 如果是文本
  if (!oldVNode.tag) {
    if (oldVNode.text !== vnode.text) {
      el.textContent = vnode.text;
    }
  }

  // 如果是标签，需要比对标签的属性
  patchProps(el, oldVNode.data, vnode.data);
  // 比较儿子节点，一方有children，一方没有children || 两方都有children
  let oldChildren = oldVNode.children || [];
  let newChildren = vnode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 完整的diff算法，需要比较两者的children
    updateChildren(el, oldChildren, newChildren);
  } else if (newChildren.length > 0) {
    // 旧的没有，新的有，直接插入新节点
    mountChildren(el, newChildren);
  } else if (oldChildren.length > 0) {
    // 旧的有，新的没有，删除旧节点
    el.innerHTML = "";
  }

  return el;
}
/**
 * 挂载子节点
 * @param {*} el
 * @param {*} newChildren
 */
function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i];
    el.appendChild(createElm(child));
  }
}

/**
 * 比较新旧子节点（diff）
 * 依次比较有较高性能消耗，需要一些优化手段
 * 常见的列表操作：push shift pop unshift reverse sort等方法（争对这些方法进行优化）
 * @param {*} el
 * @param {*} oldChildren
 * @param {*} newChildren
 */
function updateChildren(el, oldChildren, newChildren) {
  // vue2 中采用双指针的方式比较两个节点
  let oldStartIndex = 0; // 旧头指针
  let newStartIndex = 0; // 新头指针
  let oldEndIndex = oldChildren.length - 1; // 旧尾指针
  let newEndIndex = newChildren.length - 1; // 新尾指针

  let oldStartVnode = oldChildren[oldStartIndex]; // 旧头指针指向的旧节点
  let newStartVnode = newChildren[newStartIndex]; // 新头指针指向的新节点

  let oldEndVnode = oldChildren[oldEndIndex]; // 旧尾指针指向的旧节点
  let newEndVnode = newChildren[newEndIndex]; // 新尾指针指向的新节点

  // 根据老的列表做一个映射关系
  function makeIndexByKey(children) {
    let map = {};
    children.forEach((child, index) => {
      map[child.key] = index;
    });
    return map;
  }
  const map = makeIndexByKey(oldChildren);

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex];
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex];
    } else if (isSameVnode(oldStartVnode, newStartVnode)) {
      // 头头比对 头 => 尾 双方有一方头指针大于尾部指针则停止循环
      // 如果是相同节点则递归比较子节点
      patchVnode(oldStartVnode, newStartVnode);
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      // 尾尾比对 尾 => 头 双方有一方尾指针小于头部指针则停止循环
      // 如果是相同节点则递归比较子节点
      patchVnode(oldEndVnode, newEndVnode);
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      // 交叉比对  旧尾比新头
      // 如果是相同节点则递归比较子节点
      patchVnode(oldEndVnode, newStartVnode);
      // 将旧的尾巴移到旧的头部
      el.insertBefore(oldEndVnode.el, oldStartVnode.el);
      oldEndVnode = oldChildren[--oldEndIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      // 交叉比对  旧头比新尾
      // 如果是相同节点则递归比较子节点
      patchVnode(oldStartVnode, newEndVnode);
      // 将旧的尾巴移到旧的头部
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
      oldStartVnode = oldChildren[++oldStartIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else {
      // 乱序比对
      // 根据老的列表做一个映射关系，用新的去找，找到则移动，找不到则添加，最后多余的就删除
      let moveIndex = map[newStartVnode.key]; // 如果拿到则说明是要移动的索引
      if (moveIndex !== undefined) {
        let moveVnode = oldChildren[moveIndex]; // 找到对应的虚拟节点 复用
        el.insertBefore(moveVnode.el, oldStartVnode.el);
        map[oldChildren[moveIndex].key] = undefined;
        oldChildren[moveIndex] = undefined; // 表示这个节点被移动走了
        patchVnode(moveVnode, newStartVnode); // 比对属性和子节点
      } else {
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
      }
      newStartVnode = newChildren[++newStartIndex];
    }
  }

  // 新节点剩余的元素直接插入
  if (newStartIndex <= newEndIndex) {
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      let childEl = createElm(newChildren[i]);
      // 可能是向后追加，也可能是向前追加
      // 尾指针后面没有值，向后追加
      // 尾指针后面有值，向前追加
      let anchor = newChildren[newEndIndex + 1]
        ? newChildren[newEndIndex + 1].el
        : null;
      // anchor 为null 的时候，则相当于 el.appendChild(childEl)
      el.insertBefore(childEl, anchor);
    }
  }

  // 旧节点元素比新节点多，删除多出来的元素
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      if (oldChildren[i]) {
        let childEl = oldChildren[i].el;
        el.removeChild(childEl);
      }
    }
  }
}

/**
 * 对比标签中的属性
 * @param {*} el
 * @param {*} oldProps
 * @param {*} props
 */
export function patchProps(el, oldProps, props) {
  // 旧属性有，新属性没有，删除旧属性
  let oldStyles = oldProps?.style || {};
  let newStyles = props?.style || {};
  // 比较样式
  for (const key in oldStyles) {
    if (!newStyles[key]) {
      el.style[key] = "";
    }
  }
  // 比较属性
  for (const key in oldProps) {
    if (!props[key]) {
      el.removeAttribute(key);
    }
  }

  // 用新的覆盖旧的
  for (const key in props) {
    if (key === "style") {
      for (const styleName in props.style) {
        el.style[styleName] = props.style[styleName];
      }
    } else {
      el.setAttribute(key, props[key]);
    }
  }
}

// Vue面试题
// vue的渲染流程 => 数据初始化 => 对模板进行编译 => 变成render => 通过render函数解析成vnode => 解析为真实dom => 放到页面
