// 初始化
import { initState } from "./initState";
import { compileToFunction } from "./compile/index";
import { callHook, mountComponent } from "./lifecycle.js";
import { mergeOptions } from "./utils/index.js";

export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = mergeOptions(this.constructor.options, options);
    callHook(vm, "beforeCreated");
    // 初始化状态 data computed watcher
    initState(vm);
    callHook(vm, "created");

    // 渲染模板
    // 实例上必须有 el
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };

  // 创建 $mount 准备编译模板
  Vue.prototype.$mount = function (el) {
    // 判断实例上是否有render template
    // 执行优先级 render > template > el
    const vm = this;
    const options = vm.$options;
    el = document.querySelector(el); // 获取根元素
    vm.$el = el;
    // 先进行查找有没有render
    if (!options.render) {
      let template = options.template;
      // 没有render看一下是否写了template，没写template采用外部template
      if (!template && el) {
        template = el.outerHTML;
      } else {
        template = options.template;
      }
      // 只要有模板就挂载
      if (template) {
        // 生成ast抽象语法树 => 将ast转为render字符串 ==> 字符串转为render函数
        let render = compileToFunction(template);

        // render生成vnode虚拟节点
        options.render = render;
      }
    }
    // 将虚拟节点转为真实DOM
    mountComponent(vm, el);
  };
}
