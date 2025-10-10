import { ComposerTranslation } from 'vue-i18n'

interface ISpeakerAnnotationPlugin {
  checkActive(meeting: number): boolean
  iterAnnotations(
    meeting: number,
    user: number,
    t: ComposerTranslation
  ): Iterable<{ icon: string; text: string }>
}

export const speakerAnnotationRegistry = (() => {
  const plugins: ISpeakerAnnotationPlugin[] = []

  function register(plugin: ISpeakerAnnotationPlugin) {
    plugins.push(plugin)
  }

  function getAnnotator(meeting: number, t: ComposerTranslation) {
    const annotators = plugins.filter((p) => p.checkActive(meeting))
    function* annotate(user: number) {
      for (const p of annotators) yield* p.iterAnnotations(meeting, user, t)
    }
    return annotate
  }

  return {
    getAnnotator,
    register
  }
})()
