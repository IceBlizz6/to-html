import { h } from 'vue'
import type {PortableTextHtmlComponents} from '../types'
import {unknownTypeWarning} from '../warnings'

export const DefaultUnknownType: PortableTextHtmlComponents['unknownType'] = ({
  value,
  isInline,
}) => {
  const warning = unknownTypeWarning(value._type)
  return isInline
    ? h("span", { style: "display:none" }, warning)
    : h("div", { style: "display:none" }, warning)
}

export const DefaultUnknownMark: PortableTextHtmlComponents['unknownMark'] = ({
  markType,
  children,
}) => {
  return h("span", { class: `unknown__pt__mark__${markType}` }, children)
}

export const DefaultUnknownBlockStyle: PortableTextHtmlComponents['unknownBlockStyle'] = ({
  children,
}) => {
  return h("p", children)
}

export const DefaultUnknownList: PortableTextHtmlComponents['unknownList'] = ({children}) => {
  return h("ul", children)
}

export const DefaultUnknownListItem: PortableTextHtmlComponents['unknownListItem'] = ({
  children,
}) => {
  return h("li", children)
}
