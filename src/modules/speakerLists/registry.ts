interface ISpeakerAnnotationPlugin {
  checkActive(meeting: number): boolean
  iterAnnotations(
    meeting: number,
    user: number
  ): Iterable<{ icon: string; text: string }>
}

export const speakerAnnotationRegistry = (() => {
  const plugins: ISpeakerAnnotationPlugin[] = []

  function register(plugin: ISpeakerAnnotationPlugin) {
    plugins.push(plugin)
  }

  function getAnnotator(meeting: number) {
    const annotators = plugins.filter((p) => p.checkActive(meeting))
    function* annotate(user: number) {
      for (const p of annotators) yield* p.iterAnnotations(meeting, user)
    }
    return annotate
  }

  return {
    getAnnotator,
    register
  }
})()
