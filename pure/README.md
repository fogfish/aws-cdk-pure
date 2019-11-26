# aws-cdk-pure

This is a TypeScript toolkit library for development of purely functional and high-order cloud components with AWS CDK.


## Inspiration

The library is an open-source extension to AWS CDK. It has been inspired by the following posts:
* [Composable Cloud Components with AWS CDK](https://i.am.fog.fish/2019/07/28/composable-cloud-components-with-aws-cdk.html)
* [Purely Functional Cloud Components with AWS CDK](https://i.am.fog.fish/2019/08/23/purely-functional-cloud-with-aws-cdk.html).

`aws-cdk-pure` is an utility for design and development of purely functional and higher-order components. You know React Hooks! Think of it as **hooks for your cloud infrastructure**.


## Getting started

The latest version of the library is available at its `master` branch. All development, including new features and bug fixes, take place on the `master` branch using forking and pull requests as described in contribution guidelines. The latest package release is available at npm

```bash
npm install --save aws-cdk-pure
```

## Key features 

AWS Cloud Development Kit do not implement a pure functional approach. The abstraction of cloud resources is exposed using class hierarchy, each class represents a "cloud component" and encapsulates everything AWS CloudFormation needs to create the component. A shift from category of classes to category of pure functions simplifies the development by **scraping boilerplate**. A pure function component of type `IaaC<T>` is a right approach to express semantic of Infrastructure as a Code. Please check the details about the library design considerations [here](https://i.am.fog.fish/2019/08/23/purely-functional-cloud-with-aws-cdk.html).



### Cloud Formation Stacks and Resources

The library defines a core types `IaaC<T> | IPure<T>`. They express semantic of Infrastructure as a Code.

```typescript
type IaaC<T> = (scope: cdk.Construct) => T
```

Purely functional semantic defines `root` operator. It attaches the pure stack components to the root of CDK application. Then, `join` operator attaches the pure definition of resource to the graph nodes. The logical name of the attached resources is defined by the name of a function.

```typescript
import { root, join, IaaC } from 'aws-cdk-pure'

function RestApi(): cdk.Construct {/* ... */}

function Storage(): cdk.Construct {/* ... */}

function CodeBuildBot(stack: cdk.Construct): cdk.Construct {
  join(stack, RestApi)
  join(stack, Storage)
  return stack
}

const app = new cdk.App()
root(app, CodeBuildBot)
app.synth()
```


### Pure Functional Cloud Resource

The original class-based semantic of AWS CDK defines a common constructor pattern for cloud resources, which takes a scope of the graph, logical name and properties of component.

```typescript
type Node<Prop, Type> = new (scope: Construct, id: string, props: Prop) => Type
```

An overhead exists in class-based approach of resource definition. Firstly, the duplication of logical name - name of function and literal constant. Secondly, we can observe that category of cloud resource is bi-parted graph. The left side is “cloud components”, the right side is they properties (e.g. `Function <-> FunctionProps`). It is possible to infer a type of “cloud components” by type of its property and visa verse using ad-hoc polymorphism.

Purely functional semantic defines `iaac` operator - type safe factory. It takes a class constructor of “cloud component” as input and returns another function, which builds a type-safe association between “cloud component” and its property (see `type Node<Prop, Type>`).

```typescript
import { join, iaac } from 'aws-cdk-pure'

const lambda = iaac(Function)

function WebHook(): FunctionProps {
  return {
    runtime: lambda.Runtime.NODEJS_10_X,
    code: new AssetCode(/* ... */),
    /* ... */
  }
}

join(stack, lambda(WebHook))
```

In addition to `iaac` operator, the library support other type safe factories such as `wrap` and `include`. The `warp` lifts AWS CDK integrations and targets to pure functional domain.

```typescript
import { wrap } from 'aws-cdk-pure'

const integrate = wrap(LambdaIntegration)

const method = integrate(lambda(WebHook))
restapi.root.addResource('test').addMethod('GET', method)
```

The `include` allows to import existing CloudFormation resources to the stack

```typescript
import { include } from 'aws-cdk-pure'

const vpc = include(ec2.Vpc.fromVpcAttributes)

function Vpc(): VpcAttributes {
  return {
    vpcId: /* ... */
  }
}

vpc(Vpc)
```


### Runtime Customization of Cloud Resources

Often, a property of cloud resources needs to be resolved at runtime. You can do it with named closures.

```typescript
function WebHook(code: AssetCode): IaaC<Function> {
  const WebHook = (): FunctionProps => ({
    runtime: lambda.Runtime.NODEJS_10_X,
    code,
    /* ... */
  })
  return lambda(WebHook)
}

join(stack, WebHook(new AssetCode(/* ... */)))
```

Another typical use-case is naming of cloud resources after some runtime variables, e.g. name AWS Gateway API instances after domain name.

```typescript
function ApiGateway(domain: string): IaaC<RestApi> {
  const gateway = iaac(RestApi)
  const Gateway = {[domain]: (): RestApiProps => ({/* ...*/})}

  return gateway(Gateway[domain])
}
```

### Comprehension

The library works with `IaaC<T>` category. There is a challenge to use this type with native AWS CDK API. For example, the code fails to compile - addMethod requires an Integration type but `IaaC<LambdaIntegration>` is provided.

```typescript
const api = restapi(MyApi)
const method  = integration(lambda(MyFunction))

api.root.addResource('test').addMethod('GET', method)
```

Purely functional semantic resolves this using functional abstractions (e.g. functions and monads).
The type `IPure<T>` supertype of `IaaC<T>` implements functions to apply effects on inner type.

```typescript
const lambda: IPure<Function> = iaac(Function)(WebHook)

const result: IPure<Function> = lambda.effect(
  (x: Function): void => /* applies a side effect to inner type */
)

const result: IPure<LambdaIntegration> = lambda.map(
  (x: Function): LambdaIntegration  => /* transforms a type from A to B */
)

const result: IPure<LambdaIntegration> = lambda.flatMap(
  (x: Function): IPure<LambdaIntegration>  => /* transforms a type from A to IaaC<B> */
)

// 
// you solves above problem with flatMap
restapi(MyApi)
  .flatMap(api => 
    integration(lambda(MyFunction)).flatMap(method => {
      api.root.addResource('test').addMethod('GET', method)
      return api
    })
  )
```

Then, the library provides you convenient type-safe approach to deal with product of `IPure<T>` types. The product type is a structure where each member is a `IPure<T>` component (e.g. `{[K in keyof T]: IaaC<T[K]>}`).

```typescript
//
// product of `IPure<T>` component
const api = restapi(MyApi)
const method  = integration(lambda(MyFunction))
const product = { api, method }
```

The library implements a helper function `use` to lift a product of components to `IPure<T>` type where you can use various composers. 

```typescript
use({/* product of IPure<Ts> */})
  .effect((x: {/* product of Ts */}): void => /* applies a side effect to inner type */)
  .flatMap((x: {/* product of Ts */}): {/* product of Tx */} => /* new product of IPure<Ts> */ )
  .yield(name) // yields back a component 

// 
// you solves above problem 
use({ api, method })
  .effect(x => x.api.root.addResource('test').addMethod('GET', x.method))
  .yield('api')
```

### Cross Stack References

Often, it is required to create resource in one stack and pass its reference to another one.

```typescript
const root = new cdk.Stack(/* ... */)
const shared = pure.join(root, MySharedResource())

const other = new cdk.Stack(/* ... */)
pure.join(other, MyResource(shared))
```

## Example

You cloud code will looks like following snippet with this library. 
Check out [aws-pure-cdk-hoc](../hoc) and [serverless code build bot](https://github.com/fogfish/code-build-bot) for example and reference implementations.

```typescript
import { IaaC, root, join, use, iaac, wrap } from 'aws-cdk-pure'

//
// pure Lambda
function WebHook(): lambda.FunctionProps {
  return {
    runtime: lambda.Runtime.NODEJS_10_X,
    code: new lambda.AssetCode(...),
    ...
  }
}

//
// pure API Gateway 
function Gateway(): api.RestApiProps {
  return {
    endpointTypes: [api.EndpointType.REGIONAL],
    ...
  }
}

//
// HoC RestApi
function RestApi(): IaaC<api.RestApi> {
  const restapi = iaac(RestApi)(Gateway)
  const lambda  = iaac(Function)(WebHook)
  const webhook = wrap(LambdaIntegration)(lambda)
  
  return use({ restapi, webhook })
    .effect(x => x.restapi.root.addResource('webhook').addMethod('POST', x.webhook))
    .yield('restapi')
}

//
// pure stack
const app = new cdk.App()
const Stack = (): cdk.StackProps => ({ env: {} })
pure.join(app,
  pure.iaac(cdk.Stack)(Stack).effect(x => pure.join(x, RestApi))
)
app.synth()
```

## Other libraries

You've might head about [Punchcard](https://github.com/sam-goodwin/punchcard) 
> Punchcard adds to the vision by unifying infrastructure code with runtime code, meaning you can both declare resources and implement logic within one node.js application.

This library is not looking for unification of infrastructure and business logic code with this pure functional extension to AWS CDK. Instead, it promotes diversity of runtime of your lambda functions. It just shifts IaaC development paradigm from category of classes to category of pure functions.


## License

[![See LICENSE](https://img.shields.io/github/license/fogfish/aws-cdk-pure.svg?style=for-the-badge)](LICENSE)
