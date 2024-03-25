/**@jsx CReact.createElement */
import CReact from './core/react'

const App = (
  <ul className="list">
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
  </ul>
)
function AppOne() {
  return <div>test</div>
}
function Count({ num }) {
  return <span style={{ color: '#f00' }}>{num}</span>
}
function AppTwo() {
  return (
    <div>
      <AppOne />
      <Count num={20} />
      <Count num={30} />
      <Count num={40} />
    </div>
  )
}
export default App
