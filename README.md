# simple-react

react实现源码在src/react，主要是方便学习，不建议用于生产。

实现了React 16.0的主要特性
- 基于requestIdleCallback的任务调度
- 基于fiber的工作单元划分
- 渲染过程由render阶段和commit阶段组成
- 支持Function Component
- 支持useState


## 项目启动

项目基于create-react-app创建，启动本地服务预览效果：
```js
yarn start
```

## 简易React运行流程

1. JSX语法解析完全看createElement()，可以被其他模块的类似方法替代；
解析的结果是一个type、props组成的JSON结构，type可以是一个标签字符串，也可以是一个函数(函数组件)。
2. render()只是初始化一些数据，例如初始化root fiber：wipRoot，初始化工作单元：nextUnitOfWork，记录需要删除的节点：deletions。
3. 引入React模块时，调度系统即开始工作；当render调用、nextUnitOfWork赋值，则浏览器利用空闲时间进行渲染操作，直至所有fiber节点都处理完成。
4. 每个fiber节点是一个工作单元，一个工作单元执行一次performUnitOfWork()；performUnitOfWork首先区分函数组件或标签组件，具有不同的行为；performUnitOfWork最后会返回下一个工作单元，更新nextUnitOfWork。
   1. 函数组件：重新获取children，调用协调方法：reconcileChildren；
   2. 标签组件：如果没有fiber.dom属性，如果是新节点则创建全新的DOM元素，调用协调方法reconcileChildren；
5. DOM更新在updateDom处理，主要处理以下事情：
   1. 对于onxxx属性，过滤出不存在的属性、新的属性，移除对应的事件处理函数；
   2. 对于除children、事件的其他属性，如果不再存在，则置为空字符串；
   3. 对于除children、事件的其他属性，如果是新属性，则设置。
6. performUnitOfWork返回下一个工作单元的逻辑为：
   1. 首先如果存在fiber.child，则作为下一个工作单元；
   2. 然后如果存在fiber.sibling，则作为下一个工作单元；
   3. 定位到fiber.parent，查找其sibling，其parent.sibling；
   4. 循环查找，直至root fiber，完整渲染过程。
7. reconcileChildren非常关键，涉及到fiber节点的创建、fiber链的关联、新旧fiber的比较：
   1. reconcileChildren接收当前节点wipFiber、以及其子节点数组elements；
   2. wipFiber.alternate 或wipFiber.alternate.child 保存了旧的fiber节点，作为oldFiber；
   3. 遍历elements，构造newFiber节点，存在parent、alternate属性；
   4. 最后更新fiber链关系，当前fiber节点的子节点：wipFiber.child，上一个兄弟节点的sibling：prevSibling.sibling；
   5. 更新oldFiber为oldFiber.sibling；
   6. 循环直到遍历完所有elements，或者oldFiber.sibling为空。
8. 构造newFiber节点，唯一的区别在于effectTag不一样：
   1. 当element.type和oldFiber.type相同， effectTag为UPDATE；
   2. 当element.type和oldFiber.type不相同，element 存在，则为新增元素， effectTag为PLACEMENT；
   3. 当element.type和oldFiber.type不相同，oldFiber 存在，则为删除元素，effectTag为DELETION；并且deletions收集oldFiber；
9. react将状态更新的过程分为render阶段和commit阶段：render阶段主要对fiber节点信息进行更新，交给performUnitOfWork执行，直到返回的下一个工作单元为`undefined`，表示fiber节点更新完毕、deletions收集完毕；commit阶段，交给浏览器真正更新DOM。
10. commit阶段的工作交给commitWork执行，主要有：
    1. 对于函数组件，fiber.dom不存在，需要过滤出具有fiber.dom的fiber.parent节点，称为domParentFiber；
    2. 对于fiber节点，根据effectTag分别进行创建、更新或删除；
    3. 递归执行child、sibling节点，调用commitWork()，直到fiber没有。
    4. ⚠️ React组件的fiber是没有dom属性的，所以在commit节点要注意过滤这些节点。
11. 实现了function component，接下来增加useState Hook，给予其维持状态的能力。关键：
    1. fiber.hooks数组保存每一个hook信息，每一个hook包括state、queue两个属性，state是当前状态值，queue记录着setState调用的所有action函数；
    2. 当组件更新，执行updateFunctionComponent时，会调用组件函数，依次调用useState；当存在oldFiber时，会从wipFiber.alternate.hooks[hookIndex]读取旧值，否则会初始化；当存在oldFiber时，所有的hook.queue会依次执行，更新state；
    3. 当调用setState时，action会保存在hook.queue，以便下次更新值；然后会更新全局变量nextUnitOfWork为当前fiber，从而激活React 渲染的更新！
12. 至此，实现了一个简易、完整的React渲染/更新流程！


