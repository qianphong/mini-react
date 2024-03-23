const TEXT_ELEMENT = 'TEXT_ELEMENT'
export function createElement(type, props, ...children) {
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
function createTextNode(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
    },
  }
}
function isTextNode(type) {
  return type === TEXT_ELEMENT
}

function render(el, container) {
  const node = isTextNode(el.type)
    ? document.createTextNode(el.props.nodeValue)
    : document.createElement(el.type)

  Object.keys(el.props).forEach(prop => {
    if (prop === 'children') return
    node[prop] = el.props[prop]
  })

  el.props?.children?.forEach(child => {
    render(child, node)
  })

  container.append(node)
}

const React = { render, createElement }

export default React
