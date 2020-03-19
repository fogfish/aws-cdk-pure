//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This file may be modified and distributed under the terms
// of the MIT license.  See the LICENSE file for details.
// https://github.com/fogfish/aws-cdk-pure
//
import { App, Construct, Stack } from '@aws-cdk/core'

//
//
export type IaaC<A> = (parent: Construct) => A

export interface IPure<A> {
  (parent: Construct): A
  effect: (f: (x: A) => void) => IPure<A>
  map: <B>(f: (x: A) => B) => IPure<B>
  flatMap: <B>(f: (x: A) => IaaC<B>) => IPure<B>
}

/**
 * Lifts IaaC type to IPure interface
 */
export function unit<A>(f: IaaC<A>): IPure<A> {
  const pure: IPure<A> = f as IPure<A>

  pure.effect = (eff: (x: A) => void) =>
    unit(
      (scope: any) => {
        const node = f(scope)
        eff(node)
        return node
      }
    )

  pure.map = <B>(fmap: (x: A) => B) => 
    unit((scope: any) => fmap(f(scope)))

  pure.flatMap = <B>(fmap: (x: A) => IaaC<B>) => 
    unit((scope: any) => fmap(f(scope))(scope))

  return pure
}


//
//
type Node<Prop, Type> = new (scope: Construct, id: string, props: Prop) => Type

/**
 * type safe cloud component factory. It takes a class constructor of "cloud component" 
 * as input and returns another function, which builds a type-safe association between 
 * "cloud component" and its property.
 * 
 * @param f "cloud component" class constructor 
 * @param pure purely functional definition of the component
 */
export function iaac<Prop, Type>(f: Node<Prop, Type>): (pure: IaaC<Prop>, name?: string) => IPure<Type> {
  return (pure, name) => unit(
    (scope) => new f(scope, name || pure.name, pure(scope))
  )
}

//
//
type Wrap<Prop, TypeA, TypeB> = new (scope: TypeA, props?: Prop) => TypeB

/**
 * type safe cloud component factory for integrations
 * 
 * @param f "cloud component" class constructor
 * @param pure purely functional definition of the component
 */
export function wrap<Prop, TypeA, TypeB>(f: Wrap<Prop, TypeA, TypeB>): (pure: IaaC<TypeA>) => IPure<TypeB> {
  return (pure) => unit(
    (scope) => new f(pure(scope))
  )
}

//
//
type Include<Prop, Type> = (scope: Construct, id: string, props: Prop) => Type

/**
 * type safe cloud component factory. It takes a fromXXX lookup function of "cloud component"
 * as input and returns another function, which builds a type-safe association between 
 * "cloud component" and its property.
 * 
 * @param f lookup function
 * @param pure purely functional definition of the component
 */
export function include<Prop, Type>(f: Include<Prop, Type>): (pure: IaaC<Prop>, name?: string) => IPure<Type> {
  return (pure, name) => unit(
    (scope) => f(scope, name || pure.name, pure(scope))
  )
}

//
//
type Product<T> = {[K in keyof T]: IaaC<T[K]>}
type Pairs<T> = {[K in keyof T]: T[K]}

export interface IEffect<T extends Pairs<T>> {
  (parent: Construct): T
  effect: (f: (x: T) => void) => IEffect<T>
  flatMap: <B>(f: (x: T) => Product<B>) => IEffect<T & B>
  yield: <K extends keyof T>(k: K) => IPure<T[K]>
}

function effect<T>(f: IaaC<T>): IEffect<T> {
  const pure: IEffect<T> = f as IEffect<T>
  pure.flatMap = <B>(fmap: (x: T) => Product<B>) => 
    effect(
      (scope) => {
        const node = f(scope)
        const object = fmap(node)
        const value = {} as B
        const keys = Reflect.ownKeys(object) as (keyof B)[]
        for (const key of keys) {
          value[key] = object[key](scope)
        }
        return { ...node, ...value }
      }
    )

  pure.effect = (eff: (x: T) => void) => 
    effect(
      (scope) => {
        const node = f(scope)
        eff(node)
        return node
      }
    )

  pure.yield = <K extends keyof T>(k: K) => unit((node) => f(node)[k])
  
  return pure
}

function compose<T extends Pairs<T>>(product: Product<T>): IaaC<Pairs<T>> {
  return (scope) => {
    const value = {} as T
    const keys = Reflect.ownKeys(product) as (keyof T)[]
    for (const key of keys) {
      value[key] = product[key](scope)
    }
    return value
  }
}

/**
 * The effect is a type-class that operates with product of individual `IaaC<T>`. 
 * It implements methods to apply effects to product of "cloud components" and 
 * yields the result back. The effect function operates with pure types `T`. 
 * The effect returns always `IaaC<T>`.
 * 
 * @param resources product of `IaaC<T>` components
 */
export function use<T extends Pairs<T>>(resources: Product<T>): IEffect<T> {
  return effect(compose(resources))
}

/**
 * attaches the pure definition of resource to the stack nodes
 * 
 * @param scope the "parent" context
 * @param iaac purely functional definition of the component
 */
export function join<T>(scope: Construct, fn: IaaC<T>): T {
  const x = fn(scope) as any
  return (typeof x === 'function') ? join(scope, x) : x
}

/**
 * Attaches the pure stack components to the root of CDK application.
 * 
 * @param root the root of an entire CDK application 
 * @param iaac purely functional definition of the stack  
 * @param name optionally the logical of the stack
 */
export function root<T>(scope: App, fn: IaaC<T>, name?: string): App {
  fn(new Stack(scope, name || fn.name))
  return scope
}
