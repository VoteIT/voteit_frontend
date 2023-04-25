import { ComponentPublicInstance } from 'vue'
import { ComposerTranslation } from 'vue-i18n'
import { UserContextRoles } from '@/composables/types'

export type EditorComponent = ComponentPublicInstance<{
  setText: (text: string) => void,
  focus: () => void,
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

export enum FieldType {
  Checkbox = 'checkbox',
  CheckboxMultiple = 'checkbox_multiple',
  Duration = 'duration',
  Number = 'number',
  Select = 'select',
  Switch = 'switch',
  Tags = 'tags',
  Text = 'text',
  TextArea = 'textarea',
}

export interface FieldRule<T = string> {
  props?: {
    required?: boolean
    disabled?: boolean
    type?: 'email' | 'password' // TODO More types
    max?: number
    maxlength?: number
    min?: number
    minlength?: number
  }
  clean?: (value: T) => T
  validate?: (value: T) => true | string
}

interface SchemaField<T> {
  default?: T
  label: string
  name: string
  rules?: FieldRule<T>[] // TODO Vuelidate rules?
}

interface CheckboxField extends SchemaField<boolean> {
  type: FieldType.Checkbox
}

interface CheckboxMultipleField extends SchemaField<boolean> {
  type: FieldType.CheckboxMultiple
  options: Record<string | number, string>,
  requiredValues?: string[]
}

// Duration in seconds, hence number
interface DurationField extends SchemaField<number> {
  type: FieldType.Duration
}

interface NumberField extends SchemaField<string> {
  type: FieldType.Number
}

interface SelectField extends SchemaField<string> {
  type: FieldType.Select,
  items: {
    title: string
    value: string | number
  }[]
}

interface SwitchField extends SchemaField<boolean> {
  type: FieldType.Switch
}

interface TextField extends SchemaField<string> {
  type: FieldType.Text
}

interface TextAreaField extends SchemaField<string> {
  type: FieldType.TextArea
}

interface TagsField extends SchemaField<string[]> {
  type: FieldType.Tags
}

export type FormField = CheckboxField | CheckboxMultipleField | DurationField | NumberField | SelectField | SwitchField | TagsField | TextField | TextAreaField
export type FormSchema = FormField[]

export interface RoleMatrixColumn {
  getCount (): number
  getDescription? (t: ComposerTranslation): string
  getTitle (t: ComposerTranslation): string
  getValue (userRoles: UserContextRoles): boolean
  setValue? (user: number, value: boolean): void
  icon: string
  name: string
}
export interface DescribedColumn extends RoleMatrixColumn {
  getDescription (t: ComposerTranslation): string
}
export type ColumnOrRole = RoleMatrixColumn | string

/**
 * Determine if column is a string value representing a role, or a full column description.
 */
export function isColumn (col?: ColumnOrRole): col is RoleMatrixColumn {
  return typeof col === 'object'
}
export function isDescribedColumn (col: RoleMatrixColumn): col is DescribedColumn {
  return typeof col.getDescription === 'function'
}
