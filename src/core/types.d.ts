export type TextElementType = 'TEXT_ELEMENT'

export type ElementType = keyof HTMLElementTagNameMap | TextElementType
export type FC<P = any> = (props: P) => VDom

export type VDom = {
  type: ElementType | FC
  props?: {
    children?: VDom[]
    [x: string]: any
  }
}

export type VDomElement = HTMLElement | Text

export type Fiber<T = VDom['type']> = {
  type?: T
  dom: VDomElement | null
  props?: VDom['props']
  child: Fiber | null
  sibling: Fiber | null
  parent: Fiber | null
}
