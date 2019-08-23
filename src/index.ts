//
// Copyright (C) 2019 Dmitry Kolesnikov
//
// This pure.ts file may be modified and distributed under the terms
// of the MIT license.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//   
import { App, Construct, Stack } from '@aws-cdk/core'

//
//
export type IaaC<T> = (parent: Construct) => T

//
//
type Node<Prop, Type> = new (scope: Construct, id: string, props: Prop) => Type

/**
 * type safe cloud component factory. It takes a class constructor of "cloud component" 
 * as input and returns another function, which builds a type-safe association between 
 * "cloud component" and its property.
 * 
 * @param f "cloud component" class constructor 
 * @param iaac purely functional definition of the component
 */
export function iaac<Prop, Type>(f: Node<Prop, Type>): (fn: IaaC<Prop>) => IaaC<Type> {
  return (fn) => (scope) => new f(scope, fn.name, fn(scope))
}

//
//
type Wrap<Prop, TypeA, TypeB> = new (scope: TypeA, props?: Prop) => TypeB

/**
 * type safe cloud component factory for integrations
 * 
 * @param f "cloud component" class constructor
 * @param iaac purely functional definition of the component
 */
export function wrap<Prop, TypeA, TypeB>(f: Wrap<Prop, TypeA, TypeB>): (fn: IaaC<TypeA>) => IaaC<TypeB> {
  return (fn) => (scope) => new f(fn(scope))
}

//
//
type Product<T> = {[K in keyof T]: IaaC<T[K]>}
type Pairs<T> = {[K in keyof T]: T[K]}

function _compose<T extends Pairs<T>>(product: Product<T>): IaaC<Pairs<T>> {
  return (scope) => {
    const value = {} as T
    const keys = Reflect.ownKeys(product) as Array<(keyof T)>
    for (const key of keys) {
      value[key] = product[key](scope)
    }
    return value
  }
}

function _effect<O extends Pairs<O>>(eff: (x: O) => void, fn: IaaC<O>): IaaC<O> {
  return (scope) => {
    const node = fn(scope)
    eff(node)
    return node
  }
}

function _yield<T extends Pairs<T>, K extends keyof T>(k: K, c: IaaC<T>): IaaC<T[K]> {
  return (node) => c(node)[k]
}

class Effect<T extends Pairs<T>> {
  private value: IaaC<T>
  constructor(x: IaaC<T>){this.value = x}

  public effect(f: (x:T) => void): Effect<T> {
    return new Effect(_effect(f, this.value))
  }

  public yield<K extends keyof T>(k: K): IaaC<T[K]> {
    return _yield(k, this.value)
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
export function use<T extends Pairs<T>>(resources: Product<T>): Effect<T> {
  return new Effect(_compose(resources))
}

/**
 * flatten the component
 * 
 * @param fn 
 */
export function flat<T>(fn: IaaC<IaaC<T>>): IaaC<T> {
  return (scope) => fn(scope)(scope)
}

/**
 * attaches the pure definition of resource to the stack nodes
 * 
 * @param scope the "parent" context
 * @param iaac purely functional definition of the component
 */
export function join<T>(scope: Construct, fn: IaaC<T>): T {
  return fn(scope)
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
