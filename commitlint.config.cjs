module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'perf', 'revert', 'docs', 'style', 'chore', 'refactor', 'test', 'build', 'ci'],
    ],
  },
  ignores: [(commit) => commit.startsWith('[skip ci]')],
};
