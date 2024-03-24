import { TEXT_ELEMENT, createTextNode, isTextNode } from './utils'

type ElementType = keyof HTMLElementTagNameMap | typeof TEXT_ELEMENT

type VDomElement = {
  type: ElementType
  props: {
    children?: VDomElement[]
    [x: string]: any
  }
}
type Work = {
  type?: ElementType
  dom: HTMLElement | Text | null
  props: Record<string, any>
  child: Work | null
  sibling: Work | null
  parent: Work | null
}
type WorkOfUnit = Work | null | undefined

export function createElement(
  type: ElementType,
  props: Record<string, any>,
  ...children: any[]
): VDomElement {
  return {
    type,
    props: {
      ...props,
      children: children?.map(child => {
        if (typeof child === 'string') {
          return createTextNode(child)
        } else {
          return child
        }
      }),
    },
  }
}

let nextWorkOfUnit: WorkOfUnit
function render(el: VDomElement, container: any) {
  nextWorkOfUnit = {
    child: null, // 子节点
    sibling: null, // 兄弟节点
    parent: null, // 父节点
    dom: container, // 当前节点 dom
    type: undefined,
    props: {
      children: [el],
    }, // 当前节点属性
  }
  window.requestIdleCallback(workLoop)
}

const React = { render, createElement }

export default React

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)
    console.log(nextWorkOfUnit)

    shouldYield = deadline.timeRemaining() < 1
  }
  window.requestIdleCallback(workLoop)
}

function performWorkOfUnit(work: Work): WorkOfUnit {
  // 1. 创建Node节点
  if (work.type) {
    work.dom = createNode(work.type)
    work.parent?.dom?.appendChild(work.dom)
    // 2. 添加属性 props
    handleProps(work.dom!, work.props)
  }

  // 3. 转换链表
  initChildren(work)

  // 4. 返回下一次任务
  // 子节点
  if (work.child) {
    return work.child
  }
  // 兄弟节点
  if (work.sibling) {
    return work.sibling
  }

  let parent = work.parent
  while (parent) {
    if (parent.sibling) {
      return parent.sibling
    }
    parent = parent.parent
  }
}

// 创建Node节点
function createNode(type: ElementType) {
  return isTextNode(type)
    ? document.createTextNode('')
    : document.createElement(type)
}
// 为创建的节点添加属性
function handleProps(node: HTMLElement | Text, props: VDomElement['props']) {
  Object.keys(props).forEach(prop => {
    if (prop === 'children') return
    node[prop] = props[prop]
  })
}
// 处理子节点 转换链表
function initChildren(work: Work) {
  const children: VDomElement[] | undefined = work.props.children
  let prevChild: Work | null = null
  children?.forEach((child, index) => {
    const newChild: Work = {
      type: child.type,
      props: child.props,
      dom: null,
      parent: work,
      sibling: null,
      child: null,
    }
    if (index === 0) {
      work.child = newChild
    } else {
      prevChild!.sibling = newChild
    }
    prevChild = newChild
  })
}
