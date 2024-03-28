/**@jsx CReact.createElement */
import CReact from './core/react'

let count = 10
const props: any = {
  id: 2,
}
let showBar = true
const App = () => {
  const foo = (
    <div>
      foo
      <span>child1</span>
    </div>
  )
  const bar = <div>bar</div>
  const onClick = () => {
    count = count + 1
    showBar = !showBar
    delete props.id
    CReact.update()
  }
  // <li>{showBar ? bar : foo}</li>
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
    </ul>
  )
}

function AppTwo() {
  return (
    <div>
      <Count num={20} />
      <Count num={30} />
      <Count num={40} />
    </div>
  )
}
function Count({ num }) {
  return <span style={{ color: '#f00' }}>{num}</span>
}
function Button({ onClick, children }: { onClick(): void; children?: any }) {
  return <button onClick={onClick}>{children}</button>
}
export default App
