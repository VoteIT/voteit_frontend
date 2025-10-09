import { ComponentPublicInstance } from 'vue'
import { ComposerTranslation } from 'vue-i18n'
import { UserContextRoles } from '@/composables/types'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void
  focus: () => void
  clear: () => void
}>

export type QuillVariant = 'restricted' | 'full'
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
  Script = 'script', // Subscript / Superscript
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
  Mention = 'mention'
}

export interface TagObject {
  id: string | number
  value: string
}

type QuillToolbarGroup = (
  | string
  | Record<string, number | string>
  | Record<string, (string | number | false)[]>
)[]

export interface QuillOptions {
  bounds: string
  theme: 'bubble' | 'snow'
  debug?: 'error' | 'warn' | 'log' | 'info' | boolean
  formats?: QuillFormat[]
  modules: {
    toolbar?:
      | string[]
      | QuillToolbarGroup[]
      | {
          container: QuillToolbarGroup[]
          handlers: Record<string, () => void>
        }
    mention: {
      allowedChars: RegExp
      mentionDenotationChars: string[]
      source?: (
        searchTerm: string,
        renderList: (tags: TagObject[]) => void,
        mentionChar: string
      ) => void
    }
  }
  placeholder?: string
}

export interface RoleMatrixColumn {
  getCount(): number
  getDescription?(t: ComposerTranslation): string
  getTitle(t: ComposerTranslation): string
  getValue(userRoles: UserContextRoles): boolean
  setValue?(user: number, value: boolean): void
  icon: string
  name: string
}
export interface DescribedColumn extends RoleMatrixColumn {
  getDescription(t: ComposerTranslation): string
}
export type ColumnOrRole = RoleMatrixColumn | string

/**
 * Determine if column is a string value representing a role, or a full column description.
 */
export function isColumn(col?: ColumnOrRole): col is RoleMatrixColumn {
  return typeof col === 'object'
}
export function isDescribedColumn(
  col: RoleMatrixColumn
): col is DescribedColumn {
  return typeof col.getDescription === 'function'
}
