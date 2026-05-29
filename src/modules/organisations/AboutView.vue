<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { cols } from '@/utils/defaults'
import { backendVersion, frontendVersion } from '../../utils/Socket'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
const { t } = useI18n()
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row>
        <v-col v-bind="cols.wideLeft.left" class="d-flex flex-column ga-4">
          <header><h1>Om VoteIT</h1></header>
          <p class="mb-2">
            Projektet VoteIT drivs av föreningen VoteIT, som är en ideell icke
            vinstdriven svensk organisation. Föreningen bildades 2011. Projektet
            existerar tack vare att medlemmarna betalar in en årsavgift, som går
            till att underhålla och vidareutveckla projektet.
          </p>
          <p class="mb-2">
            VoteIT hade inte varit möjligt att genomföra utan att använda öppen
            källkod. Tack till alla tusentals personer som bidragit med sin tid
            och sitt kunnande till alla projekt som VoteIT använder!
          </p>
          <v-btn
            prepend-icon="mdi-chevron-left"
            :text="$t('navigation.back')"
            to="/"
          />
        </v-col>
        <v-divider vertical />
        <v-col v-bind="cols.wideLeft.right">
          <div class="mb-4">
            <h2>VoteIT</h2>
            <v-list class="my-3" :border="true">
              <v-list-item
                title="Hemsida och mer information"
                append-icon="mdi-home"
              >
                <a href="https://voteit.se" target="_blank">voteit.se</a>
              </v-list-item>
              <v-list-item
                title="Källkod och buggrapporter"
                append-icon="mdi-source-branch"
              >
                <a href="https://github.com/voteit" target="_blank"
                  >github.com/voteit</a
                >
              </v-list-item>
            </v-list>
          </div>
          <div class="mb-4">
            <h2>Version</h2>
            <v-list class="my-3" :border="true">
              <v-list-item
                title="Generation 4"
                subtitle="I drift sen år 2021"
              />
              <v-list-item
                title="Frontend"
                append-icon="mdi-monitor-cellphone"
                :subtitle="frontendVersion"
              />
              <v-list-item
                title="Backend"
                append-icon="mdi-server"
                :subtitle="backendVersion"
              />
            </v-list>
          </div>
          <div class="mb-4">
            <h2>Licens</h2>

            <v-list class="my-3" :border="true">
              <v-list-item
                title="AGPL v3"
                lines="three"
                subtitle="VoteIT is licensed under the GNU Affero General Public License
                v3.0 or later."
              >
              </v-list-item>
              <v-list-item
                ><img
                  src="https://img.shields.io/badge/License-AGPL_v3-blue.svg"
                />
              </v-list-item>
            </v-list>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
