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
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

/**
 * 生成render函数字符串
 * @param {*} el ast抽象语法树
 * @returns
 */
export function generate(el) {
  let children = genChildren(el);
  let code = `_c("${el.tag}",${
    el.attrs.length ? `${genProps(el.attrs)}` : "undefined"
  },${children ? `${children}` : ""})`;
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
    let text = node.text;
    // 检查文本中是否有插值表达式 {{}}
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`;
    }
    let tokens = [];
    // 将正则的lastIndex设置为0
    let lastIndex = (defaultTagRE.lastIndex = 0);
    let match;
    while ((match = defaultTagRE.exec(text))) {
      let index = match.index;
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
      }
      tokens.push(`_s(${match[1].trim()})`);
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)));
    }
    return `_v(${tokens.join("+")})`;
  }
  return;
}

/**
 * 处理子节点
 * @param {*} el
 * @returns
 */
function genChildren(el) {
  let children = el.children;
  if (children) {
    return children.map((child) => gen(child)).join(",");
  }
}

/**
 * 处理元素属性
 * @param {*} attrs
 * @returns
 */
function genProps(attrs) {
  let str = "";
  for (let i = 0; i < attrs.length; i++) {
    let attr = attrs[i];
    // style="color: pink; font-size: 20px" ==> {value:{color:'pink', font-size:'20px'}}
    if (attr.name === "style") {
      let obj = {};
      attr.value.split(";").forEach((item) => {
        if (item.trim()) {
          let [key, val] = item.split(":");
          obj[key.trim()] = val.trim();
        }
      });
      attr.value = obj;
    }
    str += `${attr.name}:${JSON.stringify(attr.value)},`;
  }

  return `{${str.slice(0, -1)}}`;
}
