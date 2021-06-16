/**
 * 4. 如何切割渲染过程为执行单元？
 * 核心是 Fiber！
 * 
 * React 15及以前渲染过程是递归执行，不能中断的；
 * React 16以后重构为异步的可中断更新，引入了全新的Fiber架构。
 * 
 * Fiber有多重含义，在这里可以理解为：每个Fiber节点都是一个工作单元，保存了需要执行的工作，包括删除/插入/更新等DOM操作；每个React element有其对应的Fiber节点，Fiber.child、Fiber.parent、Fiber.sibling三个属性将所有工作单元组织起来。
 * 
 */

export function performUnitOfWork(fiber) {
  // 首先，创建节点并添加到DOM元素，添加fiber属性
  if (!fiber.dom) {
    fiber.dom = createDom(fiber) // createDom会返回真实DOM元素
  }

  // 将fiber.dom添加到parent DOM元素上
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }
​
  // 每个子元素创建新的fiber
  const elements = fiber.props.children
  let index = 0
  let prevSibling = null
​
  while (index < elements.length) {
    const element = elements[index]
​
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
​    // 第一个子元素作为child，其余的子元素作为 sibling
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }
​    
    prevSibling = newFiber
    index++
  }

  ​// 返回下一个工作单元：child->sibling->parent.sibling
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}
​


