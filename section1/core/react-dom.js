import react from './react.js'

const ReactDOM = {
  createRoot(container) {
    return {
      render(app) {
        react.render(app, container)
      },
    }
  },
}
export default ReactDOM
