// Vue入口文件
import { initGlobApi } from "./global-api/index";
import { initMixin } from "./init";
import { initStateMixin } from "./initState";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./vnode/index";
function Vue(options) {
  // 初始化
  this._init(options);
}
// 初始化状态
initMixin(Vue);
// 生命周期执行，vm_update vm._render
lifecycleMixin(Vue);
// 添加render
renderMixin(Vue);
// 全局Api Vue.mixin Vue.component Vue.extend ...
initGlobApi(Vue);
// 实现了nextTick $watch
initStateMixin(Vue);

export default Vue;

/**
 * 1. 将数据先处理成响应式initState(针对对象来说主要是增加Object.defineProperty，针对数组就是重写方法)
 * 2. 编译模板：将腹板转换为ast抽象语法树，将ast抽象语法树生成render方法
 * 3. 调用render函数，会执行产生虚拟DOM render(){_c('div',{id:app},_v('Hello'+_s(msg)))} 触发get()方法
 * 4. 将虚拟DOM渲染成真实DOM
 * */
