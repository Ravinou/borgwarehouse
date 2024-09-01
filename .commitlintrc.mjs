export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'config',
        'doc',
        'feat',
        'fix',
        'hotfix',
        'i18n',
        'refactor',
        'revert',
        'test',
        'ui',
        'wip',
        'publish',
      ],
    ],
  },
  ignores: [(message) => message.includes('WIP'), (message) => message.includes('wip')],
};
