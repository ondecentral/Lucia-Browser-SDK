# Changelog

All notable changes to this project will be documented in this file.

## [0.9.7](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.6...v0.9.7) (2025-12-29)

### Miscellaneous

- **deps:** bump eslint-plugin-jest in the eslint group ([1ef0173](https://github.com/ondecentral/Lucia-Browser-SDK/commit/1ef01731a26a5a5b0c50b01218ea20af1ef12b1e))

## [0.9.6](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.5...v0.9.6) (2025-12-27)

### Continuous Integration

- upgrade to Node 24 for npm Trusted Publishing ([08e916c](https://github.com/ondecentral/Lucia-Browser-SDK/commit/08e916c60d1d79ea2c716407d658bfcd6351c615))

## [0.9.5](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.4...v0.9.5) (2025-12-27)

### Bug Fixes

- configure Jest to transform uuid ESM module ([db5c364](https://github.com/ondecentral/Lucia-Browser-SDK/commit/db5c36438bbd3d28093b53c623a07d47abbee742))
- make window.location mockable for jsdom 22+ ([12403ab](https://github.com/ondecentral/Lucia-Browser-SDK/commit/12403abfa12a596343ee84c7c0a873afd6372062))
- transform JS files for uuid ESM compatibility ([e5b9ff3](https://github.com/ondecentral/Lucia-Browser-SDK/commit/e5b9ff3630f78aa9f8aeb7dc43736cfb263c8e6a))
- update Jest config and tests for Node 22 and uuid v13 ([a3cbc3a](https://github.com/ondecentral/Lucia-Browser-SDK/commit/a3cbc3aaf02474fd37027411f33a3871a4daa4ac))

### Miscellaneous

- **ci:** bump actions/checkout from 4 to 6 ([#30](https://github.com/ondecentral/Lucia-Browser-SDK/issues/30)) ([a254183](https://github.com/ondecentral/Lucia-Browser-SDK/commit/a254183e2c4424ea887f0eef4bb1b7507de1930b))
- **ci:** bump actions/setup-node from 4 to 6 ([#29](https://github.com/ondecentral/Lucia-Browser-SDK/issues/29)) ([647c910](https://github.com/ondecentral/Lucia-Browser-SDK/commit/647c910999980d8e43e2f56fa3edd5d4576fb19c))
- **ci:** bump aws-actions/configure-aws-credentials from 4 to 5 ([#31](https://github.com/ondecentral/Lucia-Browser-SDK/issues/31)) ([bbc5e2d](https://github.com/ondecentral/Lucia-Browser-SDK/commit/bbc5e2d9afab04d6c8988eb7373ffebfe0b993d3))
- **deps:** bump release-it from 19.2.1 to 19.2.2 in the release group ([#33](https://github.com/ondecentral/Lucia-Browser-SDK/issues/33)) ([ba8b7f6](https://github.com/ondecentral/Lucia-Browser-SDK/commit/ba8b7f606608484218facf64a5431b5bf899594e))
- **deps:** bump the testing group with 2 updates ([#32](https://github.com/ondecentral/Lucia-Browser-SDK/issues/32)) ([1d7b7b0](https://github.com/ondecentral/Lucia-Browser-SDK/commit/1d7b7b0d3a5d2065d878864144ffd3c40aba2781))
- **deps:** bump uuid from 11.1.0 to 13.0.0 ([#34](https://github.com/ondecentral/Lucia-Browser-SDK/issues/34)) ([931a309](https://github.com/ondecentral/Lucia-Browser-SDK/commit/931a3091ee42020337f15b434729f20b69ad1414))

## [0.9.4](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.3...v0.9.4) (2025-12-26)

### Miscellaneous

- configure Dependabot with grouped updates ([e387143](https://github.com/ondecentral/Lucia-Browser-SDK/commit/e387143913c2b6b3bf7dcbd8b3527b61a03bff98))

## [0.9.3](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.2...v0.9.3) (2025-12-26)

### Miscellaneous

- update husky config to v9 ([211968b](https://github.com/ondecentral/Lucia-Browser-SDK/commit/211968b6a9a73e02d8c7cf0e470f50320d793099))

### Continuous Integration

- publish to npm ([9e68625](https://github.com/ondecentral/Lucia-Browser-SDK/commit/9e68625386189585f4f236f2343459ca0217a447))

## [0.9.2](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.1...v0.9.2) (2025-12-25)

### Bug Fixes

- return promise instead of throwing ([1932e7e](https://github.com/ondecentral/Lucia-Browser-SDK/commit/1932e7e511aefa376b933d56868980d955b1eb39))
- update init ([323f18b](https://github.com/ondecentral/Lucia-Browser-SDK/commit/323f18b74a3ee649d240e91d5793702e8ebedd3b))

### Miscellaneous

- update deps ([cee474c](https://github.com/ondecentral/Lucia-Browser-SDK/commit/cee474c42c338e6e060992ba15140f6f80193ccb))
- update deps, clean up vulnerabilities ([e5bd23e](https://github.com/ondecentral/Lucia-Browser-SDK/commit/e5bd23efddc4144c7dd6e2ee8f3a308e138acff3))
- update dev deps to latest ([a5190db](https://github.com/ondecentral/Lucia-Browser-SDK/commit/a5190db7f154b2fb43d72cad4b307edb8b4766c7))

### Code Refactoring

- remove crypto-js dependency in favor of browser-native crypto digest ([45d538d](https://github.com/ondecentral/Lucia-Browser-SDK/commit/45d538ddf76ba28016f782fcf89fda300c7c77b4))
- update types ([6c97bee](https://github.com/ondecentral/Lucia-Browser-SDK/commit/6c97bee753675dec0273648b3c4e7a3d8531d971))

## [0.9.1](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.9.0...v0.9.1) (2025-12-07)

### Bug Fixes

- prevent saving and sending 'undefined' lid ([e33863c](https://github.com/ondecentral/Lucia-Browser-SDK/commit/e33863c53f12fcb23afc211bcb3ea82eccf02c7c))

### Continuous Integration

- update ci to use oidc ([c697307](https://github.com/ondecentral/Lucia-Browser-SDK/commit/c6973076390e95afde8e9367656c8ffba0ac4456))

## [0.9.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.8.0...v0.9.0) (2025-11-20)

### Features

- add auto-init with api key provided in script tag ([fa358a7](https://github.com/ondecentral/Lucia-Browser-SDK/commit/fa358a77151203d90252bbe00f44a407b97b129d))
- add automated click tracking ([af95407](https://github.com/ondecentral/Lucia-Browser-SDK/commit/af95407d021a4dc464e41fd255a20782d9f235b3))
- use closest to find trackable elements ([aae6ff6](https://github.com/ondecentral/Lucia-Browser-SDK/commit/aae6ff61fd42f447867130921370d22cc10e7761))

### Documentation

- update readme ([160130c](https://github.com/ondecentral/Lucia-Browser-SDK/commit/160130c9f82fc39b520b89360523b25bfba65ada))

### Code Refactoring

- optimize click tracking with closest() and add cleanup ([78cf55f](https://github.com/ondecentral/Lucia-Browser-SDK/commit/78cf55f09ff8fbb2ccb69ea50887ec11366e98d1))

## [0.8.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.7.2...v0.8.0) (2025-11-13)

### Features

- receive session hash from backend ([8fdd41c](https://github.com/ondecentral/Lucia-Browser-SDK/commit/8fdd41cc37f032bacd7c839d9c31b9e81896e023))

### Miscellaneous

- update dependencies and ignore package-lock.json ([bc679bc](https://github.com/ondecentral/Lucia-Browser-SDK/commit/bc679bc69d14db9c49a03a4e497c59bbf46d5a37))
- update release-it ([06561d9](https://github.com/ondecentral/Lucia-Browser-SDK/commit/06561d934379d2ec02a2267a69611eb9da2640c2))

## [0.7.2](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.7.0...v0.7.2) (2025-10-02)

### Bug Fixes

- match version to npm for failing publish ([7ae7f59](https://github.com/ondecentral/Lucia-Browser-SDK/commit/7ae7f597bd7731f505421a1e658e6788dbfdf740))

## [0.7.0](https://github.com/ondecentral/Lucia-Browser-SDK/compare/v0.6.0...v0.7.0) (2025-10-02)

### Features

- add new method for new user events - track acquisition ([b56f910](https://github.com/ondecentral/Lucia-Browser-SDK/commit/b56f9103a532d618808a73ece50e8dd9c9b981bc))

### Bug Fixes

- fix failing test ([b6c08ae](https://github.com/ondecentral/Lucia-Browser-SDK/commit/b6c08aeb7a66fbed1f2f0a91c91281575004f9b6))

### Code Refactoring

- update canvas fingerprinting ([41c1877](https://github.com/ondecentral/Lucia-Browser-SDK/commit/41c18776e8118d5acea1899e11e8ab4adafd467a))

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
