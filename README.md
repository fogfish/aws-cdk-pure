# aws-cdk-pure

The library is a toolkit for development of **high-order** and **purely functional** components with [AWS CDK](https://docs.aws.amazon.com/cdk/latest/guide/home.html).

[![Build Status](https://secure.travis-ci.org/fogfish/aws-cdk-pure.svg?branch=master)](http://travis-ci.org/fogfish/aws-cdk-pure)
[![Git Hub](https://img.shields.io/github/last-commit/fogfish/aws-cdk-pure.svg)](http://travis-ci.org/fogfish/aws-cdk-pure)
[![npm](https://img.shields.io/npm/v/aws-cdk-pure?label=aws-cdk-pure)](https://www.npmjs.com/package/aws-cdk-pure) 
[![npm](https://img.shields.io/npm/v/aws-cdk-pure-hoc?label=aws-cdk-pure-hoc)](https://www.npmjs.com/package/aws-cdk-pure-hoc) 


## Inspiration

The purely functional extension to AWS CDK and has been inspired by the following posts
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
