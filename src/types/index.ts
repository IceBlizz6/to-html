import type {
  ListNestMode,
  ToolkitPortableTextList,
  ToolkitPortableTextListItem,
} from '../toolkit/types'

/**
 * Options for the Portable Text to HTML function
 */
export interface PortableTextOptions {
  /**
   * Serializer functions to use for rendering
   */
  serializers?: Partial<PortableTextHtmlSerializers>

  /**
   * Function to call when encountering unknown unknown types, eg blocks, marks,
   * block style, list styles without an associated serializer function.
   *
   * Will print a warning message to the console by default.
   * Pass `false` to disable.
   */
  onMissingSerializer?: MissingSerializerHandler | false

  /**
   * Determines whether or not lists are nested inside of list items (`html`)
   * or as a direct child of another list (`direct` - for React Native)
   *
   * You rarely (if ever) need/want to customize this
   */
  listNestingMode?: ListNestMode
}

/**
 * Generic type for portable text serializers that takes blocks/inline blocks
 *
 * @template N Node types we expect to be rendering (`PortableTextBlock` should usually be part of this)
 */
export type PortableTextSerializer<N> = (options: PortableTextSerializerOptions<N>) => string

/**
 * Serializer function type for rendering portable text blocks (paragraphs, headings, blockquotes etc)
 */
export type PortableTextBlockSerializer = PortableTextSerializer<PortableTextBlock>

/**
 * Serializer function type for rendering (virtual, not part of the spec) portable text lists
 */
export type PortableTextListSerializer = PortableTextSerializer<HtmlPortableTextList>

/**
 * Serializer function type for rendering portable text list items
 */
export type PortableTextListItemSerializer = PortableTextSerializer<PortableTextListItemBlock>

/**
 * Serializer function type for rendering portable text marks and/or decorators
 *
 * @template M The mark type we expect
 */
export type PortableTextMarkSerializer<M extends TypedObject = any> = (
  options: PortableTextMarkSerializerOptions<M>
) => string

export type PortableTextTypeSerializer<V extends TypedObject = any> = (
  options: PortableTextTypeSerializerOptions<V>
) => string

/**
 * Object defining the different serializer functions to use for rendering various aspects
 * of Portable Text and user-provided types, where only the overrides needs to be provided.
 */
export type PortableTextSerializers = Partial<PortableTextHtmlSerializers>

/**
 * Object definining the different serializer functions to use for rendering various aspects
 * of Portable Text and user-provided types.
 */
export interface PortableTextHtmlSerializers {
  /**
   * Object of serializer functions that renders different types of objects that might appear
   * both as part of the blocks array, or as inline objects _inside_ of a block,
   * alongside text spans.
   *
   * Use the `isInline` property to check whether or not this is an inline object or a block
   *
   * The object has the shape `{typeName: SerializerFn}`, where `typeName` is the value set
   * in individual `_type` attributes.
   */
  types: Record<string, PortableTextTypeSerializer | undefined>

  /**
   * Object of serializer functions that renders different types of marks that might appear in spans.
   *
   * The object has the shape `{markName: SerializerFn}`, where `markName` is the value set
   * in individual `_type` attributes, values being stored in the parent blocks `markDefs`.
   */
  marks: Record<string, PortableTextMarkSerializer | undefined>

  /**
   * Object of serializer functions that renders blocks with different `style` properties.
   *
   * The object has the shape `{styleName: SerializerFn}`, where `styleName` is the value set
   * in individual `style` attributes on blocks.
   *
   * Can also be set to a single serializer function, which would handle block styles of _any_ type.
   */
  block: Record<BlockStyle, PortableTextBlockSerializer | undefined> | PortableTextBlockSerializer

  /**
   * Object of serializer functions used to render lists of different types (bulleted vs numbered,
   * for instance, which by default is `<ul>` and `<ol>`, respectively)
   *
   * There is no actual "list" node type in the Portable Text specification, but a series of
   * list item blocks with the same `level` and `listItem` properties will be grouped into a
   * virtual one inside of this library.
   *
   * Can also be set to a single serializer function, which would handle lists of _any_ type.
   */
  list: Record<ListItemType, PortableTextListSerializer | undefined> | PortableTextListSerializer

