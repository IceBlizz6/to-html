import { h } from 'vue'
import type {PortableTextListComponent, PortableTextListItemComponent} from '../types'

export const defaultLists: Record<'number' | 'bullet', PortableTextListComponent> = {
  number: ({children}) => h("ol", children),
  bullet: ({children}) => h("ul", children),
}

export const DefaultListItem: PortableTextListItemComponent = ({children}) => h("li", children)
