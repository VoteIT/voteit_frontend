import { FieldType } from '@/components/types'
import { required } from '@/utils/rules'

export default [
  {
    name: 'confirm',
    type: FieldType.Checkbox,
    label: 'Jag är ok med att mina uppgifter sparas',
    rules: [required]
  },
  {
    name: 'function',
    type: FieldType.Select,
    label: 'Funktion',
    items: [
      { title: 'Deltagar- och användarhantering', value: 'participants' },
      { title: 'Diskussioner', value: 'discussions' },
      { title: 'Förslag', value: 'proposals' },
      { title: 'Omröstningar', value: 'polls' },
      { title: 'Skapa och bygga möte eller dagordning', value: 'agenda' },
      { title: 'Talarlistor', value: 'speaker' },
      { title: 'Annat', value: 'other' }
    ],
    rules: [required]
  },
  {
    name: 'description',
    type: FieldType.TextArea,
    label: 'Beskrivning',
    rules: [required],
    messages: [
      'Beskriv vad du gjorde när felet uppkom, vad du försökte åstadkomma och vad konsekvensen blev.'
    ]
  }
]