  /**
   * Object of serializer functions used to render different list item styles.
   *
   * The object has the shape `{listItemType: SerializerFn}`, where `listItemType` is the value
   * set in individual `listItem` attributes on blocks.
   *
   * Can also be set to a single serializer function, which would handle list items of _any_ type.
   */
  listItem:
    | Record<ListItemType, PortableTextListItemSerializer | undefined>
    | PortableTextListItemSerializer

  /**
   * Serializer to use for rendering "hard breaks", eg `\n` inside of text spans
   * Will by default render a `<br />`. Pass `false` to render as-is (`\n`)
   */
  hardBreak: (() => string) | false

  /**
   * Serializer function used when encountering a mark type there is no registered serializer for
   * in the `serializers.marks` prop.
   */
  unknownMark: PortableTextMarkSerializer

  /**
   * Serializer function used when encountering an object type there is no registered serializer for
   * in the `serializers.types` prop.
   */
  unknownType: PortableTextSerializer<UnknownNodeType>

  /**
   * Serializer function used when encountering a block style there is no registered serializer for
   * in the `serializers.block` prop. Only used if `serializers.block` is an object.
   */
  unknownBlockStyle: PortableTextSerializer<PortableTextBlock>

  /**
   * Serializer function used when encountering a list style there is no registered serializer for
   * in the `serializers.list` prop. Only used if `serializers.list` is an object.
   */
  unknownList: PortableTextSerializer<HtmlPortableTextList>

  /**
   * Serializer function used when encountering a list item style there is no registered serializer for
   * in the `serializers.listItem` prop. Only used if `serializers.listItem` is an object.
   */
  unknownListItem: PortableTextSerializer<PortableTextListItemBlock>
}

/**
 * Options received by most Portable Text serializers
 *
 * @template T Type of data this serializer will receive in its `value` property
 */
export interface PortableTextSerializerOptions<T> {
  /**
   * Data associated with this portable text node, eg the raw JSON value of a block/type
   */
  value: T

  /**
   * Index within its parent
   */
  index: number

  /**
   * Whether or not this node is "inline" - ie as a child of a text block,
   * alongside text spans, or a block in and of itself.
   */
  isInline: boolean

  /**
   * Serialized HTML of child nodes of this block/type
   */
  children?: string

  /**
   * Function used to render any node that might appear in a portable text array or block,
   * including virtual "toolkit"-nodes like lists and nested spans. You will rarely need
   * to use this.
   */
  renderNode: NodeRenderer
}

/**
 * Options received by any user-defined type in the input array that is not a text block
 *
 * @template T Type of data this serializer will receive in its `value` property
 */
export type PortableTextTypeSerializerOptions<T> = Omit<
  PortableTextSerializerOptions<T>,
  'children'
>

/**
 * Options received by Portable Text mark serializers
 *
 * @template M Shape describing the data associated with this mark, if it is an annotation
 */
export interface PortableTextMarkSerializerOptions<M extends TypedObject = ArbitraryTypedObject> {
  /**
   * Mark definition, eg the actual data of the annotation. If the mark is a simple decorator, this will be `undefined`
   */
  value?: M

  /**
   * Text content of this mark
   */
  text: string

  /**
   * Key for this mark. The same key can be used amongst multiple text spans within the same block, so don't rely on this to be unique.
   */
  markKey?: string

  /**
   * Type of mark - ie value of `_type` in the case of annotations, or the name of the decorator otherwise - eg `em`, `italic`.
   */
  markType: string

  /**
   * Serialized HTML of child nodes of this mark
   */
  children: string

  /**
   * Function used to render any node that might appear in a portable text array or block,
   * including virtual "toolkit"-nodes like lists and nested spans. You will rarely need
   * to use this.
   */
  renderNode: NodeRenderer
}

/**
 * Any node type that we can't identify - eg it has an `_type`,
 * but we don't know anything about its other properties
 */
export type UnknownNodeType = {[key: string]: unknown; _type: string} | TypedObject

/**
 * A set of _common_ (but not required/standarized) block styles
 */
export type BlockStyle = 'normal' | 'blockquote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | string

/**
 * A set of _common_ (but not required/standardized) list item types
 */
export type ListItemType = 'bullet' | 'number' | string

/**
 * A Portable Text Block can be thought of as one paragraph, quote or list item.
 * In other words, it is a container for text, that can have a visual style associated with it.
 * The actual text value is stored in portable text spans inside of the `childen` array.
 *
 * @template M Mark types that be used for text spans
 * @template C Types allowed as children of this block
 */
