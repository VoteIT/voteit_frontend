import ContactInfoTab from './ContactInfoTab.vue'
import GraphicalProfilePanel from './GraphicalProfilePanel.vue'
import OrgRolesPanel from './OrgRolesPanel.vue'
import TermsOfServicePanel from './TermsOfServicePanel.vue'
import { orgControlPanelPlugins } from './registry'
import useContactInfo from './useContactInfo'
import useTermsOfService from './useTermsOfService'

orgControlPanelPlugins.register({
  id: 'roles',
  component: OrgRolesPanel,
  icon: 'mdi-account-key',
  getDescription(t) {
    return t('organization.rolesDescription')
  },
  getTitle(t) {
    return t('roles')
  }
})

orgControlPanelPlugins.register({
  id: 'contactInfo',
  component: ContactInfoTab,
  icon: 'mdi-card-account-mail',
  getDescription(t) {
    return t('home.contactInfo.description')
  },
  getTitle(t) {
    return t('home.contactInfo.title')
  },
  useRequiresAttention() {
    return useContactInfo(true).requiresCheck
  }
})

orgControlPanelPlugins.register({
  id: 'graphicalProfile',
  component: GraphicalProfilePanel,
  icon: 'mdi-palette',
  getDescription(t) {
    return t('organization.graphicalProfile.description')
  },
  getTitle(t) {
    return t('organization.graphicalProfile.title')
  }
})

orgControlPanelPlugins.register({
  id: 'termsOfService',
  component: TermsOfServicePanel,
  icon: 'mdi-file-sign',
  checkActive() {
    return !!useTermsOfService().hasGlobalTos.value
  },
  getDescription(t) {
    return t('organization.tos.description')
  },
  getTitle(t) {
    return t('organization.tos.title')
  },
  useRequiresAttention() {
    return useTermsOfService(true).needsReview
  }
})
