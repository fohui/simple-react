import { performUnitOfWork} from './performUnitOfWork'

/**
 * 3. Concurrent Mode/ 并发模式
 * render的递归实现不能中断，React需要在浏览器空闲时执行渲染，并将渲染的整个执行过程切割为小单元执行
 * 核心是performUnitOfWork + requestIdleCallback API
 *  performUnitOfWork：执行一个工作单元并返回下一个工作单元，负责任务切割；
 *  requestIdleCallback给回调传递deadline，利用浏览器空闲时间执行，防止阻塞渲染、影响高优先级交互
 * 
 * 注意：目前React已经不使用requestIdleCallback，替换为react-scheduler模块
 */
export let nextUnitOfWork = null
​
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
