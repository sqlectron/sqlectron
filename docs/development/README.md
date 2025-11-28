# Sqlectron Development

If you are only interested in running the Sqlectron from the source [here is](run-from-source.md) the straight forward way.

After running the application if you are interested in contributing to the code base as well. Please follow these recommendations below:

## Contributing to the code base

Pick [an issue](http://github.com/sqlectron/sqlectron-gui/issues) to fix, or pitch new features. To avoid wasting your time, please ask for feedback on feature suggestions with [an issue](http://github.com/sqlectron/sqlectron-gui/issues/new).

### Making a pull request

Please try to [write great commit messages](http://chris.beams.io/posts/git-commit/).

There are numerous benefits to great commit messages

- They allow Sqlectron users to easily understand the consequences of updating to a newer version
- They help contributors understand what is going on with the codebase, allowing features and fixes to be developed faster
- They save maintainers time when compiling the changelog for a new release

If you're already a few commits in by the time you read this, you can still [change your commit messages](https://help.github.com/articles/changing-a-commit-message/).

Also, before making your pull request, consider if your commits make sense on their own (and potentially should be multiple pull requests) or if they can be squashed down to one commit (with a great message). There are no hard and fast rules about this, but being mindful of your readers greatly help you author good commits.

### Use EditorConfig

To save everyone some time, please use [EditorConfig](http://editorconfig.org), so your editor helps make sure we all use the same encoding, indentation, line endings, etc.

### Style

Sqlectron uses [ESLint](http://eslint.org) to keep consistent style. You probably want to install a plugin for your editor.

The ESLint test will be run before unit tests in the CI environment, your build will fail if it doesn't pass the style check.

```bash
npm run lint
```

### Testing

#### E2E Testing

Start integration test dependencies:

```
./scripts/start-test-integration-deps.sh
```

Running in production mode:

```
npm run compile
DEV_TOOLS=true npm run test:e2e
```

Running in development mode:

```
npm run dev:webpack
npm run test:e2e:dev
```

> Document based on [Sinon's CONTRIBUTING.md](https://github.com/sinonjs/sinon/blob/master/CONTRIBUTING.md).
