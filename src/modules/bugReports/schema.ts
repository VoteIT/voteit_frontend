import { required, selectOptions } from '@/utils/rules'

export default [
  {
    name: 'function',
    type: 'select',
    label: 'Funktion',
    rules: [selectOptions({
      participants: 'Deltagar- och användarhantering',
      discussions: 'Diskussioner',
      proposals: 'Förslag',
      polls: 'Omröstningar',
      agenda: 'Skapa och bygga möte eller dagordning',
      speaker: 'Talarlistor',
      other: 'Annat'
    })]
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Beskrivning',
    rules: [required],
    messages: ['Beskriv vad du gjorde när felet uppkom, vad du försökte åstadkomma och vad konsekvensen blev.']
  }
]
