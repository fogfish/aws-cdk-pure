# aws-cdk-pure-hoc

This is a TypeScript library implements reusable cloud design patterns as purely functional high-order components. Use them as building blocks for your cloud infrastructure.  

## Getting started

The latest version of the library is available at its `master` branch. All development, including new features and bug fixes, take place on the `master` branch using forking and pull requests as described in contribution guidelines. The latest package release is available at npm

```bash
npm install --save aws-cdk-pure-hoc
```

## Design Pattern

The library implements following design patterns

* Configuration Management

## How To Contribute

The library is [MIT](LICENSE) licensed and accepts contributions via GitHub pull requests:

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Added some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

The development requires TypeScript and AWS CDK

```bash
npm install -g typescript ts-node aws-cdk
```

```bash
git clone https://github.com/fogfish/aws-cdk-pure
cd aws-cdk-pure/hoc
npm install
npm run test
npm run lint
npm run build
```

## License

[![See LICENSE](https://img.shields.io/github/license/fogfish/aws-cdk-pure.svg?style=for-the-badge)](LICENSE)
