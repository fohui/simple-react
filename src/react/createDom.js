const isEvent = (key) => key.startsWith("on") // 事件属性
const isProperty = (key) =>
  key !== "children" && !isEvent(key) //除children属性和事件属性
const isNew = (prev, next) => (key) =>
  prev[key] !== next[key] 
const isGone = (prev, next) => (key) => !(key in next) // 在新props中不存在的属性
export function updateDom(dom, prevProps, nextProps) {
  // 移除旧事件
  Object.keys(prevProps)
  .filter(isEvent)
  .filter(
    key =>
      !(key in nextProps) ||
      isNew(prevProps, nextProps)(key)
  )
  .forEach(name => {
    const eventType = name
      .toLowerCase()
      .substring(2)
    dom.removeEventListener(
      eventType,
      prevProps[name]
    )
  })

  // 移除旧属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // 设置新属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
  
  // 增加新事件处理
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

export function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}