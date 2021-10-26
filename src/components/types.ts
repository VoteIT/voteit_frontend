import { ComponentPublicInstance } from 'vue'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void,
  focus: () => void,
  clear: () => void
}>

export enum QuillVariant {
  Restricted = 'restricted',
  Full = 'full'
}

export enum QuillFormat {
  // Inline
  BackgroundColor = 'background',
  Bold = 'bold',
  Color = 'color',
  Font = 'font',
  InlineCode = 'code',
  Italic = 'italic',
  Link = 'link',
  Size = 'size',
  Strikethrough = 'strike',
  Script = 'script',
  Underline = 'underline',
  // Block
  BlockQuote = 'blockquote',
  Header = 'header',
  Indent = 'indent',
  List = 'list',
  TextAlignment = 'align',
  TextDirection = 'direction',
  CodeBlock = 'block',
  // Embeds
  Formula = 'formula',
  Image = 'image',
  Video = 'video',
  // Custom
  Mention = 'mention',
}

export interface TagObject {
  id: string | number
  value: string
}

type QuillToolbarGroup = string[] | Record<string, number | string>[] | Record<string, (string | number | false)[]>[]

export interface QuillOptions {
  theme: 'bubble' | 'snow'
  debug?: 'error' | 'warn' | 'log' | 'info' | boolean
  formats?: QuillFormat[]
  modules: {
    toolbar?: string[] | QuillToolbarGroup[] | {
      container: QuillToolbarGroup[],
      handlers: Record<string, () => void>
    }
    keyboard: {
      bindings: {
        tab?: null,
        submit?: {
          key: string
          ctrlKey?: boolean
          handler: () => void
        }
      }
    },
    mention: {
      allowedChars: RegExp
      mentionDenotationChars: string[]
      source?: (searchTerm: string, renderList: (tags: TagObject[]) => void, mentionChar: string) => void
    }
  },
  placeholder?: string
}

export interface Tab {
  name: string
  title: string
}
