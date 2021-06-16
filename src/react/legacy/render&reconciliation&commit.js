/**
 * 7. 更新和移除DOM的情况如何处理？
 * 
 * 1. 在commit完成后，currentRoot保存旧的fiber树；
 * 2. 在root fiber创建时，alternate关联旧的fiber树；
 * 3. 在performUnitOfWork执行过程中，
 * 4. 比较的规则如下：
 *    4.1 如果旧的fiber元素和新元素具有相同的类型，那么再进一步进行比较他们的属性；
 *    4.2 如果类型不同，并且有一个新元素，则需要创建一个新的DOM节点；
 *    4.3 如果类型不同，并且有一个旧fiber元素，则移除旧的节点
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
      element.type == oldFiber.type
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
function performUnitOfWork(fiber) {
  // 首先，创建节点并添加到DOM元素，添加fiber属性
  if (!fiber.dom) {
    fiber.dom = createDom(fiber) // createDom会返回真实DOM元素
  }
​
  // 每个子元素创建新的fiber
  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

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
let currentRoot = null
let deletions = null

const isEvent = key => key.startsWith("on") // 事件属性
const isProperty = key =>
  key !== "children" && !isEvent(key) //除children属性和事件属性
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  // 移除旧事件
  Object.keys(prevProps)
  .filter(isEvent)
  .filter(
    key =>
      !(key in nextProps) ||
      isNew(prevProps, nextProps)(key)
  )
  .forEach(name => {
    const eventType = name
      .toLowerCase()
      .substring(2)
    dom.removeEventListener(
      eventType,
      prevProps[name]
    )
  })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })
​
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
}
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom)
  }

  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}
function commitRoot() {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  // commit阶段完成后，保存当前fiber树
  currentRoot = wipRoot
  wipRoot = null
}

function render(element,container) {
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