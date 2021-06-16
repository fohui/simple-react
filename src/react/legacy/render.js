
/**
 * 2. 数型结构如何渲染到浏览器中？
 * 
 * 渲染数据到真实DOM，核心API是ReactDOM.render()
 * 这里存在着一个性能问题：递归渲染子节点是一个不可中断的过程，
 * 如果子节点层级过深，耗时过长，会导致浏览器卡顿！
 */
export function render(element,container){
  // 创建真实DOM节点
  const dom =
    element.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)
​ 
  // DOM节点设置属性
  const isProperty = key => key !== "children"
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
​ 
  // DOM节点递归渲染子节点
  element.props.children.forEach(child =>
    render(child, dom)
  )
​  
  // 一次挂载到容器节点
  container.appendChild(dom)
}
