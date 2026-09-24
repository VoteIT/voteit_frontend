import ContactInfoTab from './ContactInfoTab.vue'
import OrgRolesPanel from './OrgRolesPanel.vue'
import { orgControlPanelPlugins } from './registry'
import useContactInfo from './useContactInfo'

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
