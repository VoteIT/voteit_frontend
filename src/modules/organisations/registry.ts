import PluginHandler from '@/utils/PluginHandler'

import useOrganisation from './useOrganisation'

const { organisation } = useOrganisation()

interface InvitationScope {
  id: string
  icon: string
  transformData?: (data: string) => string
}

class InvitationScopePluginHandler extends PluginHandler<InvitationScope> {
  public getActivePlugins () {
    return this.getPlugins(({ id }) => organisation.value?.scope.includes(id) || false)
  }
}

export const invitationScopes = new InvitationScopePluginHandler()

invitationScopes.register({
  id: 'email',
  icon: 'mdi-email'
})

invitationScopes.register({
  id: 'swedish_ssn',
  icon: 'mdi-card-account-details',
  transformData (ssn) {
    return `${ssn.slice(0, 8)} ••••`
  }
})
