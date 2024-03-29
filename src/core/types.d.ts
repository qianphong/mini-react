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
  dom?: VDomElement
  props?: VDom['props']
  /**子节点 */
  child?: Fiber
  /**兄弟节点 */
  sibling?: Fiber
  /**父节点 */
  parent?: Fiber
  /**旧的 fiber */
  alternate?: Fiber
  action?: 'placement' | 'update'
  stateHooks?: { state: any }[]
}
