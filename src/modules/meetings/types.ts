export interface BubbleComponent {
  name: string
}

export interface BubbleInfo {
  component: BubbleComponent
  data: Object
}

export interface BubbleConfig {
  open?: boolean
}

export interface BubbleActivation extends BubbleInfo {
  config: BubbleConfig
}
