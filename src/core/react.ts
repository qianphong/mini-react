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
        } else if (!(dom instanceof Text)) {
          dom.removeAttribute(prop)
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
        deletions.push(oldFiber)
      }
    } else {
      deletions.push(oldFiber)
    }
    // 子节点（第一个子节点）不存在则将newFiber赋值，排除{false}情况反复运行
    if (!fiber.child) {
      fiber.child = newFiber
    } else {
      // 子节点已存在，将上一个子节点的兄弟节点指向当前创建的兄弟节点
      prevFiber.sibling = newFiber
    }
    // 如果存在oldFiber，将下次循环需要的oldFiber的指针指向oldFiber的兄弟节点
    if (oldFiber) {
      oldFiber.alternate = undefined
      oldFiber = oldFiber.sibling
    }
    // 存在新的Fiber才赋值
    if (newFiber) {
      prevFiber = newFiber
    }
  })
  while (oldFiber) {
    deletions.push(oldFiber)
    oldFiber = oldFiber.sibling
  }
}
// 更新函数组件
function updateFunctionComponent(fiber: Fiber) {
  stateHookIndex = 0
  stateHooks = []
  wipFiber = fiber
  wipFiber.stateHooks = stateHooks
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
      // 实现局部更新
      if (wipRoot?.sibling?.type === nextFiberOfUnit?.type) {
        nextFiberOfUnit = undefined
      }
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
let wipFiber: FiberOfUnit

function commitRoot() {
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
    fiberParent?.dom?.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child)
  }
}
// 统一提交 DOM 更改
function commitDom(fiber: FiberOfUnit) {
  if (!fiber) return
  // 局部更新
  if (fiber.type && wipRoot?.sibling?.type === fiber.type) {
    return
  }
  if (fiber.dom) {
    let fiberParent = fiber.parent
    // 往上找，直到找到存在dom的父元素
    while (fiberParent && !fiberParent.dom) {
      fiberParent = fiberParent.parent
    }
    if (fiber.action === 'placement') {
      fiberParent?.dom?.appendChild(fiber.dom)
    }
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
  const currentFiber = wipFiber
  return () => {
    if (currentFiber) {
      wipRoot = {
        type: currentFiber.type,
        dom: currentFiber.dom,
        props: currentFiber.props,
        sibling: currentFiber.sibling,
        alternate: currentFiber,
      }
      workLoop(wipRoot)
    }
  }
}
let stateHooks: any[]
let stateHookIndex: number
// 实现useState
function useState<T>(initialValue: T) {
  const currentFiber = wipFiber as Fiber
  const oldHook = currentFiber.alternate?.stateHooks?.[stateHookIndex]
  const stateHook = {
    state: oldHook ? oldHook.state : initialValue,
  }
  stateHookIndex++
  stateHooks.push(stateHook)

  const setValue = (action: (v: T) => T) => {
    stateHook.state = action(stateHook.state)
    wipRoot = {
      ...currentFiber,
      child: undefined, // 重置整个子树
      alternate: currentFiber,
    }
    workLoop(wipRoot)
  }

  return [stateHook.state, setValue] as const
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

export default { render, createElement, useState }
