import type { RouteLocationRaw } from 'vue-router'

/**
 * One entry in the admin sidebar. A `group` renders as a labelled section with
 * `children` beneath it; anything else renders as a single link.
 */
export interface NavItem {
  /** Stable key — also used as the section label for a group. */
  title: string
  /** Material Design Icon name, e.g. `mdi-view-dashboard-outline`. */
  icon?: string
  to?: RouteLocationRaw
  href?: string
  /** Small trailing counter, e.g. a number of pending items. */
  badge?: string | number
  disabled?: boolean
  children?: NavItem[]
}

/** One step in the topbar breadcrumb trail. The last entry is the current page. */
export interface Crumb {
  title: string
  to?: RouteLocationRaw
}
