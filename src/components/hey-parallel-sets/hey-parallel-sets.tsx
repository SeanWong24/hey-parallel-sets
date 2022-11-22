import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'hey-parallel-sets',
  styleUrl: 'hey-parallel-sets.css',
  shadow: true,
})
export class HeyParallelSets {

  render() {
    return (
      <Host>
        <slot>Hello World</slot>
      </Host>
    );
  }

}
