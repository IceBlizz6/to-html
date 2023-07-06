import type {PortableTextBlockStyle} from '@portabletext/types'

import type {PortableTextBlockComponent, PortableTextHtmlComponents} from '../types'
import {DefaultListItem, defaultLists} from './list'
import {defaultMarks} from './marks'
import {
  DefaultUnknownBlockStyle,
  DefaultUnknownList,
  DefaultUnknownListItem,
  DefaultUnknownMark,
  DefaultUnknownType,
} from './unknown'
import { VNode, h } from 'vue'

export const DefaultHardBreak = (): VNode => h("br", "")

export const defaultPortableTextBlockStyles: Record<
  PortableTextBlockStyle,
  PortableTextBlockComponent | undefined
> = {
  normal: ({children}) => h("p", children),
  blockquote: ({children}) => h("blockquote", children),
  h1: ({children}) => h("h1", children),
  h2: ({children}) => h("h2", children),
  h3: ({children}) => h("h3", children),
  h4: ({children}) => h("h4", children),
  h5: ({children}) => h("h5", children),
  h6: ({children}) => h("h6", children),
}

export const defaultComponents: PortableTextHtmlComponents = {
  types: {},

  block: defaultPortableTextBlockStyles,
  marks: defaultMarks,
  list: defaultLists,
  listItem: DefaultListItem,
  hardBreak: DefaultHardBreak,

  unknownType: DefaultUnknownType,
  unknownMark: DefaultUnknownMark,
  unknownList: DefaultUnknownList,
  unknownListItem: DefaultUnknownListItem,
  unknownBlockStyle: DefaultUnknownBlockStyle,
}
