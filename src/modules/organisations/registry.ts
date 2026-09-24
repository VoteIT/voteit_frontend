import type { Component, Ref } from 'vue'
import type { ComposerTranslation } from 'vue-i18n'

import PluginHandler from '@/utils/PluginHandler'
import { MeetingInvite } from '../meetingInvites/types'
import OrganisationPluginHandler, {
  type OrganisationPlugin
} from './PluginHandler'
import useOrgStore from './useOrgStore'

interface InvitationScope {
  id: keyof MeetingInvite['user_data']
  icon: string
  transformData?: (data: string) => string
}

class InvitationScopePluginHandler extends PluginHandler<InvitationScope> {
  public getActivePlugins() {
    const { scopes } = useOrgStore()
    return this.getPlugins(({ id }) => scopes.includes(id))
  }
}

export const invitationScopes = new InvitationScopePluginHandler()

invitationScopes.register({
  id: 'email',
  icon: 'mdi-email'
})

invitationScopes.register({
  id: 'member_id',
  icon: 'mdi-badge-account-horizontal'
})

invitationScopes.register({
  id: 'swedish_ssn',
  icon: 'mdi-card-account-details',
  transformData(ssn) {
    return `${ssn.slice(0, 8)} ••••`
  }
})

export interface OrgControlPanelPlugin extends OrganisationPlugin {
  /** Detail view. Without one the panel is only a card in the control panel. */
  component?: Component
  icon: string
  getDescription?(t: ComposerTranslation): string
  getTitle(t: ComposerTranslation): string
  /**
   * Composable, called once in the setup of whatever shows attention - so a
   * panel may start fetching what it needs to know.
   */
  useRequiresAttention?(): Ref<boolean | undefined>
}

export const orgControlPanelPlugins =
  new OrganisationPluginHandler<OrgControlPanelPlugin>()
