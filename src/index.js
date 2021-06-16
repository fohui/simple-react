/** @jsxRuntime classic */
/** @jsx createElement */
import { createElement } from './react/createElement'
import { render, useState } from './react'

function Counter() {
  const [state, setState] = useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)} data-ok="1">
      Count: {state}
    </h1>
  )
}
const element = <Counter />
const container = document.getElementById("root")
render(element, container)