/**@jsx CReact.createElement */
import CReact from './core/react'

let count = 10
const props: any = {
  id: 2,
}
const App = () => {
  const onClick = () => {
    count = count + 1
    delete props.id
    CReact.update()
  }
  return (
    <ul {...props}>
      <li>
        <span>1</span>
        <span>1.2</span>
      </li>
      <li>
        <span>2</span>
      </li>
      <li>
        <AppTwo />
      </li>
      <li>
        <Button onClick={onClick}>点击 {count}</Button>
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
