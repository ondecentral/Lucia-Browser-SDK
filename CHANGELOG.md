# Changelog

All notable changes to this project will be documented in this file.


## [0.7.2](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.7.0...v0.7.2) (2025-10-02)


### Bug Fixes

* match version to npm for failing publish ([7ae7f59](https://github.com/ondecentral/Lucia-Browser-SDK/commit/7ae7f597bd7731f505421a1e658e6788dbfdf740))

## [0.7.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.6.0...v0.7.0) (2025-10-02)


### Features

* add new method for new user events - track acquisition ([b56f910](https://github.com/ondecentral/Lucia-Browser-SDK/commit/b56f9103a532d618808a73ece50e8dd9c9b981bc))


### Bug Fixes

* fix failing test ([b6c08ae](https://github.com/ondecentral/Lucia-Browser-SDK/commit/b6c08aeb7a66fbed1f2f0a91c91281575004f9b6))


### Code Refactoring

* update canvas fingerprinting ([41c1877](https://github.com/ondecentral/Lucia-Browser-SDK/commit/41c18776e8118d5acea1899e11e8ab4adafd467a))

## [0.6.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.5.0...v0.6.0) (2025-05-10)

### Features

- export utility tools ([7014612](https://github.com/ondecentral/Lucia-Browser-SDK/commit/70146126a260e169e6088462f1792dac23fe2fd5))

## [0.5.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.4.0...v0.5.0) (2025-05-10)

### Features

- add queue to make sure init is called first ([27d2258](https://github.com/ondecentral/Lucia-Browser-SDK/commit/27d2258fd7f2671b018a1fd6c7d3b2da32b8478c))
- refactor session to use session storage indefinitely ([05f9a81](https://github.com/ondecentral/Lucia-Browser-SDK/commit/05f9a815d2b2bd411525cf6bc2646848b3c3364e))
- send sdk version info to backend ([d1718f4](https://github.com/ondecentral/Lucia-Browser-SDK/commit/d1718f4040cde9a1f54297562a6ec4c43bc51fd3))
- sort payload by categories ([4fe9126](https://github.com/ondecentral/Lucia-Browser-SDK/commit/4fe91264dbb344692726e734e422b5310f7db0d1))
- use sendBeacon to post data ([9cca238](https://github.com/ondecentral/Lucia-Browser-SDK/commit/9cca2381d304992aa05b25083260b7dcfe85f41c))

### Bug Fixes

- collect only access for storage ([ac31223](https://github.com/ondecentral/Lucia-Browser-SDK/commit/ac3122307f8e379b6dcb26f1f3015456c5303e27))
- fix saving and retrieving session data ([5a7fd74](https://github.com/ondecentral/Lucia-Browser-SDK/commit/5a7fd740da6070c7ff7a8f1c44dc03b880cdccc0))
- fix utm collection ([07a1701](https://github.com/ondecentral/Lucia-Browser-SDK/commit/07a17016c94fb600066c25bcc8116d17fac918f9))
- put back the session structure expected by current backend ([872f3b9](https://github.com/ondecentral/Lucia-Browser-SDK/commit/872f3b97ee78ce559ef8681ca96ac238f132e46d))

### Tests

- add integration tests ([b773c70](https://github.com/ondecentral/Lucia-Browser-SDK/commit/b773c70516bcd6180ca25d0c9b8f7f54f5a0016f))
- add tests ([6846812](https://github.com/ondecentral/Lucia-Browser-SDK/commit/6846812104ec69a343114fc9a9039cb884952d9a))
- add tests for ethereum module ([82eefda](https://github.com/ondecentral/Lucia-Browser-SDK/commit/82eefda876dec4c233f140f185ede65b37ca9f3e))
- add tests for solana module ([c0f94a0](https://github.com/ondecentral/Lucia-Browser-SDK/commit/c0f94a050e1412081e24ff05fc2f2ea046c9621c))
- reduce mocks through spys ([3344a39](https://github.com/ondecentral/Lucia-Browser-SDK/commit/3344a398c28268ef6eca8d947d00ea53ba833cb0))
- tidy up data tools tests ([0e36f1f](https://github.com/ondecentral/Lucia-Browser-SDK/commit/0e36f1f7eec682efde87400d5a06cb41f733412d))

### Code Refactoring

- collect redirect hash explicitly ([a99a40a](https://github.com/ondecentral/Lucia-Browser-SDK/commit/a99a40a7df1526a5d9c5821e877bd339181061f2))
- move agent parsing to backend ([83271c2](https://github.com/ondecentral/Lucia-Browser-SDK/commit/83271c2f7160abb491912c819bf93fcb89b9d572))
- refactor session management ([cc15809](https://github.com/ondecentral/Lucia-Browser-SDK/commit/cc158093579fd2e1a2746d1aa2c327844d51c0f1))
- refactor user data and add more tests for it ([5f82c6a](https://github.com/ondecentral/Lucia-Browser-SDK/commit/5f82c6ac5dbaf3531d807c734a81819184e2685d))
- remove collecting data from analytics events ([a36c8e2](https://github.com/ondecentral/Lucia-Browser-SDK/commit/a36c8e289f60df7fd0fb5c81598d4fcaa6cc3833))

### Miscellaneous

- remove unused udata and add more tests for data collection ([68f0fbb](https://github.com/ondecentral/Lucia-Browser-SDK/commit/68f0fbbc4b35f2f4c55ba8b092f7eed7be9484c5))
- replace logging in wallet utils ([9f4da81](https://github.com/ondecentral/Lucia-Browser-SDK/commit/9f4da81c892c2ebe76cec70e3143cb670114fc3e))

## [0.4.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.3.0...v0.4.0) (2025-04-15)

### Features

- ethereum and solana browser wallet detection ([0117ba4](https://github.com/ondecentral/Lucia-Browser-SDK/commit/0117ba43b2cba4bfd8c78da8f1bcee21ba11695f))
- ethereum and solana browser wallet detection ([ea61012](https://github.com/ondecentral/Lucia-Browser-SDK/commit/ea61012f9892914481b377ef8339c1ccbcd73edb))
- new wallet types and framework for easily adding new wallets ([c99d3a8](https://github.com/ondecentral/Lucia-Browser-SDK/commit/c99d3a875e14980d15cc9f3030194939e29d7026))

## [0.3.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.2.0...v0.3.0) (2025-03-14)

### Features

- add walletName to sendWalletInfo ([50944b0](https://github.com/ondecentral/Lucia-Browser-SDK/commit/50944b0f37d1492b47dbab1bb07b8281edabaf37))

### Documentation

- type of walletName is Metamask | Phantom ([1ca2008](https://github.com/ondecentral/Lucia-Browser-SDK/commit/1ca20088567e51a481e7bbd56cdea73d7cd45091))

## [0.2.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.1.0...v0.2.0) (2025-03-12)

### Features

- collect and send utm params on init ([0fa6e85](https://github.com/ondecentral/Lucia-Browser-SDK/commit/0fa6e85b79f69c2b402bc55f8bf896a5fda4ba54))

## [0.1.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.0.5...v0.1.0) (2025-01-23)

### Features

- add github releases ([86f2638](https://github.com/ondecentral/Lucia-Browser-SDK/commit/86f2638aa48eb66d8b4e8537314569ae25dd0b9d))

## [0.0.5](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.0.4...v0.0.5) (2025-01-23)

### Bug Fixes

- fix changelog generation ([4797697](https://github.com/ondecentral/Lucia-Browser-SDK/commit/47976978ccb3866d510919c974dc73d304786953))
- fix release and publish ([8de68e6](https://github.com/ondecentral/Lucia-Browser-SDK/commit/8de68e6fe5bbef2b3d4e99262dc6f44d55241bc3))

## [0.0.4] - 2024-03-19

### Features

- add alpha release workflow
- add release workflow

### Bug Fixes

- fix typescript error for global object
- fix changelog generation
- fix release workflow

### Code Refactoring

- split release and publish workflows

## [0.0.3] - 2024-03-18

### Features

- initial SDK setup
- add tracking methods
- add user info methods

### Bug Fixes

- fix initialization process
- fix http client base url

## [0.0.2] - 2024-03-17

### Features

- add core SDK functionality
- add basic tracking methods

## [0.0.1] - 2024-03-16

### Features

- initial release
- basic SDK structure
