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

// 处理子节点 转换链表
function initChildren(fiber: Fiber, children?: VDom[]) {
  let oldFiber = fiber.alternate?.child
  let prevChild: Fiber
  children?.forEach((child, index) => {
    const newFiber: Fiber = {
      type: child.type,
      props: child.props,
      parent: fiber,
    }
    const isUpdate = oldFiber && oldFiber.type === child.type
    if (isUpdate) {
      newFiber.action = 'update'
      newFiber.dom = oldFiber?.dom
      newFiber.alternate = oldFiber
    } else {
      newFiber.action = 'placement'
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevChild.sibling = newFiber
    }
    prevChild = newFiber
    if (oldFiber) {
      oldFiber = oldFiber?.sibling
    }
  })
}
// 更新函数组件
function updateFunctionComponent(fiber: Fiber) {
  const type: FC = fiber.type as any
  initChildren(fiber, [type(fiber.props)])
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
  initChildren(fiber, fiber.props?.children)
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
    commitDom(root)
  }
}

// 统一提交 DOM 更改
function commitDom(fiber: FiberOfUnit) {
  if (!fiber) return

  if (fiber.dom) {
    if (fiber.action === 'placement') {
      let fiberParent = fiber.parent
      // 往上找，直到找到存在dom的父元素
      while (fiberParent && !fiberParent.dom) {
        fiberParent = fiberParent.parent
      }
      fiberParent?.dom?.appendChild(fiber.dom)
    }
  }

  commitDom(fiber.child)
  commitDom(fiber.sibling)
}

let root: FiberOfUnit
// 渲染函数
function render(el: VDom, dom: HTMLElement) {
  workLoop(
    (root = {
      dom,
      props: {
        children: [el],
      },
    }),
  )
}
// 更新渲染
function update() {
  if (!root) return
  workLoop(
    (root = {
      dom: root.dom, // 当前节点 dom
      props: root.props,
      alternate: root,
    }),
  )
  console.log(root)
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
