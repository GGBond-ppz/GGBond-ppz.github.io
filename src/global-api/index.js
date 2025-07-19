import { mergeOptions } from "../utils/index";

export function initGlobApi(Vue) {
  // 全局选项
  Vue.options = {
    _base: Vue,
  };
  // 声明mixin
  Vue.mixin = function (mixin) {
    /**
     * 我们期望将用户的选项和全局的options进行合并
     * 将全局的created,watch,computed... 保存在options
     * {} {created:function(){}} => {created:[fn]}
     * {created:[fn]} {created:function(){}} => {created:[fn,fn]}
     */
    Vue.options = mergeOptions(this.options, mixin);
  };

  /**
   * 创建构造函数进行挂载，并把原型指向Vue的原型（创建组件构造函数）
   * @param {*} options
   * @returns
   */
  Vue.extend = function (options) {
    // 根据用户的参数翻一个构造函数
    // 最终使用一个组件，就是new一个实例
    function Sub(options = {}) {
      this._init(options); // 默认对子类进行初始化操作
    }
    // Sub.prototype.__proto__ === Vue.prototype
    Sub.prototype = Object.create(Vue.prototype);
    Sub.prototype.constructor = Sub;
    // 将用户传递的参数和全局的Vue.option来合并
    Sub.options = mergeOptions(Vue.options, options); // 保存用户传递的选项
    return Sub;
  };

  /**
   * 创建组件
   */
  Vue.options.components = {}; // 全局的指令 Vue.options.directives
  Vue.component = function (id, definition) {
    // 如果definition已经是一个函数，说明用户自己调用了Vue.extend
    definition =
      typeof definition === "function" ? definition : Vue.extend(definition);

    Vue.options.components[id] = definition;
  };
}
