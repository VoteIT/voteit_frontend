import { defineStore } from 'pinia'
import { computed, shallowRef, watch } from 'vue'

import { sleep } from '@/utils'
import { socketState } from '@/socket'
import { readyToLoadEvent } from '@/composables/events'
import useContextRoles from '@/composables/useContextRoles' // Import order important!
import { profileType } from '../organisations/contentTypes' // ^
import { IOrganisationUser, OrganisationRole } from '../organisations/types'

import restApi, { isApiError } from '@/utils/restApi'

export default defineStore('auth', () => {
  const alternateUsers = shallowRef<IOrganisationUser[]>([])
  const user = shallowRef<IOrganisationUser | null>()

  const isAnonymous = computed(() => user.value === null)
  const isAuthenticated = computed(() => !!user.value)
  const organizationRoles = useContextRoles<OrganisationRole>('organisation')

  function setAuthenticatedUser(_user: IOrganisationUser) {
    user.value = _user
    organizationRoles.set(
      _user.organisation,
      _user.pk,
      _user.organisation_roles
    )
    fetchAlternateUsers() // Do not await
  }

  async function fetchAlternateUsers() {
    alternateUsers.value = await profileType.api.listAction<
      IOrganisationUser[]
    >('alternate', undefined, { method: 'get' })
  }

  async function fetchAuthenticatedUser(
    tries = 3
  ): Promise<IOrganisationUser | undefined> {
    try {
      const data = await profileType.api.list<IOrganisationUser>()
      setAuthenticatedUser(data)
      return data
    } catch (err) {
      if (!isApiError(err)) throw err
      switch (err.status) {
        case 401:
          user.value = null
          console.warn('Not logged in')
          return
        default:
          if (tries === 0) throw new Error('Unknown authentication error')
          await sleep(1_000)
          return fetchAuthenticatedUser(tries - 1)
      }
    }
  }

  /**
   * Turn number into a pseudo random sort value, based on user pk
   */
  function getUserRandomSortValue(value: number) {
    const userPk = user.value?.pk ?? 0
    let n = userPk * 374761393 + value * 668265263 // Knuth multiplicative hash — maps pk to a stable pseudo-random sort position
    n = (n ^ (n >> 13)) * 1274126177
    return (n ^ (n >> 16)) >>> 0 // ensure unsigned 32-bit
  }

  async function logout() {
    if (!isAuthenticated.value) return
    await profileType.api.listAction('logout')
    user.value = null
    alternateUsers.value = []
  }

  async function switchUser(user: { readonly pk: number }) {
    await profileType.api.action('switch', user.pk)
    location.reload()
  }

  async function updateProfile(
    profile: Partial<
      Pick<IOrganisationUser, 'userid' | 'first_name' | 'last_name' | 'email'>
    >
  ) {
    // Handle errors in calling function
    if (!user.value)
      throw new Error("Unauthenticated user can't update profile")
    user.value = await profileType.api.patch(user.value.pk, profile)
  }

  /** The image field is multipart, so send it as FormData either way. */
  async function setProfileImage(image: Blob | '') {
    if (!user.value)
      throw new Error("Unauthenticated user can't update profile image")
    const formData = new FormData()
    formData.append('image', image)
    user.value = await restApi.patch<IOrganisationUser>(
      `user/${user.value.pk}/`,
      formData
    )
  }

  function uploadProfileImage(image: Blob) {
    return setProfileImage(image)
  }

  function clearProfileImage() {
    return setProfileImage('')
  }

  /**
   * Ready to run loaders?
   */
  watch(
    () => !!user.value && socketState.value,
    (ready) => {
      if (ready) readyToLoadEvent.emit()
    }
  )

  return {
    alternateUsers,
    isAnonymous,
    isAuthenticated,
    user,
    clearProfileImage,
    fetchAlternateUsers,
    fetchAuthenticatedUser,
    getUserRandomSortValue,
    logout,
    switchUser,
    updateProfile,
    uploadProfileImage,
    userImage: computed(
      () => user.value?.image ?? user.value?.img_url ?? undefined
    )
  }
})
