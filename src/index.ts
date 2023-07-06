export {defaultComponents} from './components/defaults'
import { TypedObject } from '@portabletext/types'
import { PropType, defineComponent } from 'vue'
import { PortableTextOptions } from './types'
import { toHTML } from './to-html'

export {mergeComponents} from './components/merge'
export {escapeHTML, uriLooksSafe} from './escape'
export {toHTML} from './to-html'
export * from './types'

export const SanityBlocks = defineComponent({
    functional: true,
    props: {
        blocks: Object as PropType<TypedObject[]>,
        options: Object as PropType<PortableTextOptions>
    },
    setup(props) {
        return () => {
            if (props.blocks === undefined) {
                return []
            }
            return toHTML(props.blocks, props.options)
        }
    },
})
