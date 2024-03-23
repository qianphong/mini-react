# mini-react

mini-react 游戏副本

## 实现最简 mini-react

任务目标

1. 显示 app 文本
2. 自己实现 React 的 API

```tsx
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

### 实现 mini-react

#### 通过命令式 UI ，实现屏幕显示 `app` 文本

```js
const root = document.getElementById('root')
const app = document.createElement('div')
app.id = 'app'
const textNode = document.createTextNode('app')
app.appendChild(textNode)
root.appendChild(app)
```

#### 声明式 UI

react -> vdom 虚拟 DOM -> js Object

1. UI 视为树形结构，使用 jsx 描述 UI
2. 将 jsx 转换成 js object
3. 根据描述 UI 创建 Element
   1. 创建节点（创建方法不一样，文本节点和元素节点）
   2. 设置属性 （遍历属性赋值，排除 `children` 属性）
   3. 元素添加到父级 （循环 `children`递归调用 `render` 方法）

### 如何使用 jsx

1. 使用 Vite 构建项目

2. 思考，如果 DOM 树层级过深，会有什么问题
