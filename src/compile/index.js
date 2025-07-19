import { generate } from "./generate";
import { parseHTML } from "./parseAst";
export function compileToFunction(el) {
  // 1. 将html变成ast抽象语法数
  let ast = parseHTML(el);

  /**
   * 2. 将ast抽象语法数变成render函数
   *  - 先将ast抽象语法数解析为字符串
   *  - 把字符串转为函数
   */
  let code = generate(ast);
  // 3. 将render字符串转为函数
  // with(this) 表示里面的函数的传递参数只能从this中获取
  let render = new Function(`with(this){return ${code}}`);
  return render;
}
