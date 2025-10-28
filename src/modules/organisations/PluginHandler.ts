import PluginHandler from '@/utils/PluginHandler'

import { IOrganisation } from './types'
import useOrganisation from './useOrganisation'

const { organisation } = useOrganisation()

export interface OrganisationPlugin {
  id: string
  checkActive?: (org: IOrganisation) => boolean
}

export default class OrganisationPluginHandler<
  P extends OrganisationPlugin
> extends PluginHandler<P> {
  public getActivePlugins(filter?: (p: P) => boolean): P[] {
    return this.getPlugins((p) => {
      if (!organisation.value) return false
      return (
        (!p.checkActive || p.checkActive(organisation.value)) &&
        (!filter || filter(p))
      )
    })
  }
}
