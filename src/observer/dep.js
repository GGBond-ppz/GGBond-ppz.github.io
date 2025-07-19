/**
 * 收集依赖 vue dep watcher
 * data:{name,msg} dep和data中的属性是一一对应的
 * watcher: 在视图上用了几个，就有几个watcher
 */
let id = 0;
class Dep {
  constructor(name) {
    this.name = name;
    this.id = id++;
    this.subs = []; // 存放当前属性对应的watcher
  }

  // 依赖收集 收集watcher
  /**
   * 这里我们不希望放重复的watcher
   * Dep.target = Watcher
   * 将自己添加到watcher中(watcher中记录dep)
   * 双向记忆（双向绑定）
   */
  depend() {
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
  addSub(watcher) {
    this.subs.push(watcher); // 此时已经完成双向记忆
  }
  // 将dep上所有的watcher进行更新（派发更新）
  notify() {
    debugger;
    this.subs.forEach((watcher) => {
      watcher.update();
    });
  }
}

// 添加watcher
Dep.target = null;
/**
 * 将Dep.target设置为watcher
 * watcher不止一个有渲染watcher，computer watcher...
 * 用栈来保存所有watcher
 * @param {Watcher} watcher
 */
let stack = [];
export function pushTarget(watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}

/**
 * 将Dep.target设置为null
 */
export function popTarget() {
  stack.pop();
  Dep.target = stack[stack.length - 1];
}

export default Dep;
