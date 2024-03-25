import type { TextElementType, ElementType, VDomElement, FC } from './types'

export const TEXT_ELEMENT: TextElementType = 'TEXT_ELEMENT'

export function createTextNode(text: string | number) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
    },
  }
}

// 判断是否是文字节点
export function isTextNode(type: string) {
  return type === TEXT_ELEMENT
}
export function isFC(type: any): type is FC {
  if (typeof type === 'function') {
    return true
  } else {
    return false
  }
}
// 创建Node节点
export function createNode(type: ElementType): VDomElement {
  return isTextNode(type)
    ? document.createTextNode('')
    : document.createElement(type)
}
