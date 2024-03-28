import { createTextNode, createNode, isFC } from './utils'
import type { ElementType, VDom, VDomElement, Fiber, FC } from './types'

type FiberOfUnit = Fiber | null | undefined

// 为创建的节点添加属性
function updateProps(
  dom: VDomElement | undefined,
  newProps: VDom['props'],
  oldProps: VDom['props'],
) {
  if (!dom) return
  // 处理 new 有的情况 (old 有,old 没有)
  if (newProps) {
    Object.keys(newProps).forEach(prop => {
      if (prop === 'children') return
      // 绑定事件
      if (prop.startsWith('on')) {
        const eventType = prop.slice(2).toLowerCase()
        dom.addEventListener(eventType, newProps[prop])
        dom.removeEventListener(eventType, oldProps?.[prop])
      } else {
        dom[prop] = newProps[prop]
      }
    })
  }
  // 处理 old 有的情况 new 没有的情况
  if (oldProps) {
    Object.keys(oldProps).forEach(prop => {
      if (prop === 'children') return
      if (!newProps?.[prop]) {
        // 绑定事件
        if (prop.startsWith('on')) {
          const eventType = prop.slice(2).toLowerCase()
          dom.removeEventListener(eventType, oldProps[prop])
        } else {
          ;(dom as HTMLElement).removeAttribute(prop)
        }
      }
    })
  }
}

// 处理子节点 转换链表 reconcileChildren
function reconcileChildren(fiber: Fiber, children?: (VDom | false)[]) {
  let oldFiber = fiber.alternate?.child
  let prevFiber: Fiber
  children?.forEach((child, index) => {
    let newFiber: Fiber | undefined
    if (child !== false) {
      newFiber = {
        type: child.type,
        props: child.props,
        parent: fiber,
      }
      if (!oldFiber) {
        // 不存在 oldFibre就是新创建
        newFiber.action = 'placement'
      } else if (oldFiber.type === child.type) {
        // 类型相同更新
        newFiber.action = 'update'
        newFiber.dom = oldFiber?.dom
        newFiber.alternate = oldFiber
      } else {
        // 类型不同则创建新的，删除旧的
        newFiber.action = 'placement'
        console.log(oldFiber)
        deletions.push(oldFiber)
      }
    } else {
      deletions.push(oldFiber)
    }

    if (!fiber.child) {
      fiber.child = newFiber
    } else {
      prevFiber.sibling = newFiber
    }

    if (newFiber) {
      prevFiber = newFiber
    }

    if (oldFiber) {
      oldFiber.alternate = undefined
      oldFiber = oldFiber.sibling
    }
  })
  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
}
// 更新函数组件
function updateFunctionComponent(fiber: Fiber) {
  const type: FC = fiber.type as any
  reconcileChildren(fiber, [type(fiber.props)])
}
// 更新原始组件
function updateHostComponent(fiber: Fiber) {
  if (fiber.type) {
    if (!fiber.dom) {
      // 1. 创建Node节点
      fiber.dom = createNode(fiber.type as ElementType)
    }

    // 2. 添加属性 props
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props)
  }
  // 3. 转换链表
  reconcileChildren(fiber, fiber.props?.children)
}
// 执行任务
function performFiberOfUnit(fiber: Fiber): FiberOfUnit {
  if (isFC(fiber.type)) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }
  // 4. 返回下一次任务
  // 子节点
  if (fiber.child) {
    return fiber.child
  }
  // 兄弟节点
  if (fiber.sibling) {
    return fiber.sibling
  }
  // 层层向上查找存在叔叔节点
  let parent = fiber.parent
  while (parent) {
    if (parent.sibling) {
      return parent.sibling
    }
    parent = parent.parent
  }
}

// 循环
function workLoop(nextFiberOfUnit: FiberOfUnit, deadline?: IdleDeadline) {
  if (deadline) {
    let shouldYield = false

    while (!shouldYield && nextFiberOfUnit) {
      nextFiberOfUnit = performFiberOfUnit(nextFiberOfUnit)
      shouldYield = deadline.timeRemaining() < 1
    }
  }

  // 如果存在nextFiber，就调用requestIdleCallback继续执行
  if (nextFiberOfUnit) {
    window.requestIdleCallback(deadline => workLoop(nextFiberOfUnit, deadline))
  } else {
    commitRoot()
  }
}

let wipRoot: FiberOfUnit
let deletions: FiberOfUnit[] = []

function commitRoot() {
  console.log(deletions)
  deletions.forEach(fiber => commitDeletion(fiber))
  commitDom(wipRoot)
  deletions = []
}
// 统一删除提交
function commitDeletion(fiber: FiberOfUnit) {
  if (!fiber) return

  if (fiber.dom) {
    let fiberParent = fiber.parent
    // 往上找，直到找到存在dom的父元素
    while (fiberParent && !fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    console.log(fiber.dom)
    fiberParent?.dom?.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child)
  }
}
// 统一提交 DOM 更改
function commitDom(fiber: FiberOfUnit) {
  if (!fiber) return

  if (fiber.dom) {
    let fiberParent = fiber.parent
    // 往上找，直到找到存在dom的父元素
    while (fiberParent && !fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    if (fiber.action === 'placement') {
      fiberParent?.dom?.appendChild(fiber.dom)
    }
    // else if (fiber.action === 'replace') {
    //   fiberParent?.dom?.appendChild(fiber.dom)
    //   if (fiber.alternate!.dom) {
    //     fiberParent?.dom?.removeChild(fiber.alternate!.dom!)
    //   }
    // }
  }

  commitDom(fiber.child)
  commitDom(fiber.sibling)
}

// 渲染函数
function render(el: VDom, dom: HTMLElement) {
  wipRoot = {
    dom,
    props: {
      children: [el],
    },
  }
  workLoop(wipRoot)
}
// 更新渲染
function update() {
  if (!wipRoot) return
  wipRoot = {
    dom: wipRoot.dom, // 当前节点 dom
    props: wipRoot.props,
    alternate: wipRoot,
  }
  workLoop(wipRoot)
}
function handleChild(children: (string | VDom | (string | VDom)[])[]) {
  const copyChildren: VDom[] = []
  children.forEach(child => {
    if (typeof child === 'string' || typeof child === 'number') {
      copyChildren.push(createTextNode(child))
    } else if (Array.isArray(child)) {
      copyChildren.push(...handleChild(child))
    } else {
      copyChildren.push(child)
    }
  })
  return copyChildren
}
// 创建元素
function createElement(
  type: ElementType | FC,
  props: Record<string, any>,
  ...children: (string | VDom | (string | VDom)[])[]
): VDom {
  return {
    type,
    props: {
      ...props,
      children: handleChild(children),
    },
  }
}

export default { render, createElement, update }
