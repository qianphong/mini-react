import { createTextNode, createNode, isFC } from './utils'
import type { ElementType, VDom, VDomElement, Fiber, FC } from './types'

type FiberOfUnit = Fiber | null | undefined

// 为创建的节点添加属性
function updateProps(dom: VDomElement | undefined, props: VDom['props']) {
  if (!props || !dom) return
  Object.keys(props).forEach(prop => {
    if (prop === 'children') return
    dom[prop] = props[prop]
  })
}

// 处理子节点 转换链表
function initChildren(fiber: Fiber, children?: VDom[]) {
  let prevChild: Fiber
  children?.forEach((child, index) => {
    const newFiber: Fiber = {
      type: child.type,
      props: child.props,
      dom: null,
      parent: fiber,
      sibling: null,
      child: null,
    }
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevChild.sibling = newFiber
    }
    prevChild = newFiber
  })
}
// 更新函数组件
function updateFunctionComponent(fiber: any) {
  initChildren(fiber, [fiber.type(fiber.props)])
}
// 更新原始组件
function updateHostComponent(fiber: any) {
  if (fiber.type) {
    // 1. 创建Node节点
    fiber.dom = createNode(fiber.type)
    // 2. 添加属性 props
    updateProps(fiber.dom, fiber.props)
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
function workLoop(
  deadline: IdleDeadline | undefined,
  nextFiberOfUnit: FiberOfUnit,
) {
  if (deadline) {
    let shouldYield = false

    while (!shouldYield && nextFiberOfUnit) {
      nextFiberOfUnit = performFiberOfUnit(nextFiberOfUnit)
      shouldYield = deadline.timeRemaining() < 1
    }
  }

  // 如果存在nextFiber，就调用requestIdleCallback继续执行
  if (nextFiberOfUnit) {
    window.requestIdleCallback(deadline => workLoop(deadline, nextFiberOfUnit))
  } else {
    commitDom(firstFiber)
    firstFiber = null
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
    fiberParent?.dom?.appendChild(fiber.dom)
  }

  commitDom(fiber.child)
  commitDom(fiber.sibling)
}

let firstFiber: FiberOfUnit

// 渲染函数
function render(el: VDom, container: HTMLElement) {
  firstFiber = {
    child: null, // 子节点
    sibling: null, // 兄弟节点
    parent: null, // 父节点
    dom: container, // 当前节点 dom
    type: undefined,
    props: {
      children: [el],
    },
  }
  workLoop(undefined, firstFiber)
}

// 创建元素
function createElement(
  type: ElementType | FC,
  props: Record<string, any>,
  ...children: (string | VDom)[]
): VDom {
  return {
    type,
    props: {
      ...props,
      children: children?.map(child => {
        if (typeof child === 'string' || typeof child === 'number') {
          return createTextNode(child)
        } else {
          return child
        }
      }),
    },
  }
}

export default { render, createElement }
