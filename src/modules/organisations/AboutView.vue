<script setup lang="ts">
import { cols } from '@/utils/defaults'
import { backendVersion, frontendVersion } from '@/utils/Socket'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import BackBtn from '@/components/BackBtn.vue'
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row>
        <v-col v-bind="cols.wideLeft.left" class="d-flex flex-column ga-4">
          <h1>{{ $t('about.title') }}</h1>
          <p class="mb-2">{{ $t('about.body1') }}</p>
          <p class="mb-2">{{ $t('about.body2') }}</p>
          <BackBtn />
        </v-col>
        <v-divider vertical />
        <v-col v-bind="cols.wideLeft.right">
          <div class="mb-4">
            <h2>VoteIT</h2>
            <v-list class="my-3" :border="true">
              <v-list-item
                :title="$t('about.website')"
                subtitle="voteit.se"
                append-icon="mdi-home"
                href="https://voteit.se"
                target="_blank"
              />
              <v-list-item
                :title="$t('about.sourceCode')"
                append-icon="mdi-github"
                subtitle="github.com/voteit"
                href="https://github.com/voteit"
                target="_blank"
              />
            </v-list>
          </div>
          <div class="mb-4">
            <h2>Version</h2>
            <v-list class="my-3" :border="true">
              <v-list-item
                append-icon="mdi-source-branch"
                :subtitle="$t('about.operatingSince')"
                title="Generation 4"
              />
              <v-list-item
                append-icon="mdi-monitor-cellphone"
                :subtitle="frontendVersion"
                title="Frontend"
              />
              <v-list-item
                append-icon="mdi-server"
                :subtitle="backendVersion"
                title="Backend"
              />
            </v-list>
          </div>
          <div class="mb-4">
            <h2>{{ $t('about.licenseHeading') }}</h2>
            <v-list class="my-3" :border="true">
              <v-list-item
                lines="three"
                append-icon="mdi-copyleft"
                subtitle="VoteIT is licensed under the GNU Affero General Public License v3.0 or later."
                title="AGPL v3"
              >
                <template #append>
                  <img
                    src="https://img.shields.io/badge/License-AGPL_v3-blue.svg"
                  />
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
