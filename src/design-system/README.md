# Дизайн-система Schemka

Основа адмінки: токени, тема Vuetify, глобальні дефолти компонентів і кілька
власних компонентів поверх них. Дві теми — світла й темна — з одного набору
семантичних токенів.

Живий довідник: маршрут **`/design-system`** (він будується прямо з токенів,
тож не може застаріти).

## Одне джерело правди

Значення живуть у TypeScript, у `tokens/`. Звідти вони розходяться у три місця:

```
tokens/palette.ts   ─┐
tokens/semantic.ts  ─┼─► theme/vuetify.ts        → Vuetify (потрібні hex, не var())
tokens/scale.ts     ─┘
        │
        └─ scripts/build-tokens.mjs
                 ├─► styles/tokens.generated.css         → CSS-змінні --ds-*
                 └─► styles/tailwind-theme.generated.css → @theme для Tailwind
```

Тому `<v-btn color="primary">`, `class="bg-primary"` і
`background: var(--ds-primary)` завжди дають один колір.

### Як додати або змінити токен

1. Відредагуй `tokens/palette.ts`, `tokens/semantic.ts` або `tokens/scale.ts`.
2. `npm run tokens:build`
3. Закоміть змінені `*.generated.css` разом із джерелом.

Файли `*.generated.css` руками не редагуються — скрипт їх перезапише.
Семантичні токени типізовані так, що додавши ключ у `light`, TypeScript змусить
додати його і в `dark`.

## Шари каскаду

`styles/index.css` оголошує порядок:

```css
@layer ds-overrides, vuetify, theme, base, components, utilities;
```

- **`ds-overrides`** — єдине місце, де дозволений `!important`. Для
  `!important`-декларацій каскад іде у зворотному порядку шарів, тож саме цей
  шар перемагає `!important`-утиліти Vuetify (наприклад `.rounded-xl`).
- **`vuetify`** — CSS Vuetify цілком. Плагін у `vite.config.ts` працює з
  `styles: 'none'`, тож стилі не інжектяться через JS, а підключаються тут — і
  завдяки цьому будь-яка утиліта Tailwind перебиває стиль компонента **без**
  `!important`.
- **`base`** — елементні стилі (`styles/base.css`).
- **`components`** — `styles/vuetify-bridge.css`: радіуси, шрифти й кольори
  компонентів Vuetify, переведені на токени.
- **`utilities`** — утиліти Tailwind.

Preflight Tailwind навмисно не підключений: Vuetify має власний reset, і два
одночасно конфліктують.

## Використання

### Кнопки

```vue
<v-btn color="primary" variant="flat">Головна дія</v-btn>
<v-btn>Другорядна</v-btn>
<v-btn variant="text">Третинна</v-btn>
<v-btn color="danger" variant="flat">Видалити</v-btn>
```

Решта дефолтів (щільність, `variant`, колір фокуса, поведінка підказок) — у
`theme/defaults.ts`. Звичайна Vuetify-розмітка вже виглядає правильно, тож
обгортки над `<v-btn>` чи `<v-text-field>` не потрібні.

### Кольори у власному CSS

Використовуй семантичні токени, не примітивні рампи:

```css
.card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  color: var(--ds-text-muted);
}
```

У Tailwind ті самі імена: `bg-surface`, `border-border`, `text-fg-muted`.
Токени `text*` у Tailwind названі `fg*`, щоб не було `text-text`.

### Тема

```ts
const { activeTheme, preference, isDark, setPreference, toggle } = useAppTheme()
```

`preference` — вибір користувача (`light` / `dark` / `system`), зберігається у
`localStorage`. `activeTheme` — те, що на екрані зараз. Інлайн-скрипт в
`index.html` фарбує тему до першого кадру, тож перезавантаження в темній темі не
блимає світлим.

## Пастки

- **`rounded` і `elevation` як props Vuetify** генерують `!important`-утиліти,
  які пізніший шар не перебʼє. Радіуси й тіні задавай через
  `vuetify-bridge.css` або `var(--ds-radius-*)` / `var(--ds-shadow-*)`.
- **Напрямлені радіуси** (`rounded-t-xl`, `rounded-be-sm`) лишаються за
  матеріальною шкалою Vuetify — `ds-overrides` покриває лише прості імена.
- **Нові кольори у темі Vuetify** водночас створюють класи `.bg-*` / `.text-*`
  у рантаймі, які тінитимуть однойменну утиліту Tailwind. Додавай у
  `theme/vuetify.ts` лише те, що справді потрібне у пропі `color`.
- `--v-border-opacity` тема тримає на `1`, щоб межі точно збігалися з токеном;
  Vuetify використовує цю ж змінну для «кісток» скелетона, тому їм заданий
  окремий фон у бриджі.

## Структура

```
design-system/
  tokens/        значення (джерело правди)
  styles/        CSS: згенеровані токени, base, bridge, overrides
  theme/         тема Vuetify + глобальні дефолти
  composables/   useAppTheme
  index.ts       публічний вхід: токени, тема + реекспорт компонентів
```

Самі компоненти живуть у `core/components/` — дизайн-система лише реекспортує
їх, щоб застосунок імпортував усе з одного місця (`@/design-system`).

```
core/components/
  index.ts       барель усієї групи
  layout/        AdminShell, AppSidebar, AppTopbar, PageHeader, ThemeToggle
                 + типи Crumb, NavItem
  data/          DataTable, EmptyState, StatusBadge
                 + тип StatusTone
```

### Імпорти

Компоненти та їхні типи доступні з трьох рівнів — обирайте найвужчий, який
читається краще у конкретному місці:

```ts
import { AdminShell, type NavItem } from '@/design-system'          // усе разом
import { AdminShell, type NavItem } from '@/core/components'        // лише компоненти
import { AdminShell, type NavItem } from '@/core/components/layout' // одна група
```

Токени, тема й `useAppTheme` живуть лише в `@/design-system`.
