import PluginHandler from '@/utils/PluginHandler'

import useOrganisations from './useOrganisations'

const { organisation } = useOrganisations()

interface InvitationScope {
  id: string
  icon: string
}

class InvitationScopePluginHandler extends PluginHandler<InvitationScope> {
  public getActivePlugins () {
    return [...this.iterPlugins(({ id }) => organisation.value?.scope.includes(id) || false)]
  }
}

export const invitationScopes = new InvitationScopePluginHandler()

invitationScopes.register({
  id: 'email',
  icon: 'mdi-email'
})

invitationScopes.register({
  id: 'swedish_ssn',
  icon: 'mdi-account-card-details'
})
