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
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
// 动态参数标签: :xxx
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
// html标签开头的正则，捕获的内容是标签名 <div
const startTagOpen = new RegExp(`^<${qnameCapture}`);

// 匹配标签结尾 </div>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);

// 匹配标签属性 id="app" :id="app" {{a}}
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
// 匹配结束标签 >
const startTagClose = /^\s*(\/?)>/;

// 匹配标签响应式内容 {{a}}
const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
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
export function parseHTML(html) {
  const ELEMENT_TYPE = 1;
  const TEXT_TYPE = 3;
  // <div id="app">Hello {{msg}}<h1></h2></div>
  let root; // 根元素
  let currentParent; // 当前元素的父元素
  let stack = []; // 数据结构：栈（开始标签入栈，结束标签出栈）找出元素的父元素
  /**
   * 开始标签
   * @param {*} tag 当前元素
   * @param {*} attrs 当前元素属性
   */
  function start(tag, attrs) {
    let node = createASTElement(tag, attrs);
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
        text,
      });
    }
  }

  /**
   * 结束标签
   * @param {*} tag
   */
  function end(tag) {
    let node = stack.pop();
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
      tag,
      attrs,
      children: [],
      type: ELEMENT_TYPE,
      parent: null,
    };
  }
  // 循环解析html html为空结束
  while (html) {
    // 如果textEnd中索引是0则说明是一个开始标签或结束标签
    // 如果textEnd > 0 说明就是文本的结束位置
    let textEnd = html.indexOf("<"); // 0
    // 此时html = <div id="app">Hello {{msg}}</div>
    if (textEnd === 0) {
      // 标签
      // 1. 开始标签
      const startTagMatch = parseStartTag(); // 得到开始标签的解析对象
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }

      // 2. 结束标签
      let endTagMatch = html.match(endTag);
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
      let text = html.substring(0, textEnd);

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
    const start = html.match(startTagOpen); // 1结果 2false
    if (!start) {
      return false;
    }
    // 保存标签名和标签属性
    let match = {
      tagName: start[1],
      attrs: [],
    };
    advance(start[0].length);

    // 解析标签中的属性
    let attr;
    let end;
    // 循环判断是都到了结束标签 > 并且 开头标签中有属性 并赋值给attr
    while (
      !(end = html.match(startTagClose)) &&
      (attr = html.match(attribute))
    ) {
      advance(attr[0].length);
      match.attrs.push({
        name: attr[1],
        value: attr[3] || attr[4] || attr[5] || true,
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
