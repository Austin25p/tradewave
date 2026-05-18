import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*']
  },
  {
    files: ['**/*.rules'],
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin
    },
    processor: '@firebase/security-rules/rules',
    rules: {
      ...firebaseRulesPlugin.configs.recommended.rules
    }
  }
];
