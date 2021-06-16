/**
 * 1. JSX是如何解析的？
 * const element = (
 *  <div id="foo">
 *    <a>bar</a>
 *    <b />
 *  </div>
 * )
 * 通过babel会被转换为：
 * const element = React.createElement(
 *    "div",
 *    { id: "foo" },
 *    React.createElement("a", null, "bar"),
 *  )
 * 
 * JSX语法解析的核心API是React.createElement()，最终产物是从<App></App>开始的树型结构
 */
export function createElement(type, props, ...children){
  return {
    type,
    props: {
      ...props,
      children: children.map(child=>{
        return typeof child === 'object'
          ? child
          : createTextElement(child)
      })
    }
  }
}
function createTextElement(text){
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}