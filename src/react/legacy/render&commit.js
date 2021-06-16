
/**
 * 6. render阶段和commit阶段
 * 
 * performUnitOfWork存在一个问题：
 * if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
   }

   每次执行一个工作单元都会将fiber.dom插入到真实DOM中，这显然有问题；
   因为浏览器随时会中断我们的操作，这样呈现给用户就不是一个完整的UI了。
   因此，React将整个渲染过程分为render阶段+commit阶段，所有工作单元执行完成后，一并进行真实DOM更新。

   需要对performUnitOfWork和render进行改造:
      wipRoot永远指向root fiber
 * 
 */
function performUnitOfWork(fiber) {
  // 首先，创建节点并添加到DOM元素，添加fiber属性
  if (!fiber.dom) {
    fiber.dom = createDom(fiber) // createDom会返回真实DOM元素
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

let nextUnitOfWork = null
let wipRoot = null

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
function commitRoot() {
  commitWork(wipRoot.child)
  wipRoot = null
}

function render(element,container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }
  nextUnitOfWork = wipRoot
}

function workLoop(deadline) {
  // 是否要暂停
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    // 执行一个工作单元并返回下一个工作单元
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    // 判断空闲时间是否足够
    shouldYield = deadline.timeRemaining() < 1
  }

  // 一旦执行完成，统一执行commit操作
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  window.requestIdleCallback(workLoop)
}
​
window.requestIdleCallback(workLoop)