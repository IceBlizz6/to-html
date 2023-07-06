import type {TypedObject} from '@portabletext/types'

import {escapeHTML, uriLooksSafe} from '../escape'
import type {PortableTextMarkComponent} from '../types'
import { h } from 'vue'

interface DefaultLink extends TypedObject {
  _type: 'link'
  href: string
}

const link: PortableTextMarkComponent<DefaultLink> = ({children, value}) => {
  const href = value?.href || ''
  const looksSafe = uriLooksSafe(href)
  if (looksSafe) {
    return h("a", { href: escapeHTML(href) }, children)
  }
  return h("a", children)
}

export const defaultMarks: Record<string, PortableTextMarkComponent | undefined> = {
  em: ({children}) => h("em", children),
  strong: ({children}) => h("strong", children),
  code: ({children}) => h("code", children),
  underline: ({children}) => h("span", { style: "text-decoration:underline" }, children),
  'strike-through': ({children}) => h("del", children),
  link,
}