export interface PortableTextBlock<
  M extends MarkDefinition = MarkDefinition,
  C extends TypedObject = ArbitraryTypedObject | PortableTextSpan
> extends TypedObject {
  /**
   * Type name identifying this as a portable text block.
   * All items within a portable text array should have a `_type` property.
   *
   * Usually 'block', but can be customized to other values
   */
  _type: 'block' | string

  /**
   * A key that identifies this block uniquely within the parent array. Used to more easily address
   * the block when editing collaboratively, but can also prove useful in other scenarios.
   */
  _key?: string

  /**
   * Array of inline items for this block. Usually contain text spans, but can be
   * configured to include inline objects of other types as well.
   */
  children: C[]

  /**
   * Array of mark definitions used in child text spans. By having them be on the block level,
   * the same mark definition can be reused for multiple text spans, which is often the case
   * with nested marks.
   */
  markDefs?: M[]

  /**
   * Visual style of the block
   * Common values: 'normal', 'blockquote', 'h1'...'h6'
   */
  style?: BlockStyle

  /**
   * If this block is a list item, identifies which style of list item this is
   * Common values: 'bullet', 'number', but can be configured
   */
  listItem?: ListItemType

  /**
   * If this block is a list item, identifies which level of nesting it belongs within
   */
  level?: number
}

/**
 * Strictly speaking the same as a portable text block, but `listItem` is required
 */
export interface PortableTextListItemBlock<
  M extends MarkDefinition = MarkDefinition,
  C extends TypedObject = PortableTextSpan
> extends Omit<PortableTextBlock<M, C>, 'listItem'> {
  listItem: string
}

/**
 * A Portable Text Span holds a chunk of the actual text value of a Portable Text Block
 */
export interface PortableTextSpan {
  /**
   * Type is always `span` for portable text spans, as these don't vary in shape
   */
  _type: 'span'

  /**
   * Unique (within parent block) key for this portable text span
   */
  _key?: string

  /**
   * The actual text value of this text span
   */
  text: string

  /**
   * An array of marks this text span is annotated with, identified by its `_key`.
   * If the key cannot be found in the parent blocks mark definition, the mark is assumed to be a
   * decorator (a simpler mark without any properties - for instance `strong` or `em`)
   */
  marks?: string[]
}

/**
 * A mark definition holds information for marked text. For instance, a text span could reference
 * a mark definition for a hyperlink, a geoposition, a reference to a document or anything that is
 * representable as a JSON object.
 */
export interface MarkDefinition {
  /**
   * Unknown properties
   */
  [key: string]: unknown

  /**
   * Identifies the type of mark this is, and is used to pick the correct serializer functions to use
   * when rendering a text span marked with this mark type.
   */
  _type: string

  /**
   * Uniquely identifies this mark definition within the block
   */
  _key: string
}

/**
 * Any object with an `_type` property (which is required in portable text arrays),
 * as well as a _potential_ `_key` (highly encouraged)
 */
export interface TypedObject {
  /**
   * Identifies the type of object/span this is, and is used to pick the correct serializer functions
   * to use when rendering a span or inline object with this type.
   */
  _type: string

  /**
   * Uniquely identifies this object within its parent block.
   * Not _required_, but highly encouraged.
   */
  _key?: string
}

export type ArbitraryTypedObject = TypedObject & {[key: string]: any}

/**
 * Function that renders any node that might appear in a portable text array or block,
 * including virtual "toolkit"-nodes like lists and nested spans
 */
export type NodeRenderer = <T extends TypedObject>(options: Serializable<T>) => string

export type NodeType = 'block' | 'mark' | 'blockStyle' | 'listStyle' | 'listItemStyle'

export type MissingSerializerHandler = (
  message: string,
  options: {type: string; nodeType: NodeType}
) => void

export interface Serializable<T> {
  node: T
  index: number
  isInline: boolean
  renderNode: NodeRenderer
}

// Re-exporting these as we don't want to refer to "toolkit" outside of this module

/**
 * A virtual "list" node for Portable Text - not strictly part of Portable Text,
 * but generated by this library to ease the rendering of lists in HTML etc
 */
export type HtmlPortableTextList = ToolkitPortableTextList

/**
 * A virtual "list item" node for Portable Text - not strictly any different from a
 * regular Portable Text Block, but we can guarantee that it has a `listItem` property.
 */
export type HtmlPortableTextListItem = ToolkitPortableTextListItem
