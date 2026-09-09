import '@/design-system/styles/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { createDesignSystem, installTheme } from '@/design-system'

import App from './App.vue'
import router from './core/router'

const app = createApp(App)
const vuetify = createDesignSystem()

app.use(createPinia())
app.use(router)
app.use(vuetify)

// Must run before mount so the first paint already has the right theme.
installTheme(vuetify.theme)

app.mount('#app')
