import PluginHandler from '@/utils/PluginHandler'

import { IOrganisation } from './types'
import useOrgStore from './useOrgStore'

export interface OrganisationPlugin {
  id: string
  checkActive?: (org: IOrganisation) => boolean
}

export default class OrganisationPluginHandler<
  P extends OrganisationPlugin
> extends PluginHandler<P> {
  public getActivePlugins(filter?: (p: P) => boolean): P[] {
    const { organisation } = useOrgStore()
    return this.getPlugins((p) => {
      if (!organisation) return false
      return (
        (!p.checkActive || p.checkActive(organisation)) &&
        (!filter || filter(p))
      )
    })
  }
}
