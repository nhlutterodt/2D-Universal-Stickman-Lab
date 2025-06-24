/**
 * BlendTree: hierarchical blend of clips/trees.
 * @lab-docgen
 */
import { Clip } from './clip';

export type BlendNode = Clip | BlendTree;

export class BlendTree {
  readonly children: BlendNode[];
  readonly weights: number[];

  constructor(children: BlendNode[], weights: number[]) {
    this.children = children;
    this.weights = weights;
  }

  /**
   * Evaluate blend at time
   */
  evaluate(time: number): Map<string, number> {
    // For demo: just return first child
    if (this.children.length === 0) return new Map();
    if (this.children[0] instanceof Clip) {
      // @ts-ignore
      return this.children[0].sample('root', time);
    }
    // Real: blend all children by weights
    return new Map();
  }
}
