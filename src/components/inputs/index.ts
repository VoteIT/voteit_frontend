import checkbox from './CheckboxInput.vue'
import checkboxes from './CheckboxMultipleSelect.vue'
import number from './NumberInput.vue'
import select from './Select.vue'
import text from './TextInput.vue'
import { InputComponent, InputDefaultsComponent, InputType } from './types'

export default {
  checkbox,
  checkboxes,
  email: {
    component: text,
    defaults: { type: 'email' }
  },
  number,
  select,
  text
} as Record<InputType, InputDefaultsComponent | InputComponent>
