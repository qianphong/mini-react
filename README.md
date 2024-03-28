# mini-react

mini-react 游戏副本

## 实现最简 mini-react

任务目标

1. 显示 app 文本
2. 自己实现 React 的 API
3. 使用 jsx

### 实现 mini-react

#### 命令式 UI 的实现方式

```js
const root = document.getElementById('root')
const app = document.createElement('div')
app.id = 'app'
const textNode = document.createTextNode('app')
app.appendChild(textNode)
root.appendChild(app)
```

#### 声明式 UI

react -> vdom 虚拟 DOM -> js Object

1. UI 视为树形结构，使用 jsx 描述 UI
2. 将 jsx 转换成 js object
3. 根据描述 UI 创建 Element
   1. 创建节点（创建方法不一样，文本节点和元素节点）
   2. 设置属性 （遍历属性赋值，排除 `children` 属性）
   3. 元素添加到父级 （循环 `children`递归调用 `render` 方法）

### 如何使用 jsx

使用 Vite 构建项目

### 思考，如果 DOM 树层级过深，会有什么问题？

- 渲染问题，频繁添加修改 DOM 多次触发浏览器重排和重绘，可以考虑使用`document.createDocumentFragment`进行优化，最后一次性将文档片段添加到文档中，可以减少对 DOM 的直接操作次数

## 任务调度器&fiber 架构

一点想法：知道任务目标后，先尝试自己思考怎么实现，写写试试，之后再看视频，结合自己的思考实现过程，印象会比较深刻

任务目标

1. 实现任务调度器
2. 如何控制渲染，如何拆分

### 任务调度器

1. JS 单线程，会阻塞渲染
2. 使用分支思想拆分渲染，
3. `requestIdleCallback`

```js
let taskId

function work(IdleDeadline) {
  console.log('taskId:', taskId++)
  console.log('time:', IdleDeadline.timeRemaining())
  window.requestIdleCallback(work)
}

window.requestIdleCallback(work)
```

### fiber 架构

1. UI 树转换成链表结构，规则优先级
   - 优先看有没有 Child，
   - 没有 child 返回兄弟节点
   - 返回叔叔节点（没有子节点和兄弟节点）

关于指针返回下一个 fiber 的问题
没有考虑到如果父节点没有兄弟节点，但是父节点的父节点存在兄弟节点，如图，如果渲染到 D 节点，之后 E、F 节点并不会继续渲染，
思考：应该一直往上找，直到找到存在兄弟节点或者根节点为止
![alt text](img.png)

```js
// 通过建立的指针关系，返回下一个要执行的fiber
if (fiber.child) return fiber.child
if (fiber.sibling) return fiber.sibling
return fiber.parent?.sibling
```

## 统一提交&实现 function component

### 实现统一提交

1. `requestIdleCallback` 中途可能没有时间回调
2. 创建完 DOM 后就添加，将添加 DOM 后置，调整为统一提交 DOm
3. 什么时候执行完？根节点是谁

### 实现 function component

1. function component 的父级没有 dom，要一直往上找

## vdom 的更新

### 实现事件绑定

1. 获取事件类型，绑定事件句柄

### 实现更新 props

1. 如何获取新的 dom 树
2. 如何找到老的节点，设置属性指向老的节点
   - 如果是更新则添加标记`update`，并将老节点的 dom 赋值给新的 fiber，避免重新创建
3. 如何 diff props
   - old 有，new 没有，删除
   - new 有，old 没有，添加
   - new 有，old 有，修改

更新事件属性时应该解绑之前的事件句柄
思考：为什么变量要写在组件外面才会产生变化

函数组件本质上还是一个函数，如果写在函数内部，在调用函数组件创建执行上下文时重新初始化变量对象，变量的值不会改变。所以需要写在函数外作为全局变量。
但是在 React 中应该比避免这种情况，应该保持组件的纯粹，即输入相同，则输出相同，React 文档中关于 [保持组件纯粹](https://react.docschina.org/learn/keeping-components-pure)

## 击杀 update children

### diff-更新 children

删除旧的，创建新的

### diff-删除多余的老节点

一个边界情况，当第一个子节点为表达式，且值为 `false` 时候，

```jsx
const show = false
function App() {
  return (
    <div>
      {show && <span>1</span>}
      <span>2</span>
    </div>
  )
}
```

在 `fiber.child` 赋值时存在错误

```js
// 使用 index === 0 判断存在问题，改为判断fiber是否存在child
if (!fiber.child) {
  fiber.child = newFiber
} else {
  prevFiber.sibling = newFiber
}
```

### 优化更新，减少不必要的计算
