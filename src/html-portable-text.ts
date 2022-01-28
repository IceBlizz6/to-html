import {
  ListNestMode,
  SerializedBlock,
  ToolkitNestedPortableTextSpan,
  ToolkitTextNode,
} from './toolkit/types'
import type {
  ArbitraryTypedObject,
  MarkDefinition,
  MissingSerializerHandler,
  NodeRenderer,
  PortableTextBlock,
  PortableTextHtmlSerializers,
  PortableTextListItemBlock,
  PortableTextOptions,
  PortableTextSpan,
  HtmlPortableTextList,
  Serializable,
  TypedObject,
} from './types'
import {
  isListItemBlock,
  isPortableTextBlock,
  isToolkitList,
  isToolkitSpan,
  isToolkitTextNode,
} from './toolkit/asserters'
import {nestLists} from './toolkit/nestLists'
import {spanToPlainText} from './toolkit/toPlainText'
import {buildMarksTree} from './toolkit/buildMarksTree'
import {defaultSerializers} from './serializers/defaults'
import {mergeSerializers} from './serializers/merge'
import {escapeHtml} from './escape'
import {
  printWarning,
  unknownBlockStyleWarning,
  unknownListItemStyleWarning,
  unknownListStyleWarning,
  unknownMarkWarning,
  unknownTypeWarning,
} from './warnings'

export function toHTML<B extends TypedObject = PortableTextBlock | ArbitraryTypedObject>(
  value: B | B[],
  options: PortableTextOptions = {}
): string {
  const {
    serializers: serializerOverrides,
    listNestingMode,
    onMissingSerializer: missingSerializerHandler = printWarning,
  } = options

  const handleMissingSerializer = missingSerializerHandler || noop
  const blocks = Array.isArray(value) ? value : [value]
  const nested = nestLists(blocks, listNestingMode || ListNestMode.Html)
  const serializers = serializerOverrides
    ? mergeSerializers(defaultSerializers, serializerOverrides)
    : defaultSerializers

  const renderNode = getNodeRenderer(serializers, handleMissingSerializer)
  const rendered = nested.map((node, index) =>
    renderNode({node: node, index, isInline: false, renderNode})
  )

  return rendered.join('')
}

const getNodeRenderer = (
  serializers: PortableTextHtmlSerializers,
  handleMissingSerializer: MissingSerializerHandler
): NodeRenderer => {
  function renderNode<N extends TypedObject>(options: Serializable<N>): string {
    const {node, index, isInline} = options

    if (isToolkitList(node)) {
      return renderList(node, index)
    }

    if (isListItemBlock(node)) {
      return renderListItem(node, index)
    }

    if (isToolkitSpan(node)) {
      return renderSpan(node)
    }

    if (isPortableTextBlock(node)) {
      return renderBlock(node, index, isInline)
    }

    if (isToolkitTextNode(node)) {
      return renderText(node)
    }

    return renderCustomBlock(node, index, isInline)
  }

  function renderListItem(
    node: PortableTextListItemBlock<MarkDefinition, PortableTextSpan>,
    index: number
  ): string {
    const tree = serializeBlock({node, index, isInline: false, renderNode})
    const renderer = serializers.listItem
    const handler = typeof renderer === 'function' ? renderer : renderer[node.listItem]
    const listItem = handler || serializers.unknownListItem

    if (listItem === serializers.unknownListItem) {
      const style = node.listItem || 'bullet'
      handleMissingSerializer(unknownListItemStyleWarning(style), {
        type: style,
        nodeType: 'listItemStyle',
      })
    }

    let children = tree.children
    if (node.style && node.style !== 'normal') {
      // Wrap any other style in whatever the block serializer says to use
      const {listItem, ...blockNode} = node
      children = renderNode({node: blockNode, index, isInline: false, renderNode})
    }

    return listItem({value: node, index, isInline: false, renderNode, children})
  }

  function renderList(node: HtmlPortableTextList, index: number): string {
    const children = node.children.map((child, childIndex) =>
      renderNode({
        node: child._key ? child : {...child, _key: `li-${index}-${childIndex}`},
        index: index,
        isInline: false,
        renderNode,
      })
    )

    const serializer = serializers.list
    const handler = typeof serializer === 'function' ? serializer : serializer[node.listItem]
    const list = handler || serializers.unknownList

    if (list === serializers.unknownList) {
      const style = node.listItem || 'bullet'
      handleMissingSerializer(unknownListStyleWarning(style), {nodeType: 'listStyle', type: style})
    }

    return list({value: node, index, isInline: false, renderNode, children: children.join('')})
  }

  function renderSpan(node: ToolkitNestedPortableTextSpan): string {
    const {markDef, markType, markKey} = node
    const span = serializers.marks[markType] || serializers.unknownMark
    const children = node.children.map((child, childIndex) =>
      renderNode({node: child, index: childIndex, isInline: true, renderNode})
    )

    if (span === serializers.unknownMark) {
      handleMissingSerializer(unknownMarkWarning(markType), {nodeType: 'mark', type: markType})
    }

    return span({
      text: spanToPlainText(node),
      value: markDef,
      markType,
      markKey,
      renderNode,
      children: children.join(''),
    })
  }

  function renderBlock(node: PortableTextBlock, index: number, isInline: boolean): string {
    const {_key, ...props} = serializeBlock({node, index, isInline, renderNode})
    const style = props.node.style || 'normal'
    const handler =
      typeof serializers.block === 'function' ? serializers.block : serializers.block[style]
    const block = handler || serializers.unknownBlockStyle

    if (block === serializers.unknownBlockStyle) {
      handleMissingSerializer(unknownBlockStyleWarning(style), {
        nodeType: 'blockStyle',
        type: style,
      })
    }

    return block({...props, value: props.node, renderNode})
  }

  function renderText(node: ToolkitTextNode): string {
    if (node.text === '\n') {
      const hardBreak = serializers.hardBreak
      return hardBreak ? hardBreak() : '\n'
    }

    return escapeHtml(node.text)
  }

  function renderCustomBlock(value: TypedObject, index: number, isInline: boolean): string {
    const node = serializers.types[value._type]

    if (!node) {
      handleMissingSerializer(unknownTypeWarning(value._type), {
        nodeType: 'block',
        type: value._type,
      })
    }

    const serializer = node || serializers.unknownType
    return serializer({
      value,
      isInline,
      index,
      renderNode,
    })
  }

  return renderNode
}

function serializeBlock(options: Serializable<PortableTextBlock>): SerializedBlock {
  const {node, index, isInline, renderNode} = options
  const tree = buildMarksTree(node)
  const children = tree.map((child, i) =>
    renderNode({node: child, isInline: true, index: i, renderNode})
  )

  return {
    _key: node._key || `block-${index}`,
    children: children.join(''),
    index,
    isInline,
    node,
  }
}

function noop() {
  // Intentional noop
}
