import { performUnitOfWork} from './performUnitOfWork'

/**
 * 5. render fiber
 * 重构render方法
 * 
 * 1. render()执行的时候，会创建一个root fiber，作为nextUnitOfWork的值；
 * 2. performUnitOfWork会执行nextUnitOfWork记录的工作，主要三件事：增加元素到DOM、创建DOM元素的子元素、返回下一个工作单元(fiber node)；
 * 3. 下个工作单元的查找顺序为：如果有child，则其作为下个工作单元；否则如果有sibling，则其作为下个工作单元；否则如果有parent.sibling，则其作为下个工作单元；直到抵达root，表示渲染执行完成！
 * 4. 当浏览器准备好，会执行workLoop，开始渲染过程的执行。
 */
export function render(element,container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork = null

export function workLoop(deadline) {
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
  window.requestIdleCallback(workLoop)
}
​
window.requestIdleCallback(workLoop)
