/**@jsx CReact.createElement */
import CReact from './core/react'

let count = 10
const props: any = {
  id: 2,
}
let showBar = false
const App = () => {
  const onClick = () => {
    count = count + 1
    showBar = !showBar
    delete props.id
  }
  return (
    <ul {...props}>
      {showBar && (
        <li>
          <span>2</span>
        </li>
      )}
      <li>
        <Button onClick={onClick}>点击</Button>
      </li>
      <Foo />
      <Bar />
    </ul>
  )
}

function Foo() {
  const [count, setCount] = CReact.useState(10)
  const [checked, setChecked] = CReact.useState(false)
  const onClick = () => {
    console.log('1')
    setCount(c => c + 1)
  }
  return (
    <div>
      Foo: {count}
      <Button onClick={onClick}>点击</Button>
      <Button onClick={() => setChecked(c => !c)}>
        {checked ? '是' : '否'}
      </Button>
    </div>
  )
}

let countBar = 0
function Bar() {
  const [count, setCount] = CReact.useState(10)
  const onClick = () => {
    countBar++
  }
  return (
    <div>
      Bar: {countBar}
      <input
        type="text"
        onInput={e => {
          console.log(e)
        }}
      />
    </div>
  )
}
const App2 = () => {
  return (
    <div>
      <Foo />
      <Bar />
    </div>
  )
}

function Button({ onClick, children }: { onClick(): void; children?: any }) {
  return <button onClick={onClick}>{children}</button>
}
export default App2
