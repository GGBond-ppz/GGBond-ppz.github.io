(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  var LIFECYCLE = ["beforeCreate", "created", "beforeMount", "mounted", "beforeUpdate", "updated", "beforeDestroy", "destroyed"];

  // 策略模式
  var strats = {};
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
    var res = Object.create(parentVal);
    if (childVal) {
      for (var key in childVal) {
        // 返回的是构造的对象，可以拿到父亲原型上的属性，并且将儿子的都拷贝到自己身上
        res[key] = childVal[key];
      }
    }
    return res;
  };

  // 遍历生命周期
  LIFECYCLE.forEach(function (hook) {
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
  function mergeOptions(parent, child) {
    // Vue.options = {created:[a,b,c],watch:[]}
    var options = {};
    for (var key in parent) {
      mergeField(key);
    }
    for (var _key in child) {
      if (!parent.hasOwnProperty(_key)) {
        mergeField(_key);
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

  function initGlobApi(Vue) {
    // 全局选项
    Vue.options = {
      _base: Vue
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
      function Sub() {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
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
      definition = typeof definition === "function" ? definition : Vue.extend(definition);
      Vue.options.components[id] = definition;
    };
  }

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _classCallCheck(a, n) {
    if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e, r) {
    for (var t = 0; t < r.length; t++) {
      var o = r[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
  }
  function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
      writable: !1
    }), e;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = !0,
        o = !1;
      try {
        if (i = (t = t.call(r)).next, 0 === l) {
          if (Object(t) !== t) return;
          f = !1;
        } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = !0, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != typeof i) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  /**
   * 收集依赖 vue dep watcher
   * data:{name,msg} dep和data中的属性是一一对应的
   * watcher: 在视图上用了几个，就有几个watcher
   */
  var id$1 = 0;
  var Dep = /*#__PURE__*/function () {
    function Dep(name) {
      _classCallCheck(this, Dep);
      this.name = name;
      this.id = id$1++;
      this.subs = []; // 存放当前属性对应的watcher
    }

    // 依赖收集 收集watcher
    /**
     * 这里我们不希望放重复的watcher
     * Dep.target = Watcher
     * 将自己添加到watcher中(watcher中记录dep)
     * 双向记忆（双向绑定）
     */
    return _createClass(Dep, [{
      key: "depend",
      value: function depend() {
        // this.subs.push(Dep.target);
        Dep.target.addDep(this);

        // dep 和 watcher是一个多对多的关系（一个属性可以在多个组件中使用dep -> 多个watcher）
        // 一个组件中由多个属性组成（一个watcher 对应多个 dep）
      }

      /**
       * 记录watcher
       * 双向记忆（双向绑定）
       * @param {*} watcher
       */
    }, {
      key: "addSub",
      value: function addSub(watcher) {
        this.subs.push(watcher); // 此时已经完成双向记忆
      }
      // 将dep上所有的watcher进行更新（派发更新）
    }, {
      key: "notify",
      value: function notify() {
        debugger;
        this.subs.forEach(function (watcher) {
          watcher.update();
        });
      }
    }]);
  }(); // 添加watcher
  Dep.target = null;
  /**
   * 将Dep.target设置为watcher
   * watcher不止一个有渲染watcher，computer watcher...
   * 用栈来保存所有watcher
   * @param {Watcher} watcher
   */
  var stack = [];
  function pushTarget(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }

  /**
   * 将Dep.target设置为null
   */
  function popTarget() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  // 数组劫持
  // 重写数组
  // 1. 获取原来的数组方法
  var oldArrayProtoMethods = Array.prototype;

  // 2. 继承 oldArrayProtoMethods中的所有方法
  var ArrayMethods = Object.create(oldArrayProtoMethods);

  // 需要劫持的方法数组
  var methods = ["push", "pop", "unshift", "shift", "splice", "reverse", "sort"];
  methods.forEach(function (item) {
    ArrayMethods[item] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // 执行原数组的方法
      var result = oldArrayProtoMethods[item].apply(this, args);
      // 执行自己的逻辑
      // 对数组追加的对象进行劫持
      var inserted;
      switch (item) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          inserted = args.splice(2);
      }
      var ob = this.__ob__;
      if (inserted) {
        ob.observerArray(inserted);
      }
      ob.dep.notify(); // 数组本身变化了通知Watcher更新
      return result;
    };
  });

  /**
   * 数据劫持 基本类型 对象
   * @param {Object} data 劫持对象
   * @returns
   */
  function observer$1(data) {
    // 判断data是否是一个对象
    // 若不是对象直接返回data
    if (_typeof(data) != "object" || data == null) {
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
  var Observer = /*#__PURE__*/function () {
    function Observer(value) {
      _classCallCheck(this, Observer);
      // 给对象本身增加dep
      this.dep = new Dep(value);
      // 给data中的每个数据value定义一个属性，目的：保存Observer对象
      Object.defineProperty(value, "__ob__", {
        enumerable: false,
        value: this,
        configurable: false
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
    return _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          // 对对象中每个属性进行劫持
          var key = keys[i];
          var value = data[key];
          defineReactive(data, key, value);
        }
      }

      /**
       * 对数组中的对象劫持
       * 深层次嵌套会递归，递归多了性能差，不存在的属性监控不到，存在的属性要重写方法
       * @param {Array} value 数组
       */
    }, {
      key: "observerArray",
      value: function observerArray(value) {
        for (var i = 0; i < value.length; i++) {
          // 若数组项是对象 [{a:1}]
          observer$1(value[i]);
        }
      }
    }]);
  }();
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
    var childOb = observer$1(value);

    // 给每一个属性添加Dep(准备收集依赖)
    var dep = new Dep(key);
    Object.defineProperty(data, key, {
      get: function get() {
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
      set: function set(newVal) {
        // 判断新值是否变化
        if (newVal === value) return;
        // 判断重新设置的value是否是一个对象, 如果是则进行劫持
        observer$1(newVal);
        value = newVal;
        dep.notify(); // 通知更新
      }
    });
  }

  // 数组 {list: [1,2,3,4], arr: [{a:1}]}
  // 方法函数劫持， 劫持数组方法 arr.push()...
  function dependArray(value) {
    for (var e, i = 0, l = value.length; i < l; i++) {
      e = value[i];
      if (e && e.__ob__) {
        e.__ob__.dep.depend();
      }
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /**
   * 观察者模式
   *    每个属性有一个dep（属性就是被观察者），watcher就是观察者（属性变化了会通知观察者来更新）
   * 将vm._updata(vm._render())，页面渲染的方法交给Watcher
   *    不同的组件有不同的watcher，目的只有一个，渲染根实例
   * 1. 当我们创建渲染watcher的时候会把当前的渲染watcher放到Dep.target上
   * 2. 调用_render() 会取值，走到get()上
   */
  var id = 0;
  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, exprOrFn, options, cb) {
      _classCallCheck(this, Watcher);
      this.vm = vm;
      this.cb = cb;
      this.options = options;
      this.id = id++;
      this.deps = []; // 后续我们实现计算属性，和一些清理工作需要使用
      this.depsId = new Set();
      if (typeof exprOrFn === "string") {
        this.getter = function () {
          return vm[exprOrFn];
        };
      } else {
        if (typeof exprOrFn === "function") {
          this.getter = exprOrFn;
        }
      }

      // computed
      this.lazy = options.lazy;
      this.dirty = this.lazy; // 缓存值 脏值检测
      // watch
      this.user = options.user; // 是否是用户自己的watch

      // 初次渲染
      this.value = this.lazy ? undefined : this.get();
    }

    /**
     * 需要给每个属性增加一个dep，目的就是收集watcher，
     *    用于在响应式数据变化后执行页面渲染的操作
     * 一个视图(组件)对应一个Watcher，有多个属性 => n个属性对应一个视图(n个dep对应一个Watcher)
     * 一个属性对应多个视图(组件) => 1个dep可对应多个Watcher
     *    重复的属性不用记录
     * 添加Dep对象
     * 再调用dep.addSub(this)将自己添加到Dep对象中
     * 双向记忆（双向绑定）
     * @param {*} dep
     */
    return _createClass(Watcher, [{
      key: "addDep",
      value: function addDep(dep) {
        // 去重
        var id = dep.id;
        if (!this.depsId.has(id)) {
          this.deps.push(dep);
          this.depsId.add(id);
          dep.addSub(this); // watcher已经记录了dep并且去重，此时让dep也记录watcher
        }
      }
    }, {
      key: "evaluate",
      value: function evaluate() {
        // 获取到用户函数的返回值，并且标识为脏
        this.value = this.get();
        this.dirty = false;
      }
    }, {
      key: "get",
      value: function get() {
        // 给Dep.target添加当前watcher
        pushTarget(this);
        // 渲染页面 会去vm上取值 vm._updata(vm._render())
        var value = this.getter.call(this.vm);
        // 将Dep.target设置为null
        popTarget();
        return value;
      }
    }, {
      key: "depend",
      value: function depend() {
        var i = this.deps.length;
        while (i--) {
          // 让计算属性watcher也收集渲染watcher
          this.deps[i].depend();
        }
      }
      // 更新
    }, {
      key: "update",
      value: function update() {
        // 如果是计算属性
        if (this.lazy) {
          // 如果依赖的属性变化了，就标识计算属性是脏值
          this.dirty = true;
        } else {
          queueWatcher(this); // 把当前watcher暂存起来
        }
        // this.get(); // 重新渲染
      }
    }, {
      key: "run",
      value: function run() {
        var oldValue = this.value;
        var newValue = this.get(); // 渲染的时候用的最新的值
        if (this.user) {
          this.cb.call(this.vm, newValue, oldValue);
        }
      }
    }]);
  }();
  var queue = [];
  var has = {};
  var pending = false; // 防抖

  function flushSchedulerQueue() {
    var flushQueue = queue.slice(0);
    queue = []; // 在刷新的过程中可能有新的watcher，重新放到queue中
    has = {};
    pending = false;
    flushQueue.forEach(function (q) {
      return q.run();
    });
  }
  function queueWatcher(watcher) {
    var id = watcher.id;
    if (!has[id]) {
      queue.push(watcher);
      has[id] = true;
      // 不管update执行多少次，但最终只执行一轮刷新
      if (!pending) {
        nextTick(flushSchedulerQueue);
        pending = true;
      }
    }
  }

  /**
   * 开发者可能在更新响应式数据前后，使用setTimeout或者Promise获取DOM
   * 渲染页面时一个异步行为，事件循环中计时任务和微任务优先级也不同
   * 为了防止出现响应式数据更新，但获取不到最新的页面DOM的情况
   * 推荐使用nextTick方法，统一使用的异步方法
   */
  var callbacks = [];
  var waiting = false;
  function flushCallbacks() {
    var cbs = callbacks.slice(0);
    waiting = false;
    callbacks = [];
    cbs.forEach(function (cb) {
      return cb();
    }); // 按照顺序依次执行
  }

  /**
   * 将任务维护到队列中
   * 源码中nextTick没有使用某个api，而是采用优雅降级的方式
   * 内部先采用的时promise(ie不兼容) => MutationObserver(h5) => ie专享的 setImmediate => setTimeout
   * @param {*} cb
   */

  var timerFunc;
  if (Promise) {
    timerFunc = function timerFunc() {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    var observer = new MutationObserver(flushCallbacks); //这里传入的回调时异步执行的
    var textNode = document.createTextNode(1);
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function timerFunc() {
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    timerFunc = function timerFunc() {
      setImmediate(flushCallbacks);
    };
  } else {
    timerFunc = function timerFunc() {
      setTimeout(flushCallbacks);
    };
  }
  function nextTick(cb) {
    callbacks.push(cb); // 维护nextTick中的callback方法
    if (!waiting) {
      setTimeout(function () {
        timerFunc(); // 最后一起刷新
      }, 0);
      waiting = true;
    }
  }

  /**
   * 收集依赖 vue dep watcher
   * data:{name,msg} dep和data中的属性是一一对应的
   * watcher: 在视图上用了几个，就有几个watcher
   * dep与watcher:
   */

  // 初始化数据状态

  // 初始化数据
  function initState(vm) {
    var opts = vm.$options;
    // 判断
    if (opts.props) ;
    if (opts.data) {
      initData(vm);
    }
    if (opts.watch) {
      initWatch(vm);
    }
    if (opts.computed) {
      initComputed(vm);
    }
    if (opts.methods) ;
  }
  function initWatch(vm) {
    debugger;
    var watch = vm.$options.watch;
    for (var key in watch) {
      var handler = watch[key];
      if (Array.isArray(handler)) {
        for (var i = 0; i < handler.length; i++) {
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
    var data = vm.$options.data;

    // 判断data是对象还是函数，并改变函数data的this指向 ==> data.call(vm) ！！！
    data = vm._data = typeof data === "function" ? data.call(vm) : data;

    // 将data上所有属性代理到实例 vm(Vue) 实例上
    for (var key in data) {
      proxy(vm, "_data", key);
    }

    // data数据劫持
    observer$1(data);
  }

  // 给vm对象上添加data属性
  function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
      get: function get() {
        return vm[source][key];
      },
      set: function set(newVal) {
        vm[source][key] = newVal;
      }
    });
  }

  /**
   * 初始化计算属性
   * 计算属性依赖真的值发生改变才会重写执行用户的方法
   * 计算属性要维护一个dirty属性，默认计算属性不会立即执行
   * 计算属性也是一个watcher，默认渲染会创建一个渲染watcher
   * */
  function initComputed(vm) {
    var computed = vm.$options.computed;
    // 计算属性watcher保存到vm上
    var watchers = vm._computedWatchers = {};
    for (var key in computed) {
      var userDef = computed[key];
      // 我们需要监控计算属性中get的变化
      var fn = typeof userDef === "function" ? userDef : userDef.get;
      // 如果直接new Watcher 默认执行fn
      // 将属性和watcher对应起来
      watchers[key] = new Watcher(vm, fn, {
        lazy: true
      });
      defineComputed(vm, key, userDef);
    }
  }
  function defineComputed(target, key, userDef) {
    var setter = userDef.set || function () {};
    // 可以通过实例拿到对应的属性
    Object.defineProperty(target, key, {
      get: createComputedGetter(key),
      set: setter
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
      var watcher = this._computedWatchers[key];
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
  function initStateMixin(Vue) {
    Vue.prototype.$nextTick = nextTick;

    // watch实现
    Vue.prototype.$watch = function (exprOrFn, cb) {
      // firstName
      // ()=>vm.firstName
      // {user:true} 标识用户自己写的watch
      // firstName的值变化了，执行cb函数
      new Watcher(this, exprOrFn, {
        user: true
      }, cb);
    };
  }

  /**
   * <div id="app">Hello {{msg}}<h1></h2></div>
   *
   * _c 解析标签
   * attrs
   * _v 解析标签内容
   * _s 解析标签内容中的插值语法
   * render() {
   *    return _c('div',{id:app},_v('Hello'+_s(msg)))
   * }
   */
  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  /**
   * 生成render函数字符串
   * @param {*} el ast抽象语法树
   * @returns
   */
  function generate(el) {
    var children = genChildren(el);
    var code = "_c(\"".concat(el.tag, "\",").concat(el.attrs.length ? "".concat(genProps(el.attrs)) : "undefined", ",").concat(children ? "".concat(children) : "", ")");
    return code;
  }

  /**
   * 处理某个节点 type 1标签 3文本
   * @param {*} node 节点
   * @returns
   */
  function gen(node) {
    if (node.type === 1) {
      return generate(node);
    } else {
      var text = node.text;
      // 检查文本中是否有插值表达式 {{}}
      if (!defaultTagRE.test(text)) {
        return "_v(".concat(JSON.stringify(text), ")");
      }
      var tokens = [];
      // 将正则的lastIndex设置为0
      var lastIndex = defaultTagRE.lastIndex = 0;
      var match;
      while (match = defaultTagRE.exec(text)) {
        var index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push("_s(".concat(match[1].trim(), ")"));
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      return "_v(".concat(tokens.join("+"), ")");
    }
  }

  /**
   * 处理子节点
   * @param {*} el
   * @returns
   */
  function genChildren(el) {
    var children = el.children;
    if (children) {
      return children.map(function (child) {
        return gen(child);
      }).join(",");
    }
  }

  /**
   * 处理元素属性
   * @param {*} attrs
   * @returns
   */
  function genProps(attrs) {
    var str = "";
    var _loop = function _loop() {
      var attr = attrs[i];
      // style="color: pink; font-size: 20px" ==> {value:{color:'pink', font-size:'20px'}}
      if (attr.name === "style") {
        var obj = {};
        attr.value.split(";").forEach(function (item) {
          if (item.trim()) {
            var _item$split = item.split(":"),
              _item$split2 = _slicedToArray(_item$split, 2),
              key = _item$split2[0],
              val = _item$split2[1];
            obj[key.trim()] = val.trim();
          }
        });
        attr.value = obj;
      }
      str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
    };
    for (var i = 0; i < attrs.length; i++) {
      _loop();
    }
    return "{".concat(str.slice(0, -1), "}");
  }

  // ast抽象语法树
  // <div id="app">Hello {{msg}}<h1></h2></div>
  /**
   * {
   *  tag: "div",
   *  attrs: [{id:"app"}],
   *  children:: [
   *    {tag: null, text: "hello"},
   *    {tag: "h"}
   *  ]
   * }
   */

  // const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 标签名称
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*";
  // 动态参数标签: :xxx
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");
  // html标签开头的正则，捕获的内容是标签名 <div
  var startTagOpen = new RegExp("^<".concat(qnameCapture));

  // 匹配标签结尾 </div>
  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>"));

  // 匹配标签属性 id="app" :id="app" {{a}}
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 匹配结束标签 >
  var startTagClose = /^\s*(\/?)>/;
  // const doctype = /^<!DOCTYPE [^>]+>/i;
  // const comment = /^<!\--/;
  // const conditionalComment = /^<!\[/;

  /**
   * {
   *  tag: "div", 开始标签
   *  attrs: [{id:"app"}], 属性
   *  children:: [
   *    {tag: null, text: "hello"},
   *    {tag: "h"}
   *  ]
   * }
   */
  /**
   * 解析生成ast抽象语法树
   * @param {*} html 原始HTML字符串
   * @returns
   */
  function parseHTML(html) {
    var ELEMENT_TYPE = 1;
    var TEXT_TYPE = 3;
    // <div id="app">Hello {{msg}}<h1></h2></div>
    var root; // 根元素
    var currentParent; // 当前元素的父元素
    var stack = []; // 数据结构：栈（开始标签入栈，结束标签出栈）找出元素的父元素
    /**
     * 开始标签
     * @param {*} tag 当前元素
     * @param {*} attrs 当前元素属性
     */
    function start(tag, attrs) {
      var node = createASTElement(tag, attrs);
      if (!root) {
        root = node;
      }
      if (currentParent) {
        node.parent = currentParent;
      }
      stack.push(node);
      currentParent = node;
    }

    /**
     * 解析文本添加至ast抽象语法树
     * @param {*} text
     */
    function charts(text) {
      // text = text.replace(/[ \f\t\r\n]+/g, "");
      text = text.replace(/[ \n]+/g, " ").trim();
      if (text) {
        currentParent.children.push({
          type: TEXT_TYPE,
          text: text
        });
      }
    }

    /**
     * 结束标签
     * @param {*} tag
     */
    function end(tag) {
      var node = stack.pop();
      currentParent = stack[stack.length - 1];
      // 元素的闭合
      if (currentParent) {
        node.parent = currentParent.tag;
        currentParent.children.push(node);
      }
    }

    /**
     * 创建ast抽象语法树
     * @param {*} tag 标签
     * @param {*} attrs 标签属性
     * @returns
     */
    function createASTElement(tag, attrs) {
      return {
        tag: tag,
        attrs: attrs,
        children: [],
        type: ELEMENT_TYPE,
        parent: null
      };
    }
    // 循环解析html html为空结束
    while (html) {
      // 如果textEnd中索引是0则说明是一个开始标签或结束标签
      // 如果textEnd > 0 说明就是文本的结束位置
      var textEnd = html.indexOf("<"); // 0
      // 此时html = <div id="app">Hello {{msg}}</div>
      if (textEnd === 0) {
        // 标签
        // 1. 开始标签
        var startTagMatch = parseStartTag(); // 得到开始标签的解析对象
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }

        // 2. 结束标签
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
      }

      // 解析文本
      // 此时html = Hello {{msg}}</div>
      if (textEnd > 0) {
        // 获取文本内容
        var text = html.substring(0, textEnd);
        if (text) {
          advance(text.length);
          charts(text);
        }
        continue;
      }
    }

    /**
     * 解析开始标签
     * @returns
     */
    function parseStartTag() {
      // 解析开始标签
      var start = html.match(startTagOpen); // 1结果 2false
      if (!start) {
        return false;
      }
      // 保存标签名和标签属性
      var match = {
        tagName: start[1],
        attrs: []
      };
      advance(start[0].length);

      // 解析标签中的属性
      var attr;
      var end;
      // 循环判断是都到了结束标签 > 并且 开头标签中有属性 并赋值给attr
      while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
        advance(attr[0].length);
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5] || true
        });
      }
      if (end) {
        advance(end[0].length);
        return match;
      }
      return false;
    }

    /**
     * 解析完后删除内容
     * @param {*} n 需要删除的下标
     */
    function advance(n) {
      html = html.substring(n);
    }
    return root;
  }

  function compileToFunction(el) {
    // 1. 将html变成ast抽象语法数
    var ast = parseHTML(el);

    /**
     * 2. 将ast抽象语法数变成render函数
     *  - 先将ast抽象语法数解析为字符串
     *  - 把字符串转为函数
     */
    var code = generate(ast);
    // 3. 将render字符串转为函数
    // with(this) 表示里面的函数的传递参数只能从this中获取
    var render = new Function("with(this){return ".concat(code, "}"));
    return render;
  }

  /**
   * render() = _c('div',{id:app},_v('Hello'+_s(msg)))
   * 在Vue原型上添加_render()函数
   * 生成虚拟DOM vnode
   * @param {*} Vue
   */
  function renderMixin(Vue) {
    // 标签
    Vue.prototype._c = function () {
      // 创建标签节点
      return createElementVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };
    // 文本
    Vue.prototype._v = function (text) {
      return createTextVNode(this, text);
    };
    // 变量
    Vue.prototype._s = function (val) {
      return val === null ? "" : _typeof(val) === "object" ? JSON.stringify(val) : val;
    };
    Vue.prototype._render = function () {
      // render函数变为vnode
      var vm = this;
      var render = vm.$options.render;

      //执行render函数_c,_v,_s函数都在Vue原型上！！！
      var vnode = render.call(this);
      return vnode;
    };
  }
  var isReservedTag = function isReservedTag(tag) {
    return ["a", "div", "p", "button", "ul", "li", "span"].includes(tag);
  };

  // 创建元素节点
  function createElementVNode(vm, tag) {
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var key = data.key;
    if (key) {
      delete data.key;
    }
    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }
    if (isReservedTag(tag)) {
      return vnode(tag, key, data, children);
    } else {
      // 创造一个组件的虚拟节点（包含组件的构造函数）
      // Ctor就是组件的定义，可能是一个Sub类，也可能是组件的obj选项
      var Ctor = vm.$options.components[tag]; //组件的构造函数
      return createComponentVNode(vm, tag, key, data, children, Ctor);
    }
  }
  function createComponentVNode(vm, tag, key, data, children, Ctor) {
    if (_typeof(Ctor) === "object") {
      // Ctor = Vue.extend(Ctor)
      Ctor = vm.$options._base.extend(Ctor);
    }
    data.hook = {
      // 稍后创造真实节点的时候，如果是组件则调用此init方法
      init: function init(vnode) {
        var instance = vnode.componentInstance = new vnode.componentOptions.Ctor();
        instance.$mount();
      }
    };
    return vnode(tag, key, data, children, null, {
      Ctor: Ctor
    });
  }
  function createTextVNode(vm, text) {
    return vnode(undefined, undefined, undefined, undefined, text);
  }

  // 创建虚拟DOM
  function vnode(tag, key, data, children, text, componentOptions) {
    return {
      tag: tag,
      key: key,
      data: data,
      children: children,
      text: text,
      componentOptions: componentOptions
    };
  }
  function isSameVnode(vnode1, vnode2) {
    return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
  }

  function createComponent(vnode) {
    var i = vnode.data;
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
  function createElm(vnode) {
    var tag = vnode.tag,
      children = vnode.children;
      vnode.key;
      var data = vnode.data,
      text = vnode.text;
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
        children.forEach(function (child) {
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
  function patch(oldVNode, vnode) {
    // 没有oldVNode说明是组件挂载
    if (!oldVNode) {
      return createElm(vnode); // vm.$el 对应的就是组件渲染的结果
    }

    /**
     * isRealElement是否是真实DOM（真实DOM上才有nodeType）
     */
    var isRealElement = oldVNode.nodeType;
    if (isRealElement) {
      // 如果是真实DOM，说明是第一次渲染，直接替换真实DOM
      var elm = oldVNode;
      var parentElm = elm.parentNode;
      var newElm = createElm(vnode);
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
      var _el = createElm(vnode);
      oldVNode.el.parentNode.replaceChild(_el, oldVNode.el);
      return _el;
    }

    // tag === tag && key === key
    // 复用老节点的元素
    var el = vnode.el = oldVNode.el;
    // 如果是文本
    if (!oldVNode.tag) {
      if (oldVNode.text !== vnode.text) {
        el.textContent = vnode.text;
      }
    }

    // 如果是标签，需要比对标签的属性
    patchProps(el, oldVNode.data, vnode.data);
    // 比较儿子节点，一方有children，一方没有children || 两方都有children
    var oldChildren = oldVNode.children || [];
    var newChildren = vnode.children || [];
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
    for (var i = 0; i < newChildren.length; i++) {
      var child = newChildren[i];
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
    var oldStartIndex = 0; // 旧头指针
    var newStartIndex = 0; // 新头指针
    var oldEndIndex = oldChildren.length - 1; // 旧尾指针
    var newEndIndex = newChildren.length - 1; // 新尾指针

    var oldStartVnode = oldChildren[oldStartIndex]; // 旧头指针指向的旧节点
    var newStartVnode = newChildren[newStartIndex]; // 新头指针指向的新节点

    var oldEndVnode = oldChildren[oldEndIndex]; // 旧尾指针指向的旧节点
    var newEndVnode = newChildren[newEndIndex]; // 新尾指针指向的新节点

    // 根据老的列表做一个映射关系
    function makeIndexByKey(children) {
      var map = {};
      children.forEach(function (child, index) {
        map[child.key] = index;
      });
      return map;
    }
    var map = makeIndexByKey(oldChildren);
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
        var moveIndex = map[newStartVnode.key]; // 如果拿到则说明是要移动的索引
        if (moveIndex !== undefined) {
          var moveVnode = oldChildren[moveIndex]; // 找到对应的虚拟节点 复用
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
      for (var i = newStartIndex; i <= newEndIndex; i++) {
        var childEl = createElm(newChildren[i]);
        // 可能是向后追加，也可能是向前追加
        // 尾指针后面没有值，向后追加
        // 尾指针后面有值，向前追加
        var anchor = newChildren[newEndIndex + 1] ? newChildren[newEndIndex + 1].el : null;
        // anchor 为null 的时候，则相当于 el.appendChild(childEl)
        el.insertBefore(childEl, anchor);
      }
    }

    // 旧节点元素比新节点多，删除多出来的元素
    if (oldStartIndex <= oldEndIndex) {
      for (var _i = oldStartIndex; _i <= oldEndIndex; _i++) {
        if (oldChildren[_i]) {
          var _childEl = oldChildren[_i].el;
          el.removeChild(_childEl);
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
  function patchProps(el, oldProps, props) {
    // 旧属性有，新属性没有，删除旧属性
    var oldStyles = (oldProps === null || oldProps === void 0 ? void 0 : oldProps.style) || {};
    var newStyles = (props === null || props === void 0 ? void 0 : props.style) || {};
    // 比较样式
    for (var key in oldStyles) {
      if (!newStyles[key]) {
        el.style[key] = "";
      }
    }
    // 比较属性
    for (var _key in oldProps) {
      if (!props[_key]) {
        el.removeAttribute(_key);
      }
    }

    // 用新的覆盖旧的
    for (var _key2 in props) {
      if (_key2 === "style") {
        for (var styleName in props.style) {
          el.style[styleName] = props.style[styleName];
        }
      } else {
        el.setAttribute(_key2, props[_key2]);
      }
    }
  }

  // Vue面试题
  // vue的渲染流程 => 数据初始化 => 对模板进行编译 => 变成render => 通过render函数解析成vnode => 解析为真实dom => 放到页面

  // 源码
  // 1. vm._render 将render函数变为vnode虚拟DOM
  // 2. vm._updata 将vnode变成真实DOM放到页面
  /**
   * 挂在组件
   * @param {*} vm Vue对象
   * @param {*} el #app
   */
  function mountComponent(vm, el) {
    callHook(vm, "beforeMount");
    var updataComponent = function updataComponent() {
      vm._update(vm._render());
    };
    new Watcher(vm, updataComponent, true, function () {}); // true用于标识是一个渲染watcher
    callHook(vm, "mounted");
  }

  /**
   * 生命周期
   * @param {*} Vue
   */
  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      var vm = this;
      var el = vm.$el;
      var prevVnode = vm._vnode;
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
  function callHook(vm, hook) {
    var handlers = vm.$options[hook];
    if (handlers) {
      for (var i = 0; i < handlers.length; i++) {
        handlers[i].call(vm);
      }
    }
  }

  // 初始化
  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      var vm = this;
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
      var vm = this;
      var options = vm.$options;
      el = document.querySelector(el); // 获取根元素
      vm.$el = el;
      // 先进行查找有没有render
      if (!options.render) {
        var template = options.template;
        // 没有render看一下是否写了template，没写template采用外部template
        if (!template && el) {
          template = el.outerHTML;
        } else {
          template = options.template;
        }
        // 只要有模板就挂载
        if (template) {
          // 生成ast抽象语法树 => 将ast转为render字符串 ==> 字符串转为render函数
          var render = compileToFunction(template);

          // render生成vnode虚拟节点
          options.render = render;
        }
      }
      // 将虚拟节点转为真实DOM
      mountComponent(vm);
    };
  }

  // Vue入口文件
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

  /**
   * 1. 将数据先处理成响应式initState(针对对象来说主要是增加Object.defineProperty，针对数组就是重写方法)
   * 2. 编译模板：将腹板转换为ast抽象语法树，将ast抽象语法树生成render方法
   * 3. 调用render函数，会执行产生虚拟DOM render(){_c('div',{id:app},_v('Hello'+_s(msg)))} 触发get()方法
   * 4. 将虚拟DOM渲染成真实DOM
   * */

  return Vue;

}));
//# sourceMappingURL=vue.js.map
