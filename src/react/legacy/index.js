import { createDom, updateDom } from '../createDom'

/**
 * 8. function components
 * 接下来实现函数式组件。
 * 函数式组件有两个不同点：
 *   1.函数式组件没有DOM节点
 *   2.他的children属性不在props上，包含在他的返回值里
 * 
 *  function App(props) {
      return Didact.createElement(
        "h1",
        null,
        "Hi ",
        props.name
      )
    }
    const element = Didact.createElement(App, {
      name: "foo",
    })
 */

function reconcileChildren(wipFiber, elements){
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null
  
  /**
   * oldFiber不为空 且 所有子元素未遍历完
   */
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    /**
     * fiber.type是否一致？
     * 一致则 effectTag = UPDATE
     */
    const sameType =
      oldFiber &&
      element &&
      element.type === oldFiber.type
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }

    /**
     * 类型不同，新fiber元素，则新增
     * effectTag = PLACEMENT
     */
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    /**
     * 类型不同，但是旧fiber存在，则移除
     * effectTag = DELETION
     */
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
    }
    
    // 下个循环对兄弟节点进行比较
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }
    /**
     * 如果是第一个子元素，则newFiber设置为child属性
     * 其他子元素，newFiber设置为sibling属性
     */
    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element) {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

function updateFunctionComponent(fiber){
  // 执行函数式组件获取到 children 
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}
function updateHostComponent(fiber){
  // 首先，创建节点并添加到DOM元素，添加fiber属性
  if (!fiber.dom) {
    fiber.dom = createDom(fiber) // createDom会返回真实DOM元素
  }
  // 每个子元素创建新的fiber
  reconcileChildren(fiber, fiber.props.children)
}

function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  // 区分函数式组件和标签组件
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  }else {
    updateHostComponent(fiber)
  }
  // 返回下一个工作单元：child->sibling->parent.sibling
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
let currentRoot = null
let deletions = null

function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}
function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  // commit阶段完成后，保存当前fiber树
  currentRoot = wipRoot
  wipRoot = null
}

export function render(element,container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // root fiber根阶段创建时，记录旧的fiber树
    alternate: currentRoot,
  }
  nextUnitOfWork = wipRoot
  deletions = []
}

function workLoop(deadline) {
  // 是否要暂停
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    console.log(deadline.timeRemaining())
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

window.requestIdleCallback(workLoop)