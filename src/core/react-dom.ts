import react from './react.js'

const ReactDOM = {
  createRoot(container: HTMLElement) {
    return {
      render(app: any) {
        react.render(app, container)
      },
    }
  },
}
export default ReactDOM
