import CheckboxMultipleSelect from './CheckboxMultipleSelect.vue'
import TextInput from './TextInput.vue'
import NumberInput from './NumberInput.vue'
import CheckboxInput from './CheckboxInput.vue'
import { InputComponent, InputDefaultsComponent, InputType } from './types'

export default {
  checkboxes: CheckboxMultipleSelect,
  text: TextInput,
  email: {
    component: TextInput,
    defaults: { type: 'email' }
  },
  number: NumberInput,
  checkbox: CheckboxInput
} as Record<InputType, InputDefaultsComponent | InputComponent>
