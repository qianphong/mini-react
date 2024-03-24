export const TEXT_ELEMENT = 'TEXT_ELEMENT'

export function createTextNode(text: string) {
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
