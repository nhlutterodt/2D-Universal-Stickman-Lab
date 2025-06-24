/**
 * Inertial animation state machine.
 * @lab-docgen
 */
import { BlendTree } from './blendTree';

export class StateMachine {
  private state: string;
  private readonly states: Map<string, BlendTree>;
  private readonly transitions: Map<string, string>;

  constructor(states: Map<string, BlendTree>, initial: string) {
    this.states = states;
    this.state = initial;
    this.transitions = new Map();
  }

  /**
   * Trigger a transition
   */
  trigger(event: string): void {
    const next = this.transitions.get(this.state + ':' + event);
    if (next && this.states.has(next)) this.state = next;
  }

  /**
   * Evaluate pose at time
   */
  evaluatePose(time: number): Map<string, number> {
    return this.states.get(this.state)?.evaluate(time) ?? new Map();
  }
}
