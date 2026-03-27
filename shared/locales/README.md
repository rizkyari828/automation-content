# Shared Locales

This folder is the single source of truth for web and native UI copy.

## Structure

- `en/*.json`: English dictionaries split by domain
- `id/*.json`: Indonesian dictionaries split by domain

Files are merged in filename order by `scripts/generate-locales.mjs`.

## Naming

- `01-common.json`: shared labels used across platforms
- `11-18-web-*.json`: web-specific sections grouped by page or shell
- `21-native-core.json`: native-specific strings

## Workflow

1. Edit the relevant JSON file in `shared/locales/<locale>/`
2. Run `npm run i18n:generate`
3. Web reads `apps/web-ui/components/i18n/generated-messages.js`
4. Native reads `apps/native-ui/lib/core/localization/generated_app_strings_data.dart`

## Validation

`npm run i18n:generate` now validates locale consistency before writing outputs.

- All locale folders must contain the same JSON files
- Key paths must match between `en` and `id`
- Object and array shapes must stay aligned

If a translation key is missing, the generator fails and prints the exact key path.
