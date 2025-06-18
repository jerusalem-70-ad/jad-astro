declare module "d3-force" {
  export interface Simulation<NodeDatum> {
    tick(iterations?: number): this;
    stop(): this;
    force(name: string, force?: any): this;
    nodes(nodes?: NodeDatum[]): this;
    on(typenames: string, listener?: any): this;
  }

  export function forceSimulation<NodeDatum = any>(
    nodes?: NodeDatum[]
  ): Simulation<NodeDatum>;
  export function forceCollide<NodeDatum = any>(
    radius?: number | ((node: NodeDatum) => number)
  ): any;
  export function forceX<NodeDatum = any>(
    x?: number | ((node: NodeDatum) => number)
  ): any;
  export function forceY<NodeDatum = any>(
    y?: number | ((node: NodeDatum) => number)
  ): any;
}

declare module "d3-array" {
  export function extent<T>(
    array: T[],
    accessor?: (d: T) => number
  ): [number | undefined, number | undefined];
}
