# aws-cdk-pure

This is a toolkit to develop purely functional and high-order cloud components with [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html). It is an extension to AWS CDK and has been inspired by the following posts
* [Composable Cloud Components with AWS CDK](https://i.am.fog.fish/2019/07/28/composable-cloud-components-with-aws-cdk.html)
* [Purely Functional Cloud Components with AWS CDK](https://i.am.fog.fish/2019/08/23/purely-functional-cloud-with-aws-cdk.html).

`aws-cdk-pure` is an utility for design and development of purely functional and higher-order components. You know React Hooks! Think of it as **hooks for your cloud infrastructure**.

## Getting Started

This repository implements TypeScript libraries for cloud development. Please see its details and guidelines in corresponding README.md files
* [aws-cdk-pure](pure) - a toolkit for purely functional and high-order cloud components development.
* [aws-cdk-pure-hoc](hoc) - implements reusable cloud design patterns as purely functional high-order components. Use them as building blocks for your cloud infrastructure.  

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
cd aws-cdk-pure

## cd either to pure or hoc folder

npm install
npm run test
npm run lint
npm run build
```

## License

[![See LICENSE](https://img.shields.io/github/license/fogfish/aws-cdk-pure.svg?style=for-the-badge)](LICENSE)
