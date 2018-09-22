import React, { Component } from 'react';

import Colors from '../style/Colors'

class Transition extends Component {
  render() {
    <g ng-if="current_scale > 0.5">
    <g ng-if="!debug.hidden">
    <line x1={transition.from_state.x}
          y1={transition.from_state.y}
          x2={transition.to_state !== null ? transition.to_state.x : scaledX}
          y2={transition.to_state !== null ? transition.to_state.y : scaledY}
          class="debug"></line>
    </g>
    <g ng-if="transition.to_state === null">
    <line x1={transition.from_state.x}
          y1={transition.from_state.y}
          x2={transition.to_state !== null ? transition.to_state.x : scaledX}
          y2={transition.to_state !== null ? transition.to_state.y : scaledY}
          class="transition"></line>
    </g>
    <g ng-if="transition.to_state !== null">
    <g ng-if="transition.to_state !== transition.from_state">
    <g transform={"translate(" + transition.from_state.x + ',' +
                                    transition.from_state.y + ')' +
                          'rotate(' + transition.slope() + ')'}>
    <circle ng-if="!debug.hidden"
            cx={-transition.length()/2}
            cy={-transition.arc_offset2()}
            r="10"
            class="debug" ></circle>
    <path class="transition-selected" ng-if="transition.to_state !== null && transition.selected" d="M0 0 A {{transition.arc_r2()}} {{transition.arc_r2()}} 0 0 0 {{-transition.length()}} 0"></path>
    <path class="transition" ng-if="transition.to_state !== null" d="M0 0 A {{transition.arc_r2()}} {{transition.arc_r2()}} 0 0 0 {{-transition.length()}} 0"></path>
    <line ng-if="!debug.hidden"
          x1={-transition.length()/2}
          y1="0"
          x2={-transition.length()/2}
          y2={-transition.arc_offset2()}
          class="debug"></line>
    <g transform="rotate({{transition.start_arc_angle()}})
                          translate(-{{transition.from_state.size}}, 0)">
    <circle ng-if="!debug.hidden"
            cx="0"
            cy="0"
            r="10"
            class="debug" ></circle>
    </g>
    <rect ng-if="!debug.hidden"
          x={-transition.length()}
          y={-transition.arc_offset2()}
          width={transition.length()}
          height={transition.arc_offset2()}
          class="debug"></rect>
    </g>
    </g>
    </g>

    <g ng-if="transition.to_state !== null">
    <g ng-if="transition.to_state !== transition.from_state">
    <g ng-if="!debug.hidden && current_scale > 0.5">
    <g transform="translate({{transition.to_state.x}},
                                    {{transition.to_state.y}})
                          rotate({{transition.slope()}})
                          translate({{transition.length()/2}}, 0)">
    </g>
    <g transform="translate({{transition.to_state.x}},
                                    {{transition.to_state.y}})
                          rotate({{transition.slope()}})
                          translate({{transition.to_state.size}}, 0)">
    <circle cx="0"
            cy="0"
            r="10"
            class="debug" ></circle>
    </g>
    <g transform="translate({{transition.from_state.x}},
                                    {{transition.from_state.y}})
                          rotate({{transition.slope()}})
                          translate({{-transition.from_state.size}}, 0)">
    <circle cx="0"
            cy="0"
            r="10"
            class="debug" ></circle>
    </g>
    </g>
    </g>
    </g>
    <g ng-if="transition.to_state !== transition.from_state">
    <g ng-if="transition.to_state !== null"  transform="translate({{transition.to_state.x}},
                                                                          {{transition.to_state.y}})
                          rotate({{transition.slope()}})
                          rotate({{-transition.end_arc_angle()}})
                          translate({{transition.to_state.size}}, 0)
                          rotate({{transition.end_arc_angle()}})
                          rotate(180)
                          rotate({{-transition.arc_angle_tan2()}})">
    <line ng-if="!debug.hidden"
          x1="0"
          y1="0"
          x2="-100"
          y2="0"
          class="debug"></line>
    <g transform="translate(-19, -9)">
    <path transform="translate(-2, -3)" d="M0,0 L0,24 L24,12 z" class="arrow-selected {{transition.selected && 'selected' || 'hidden'}"/>
    <path d="M0,0 L0,18 L18,9 z" class="arrow"/>
    </g>
    </g>
    <g ng-if="current_scale > 0.5 && transition.to_state !== null"
       transform="translate({{transition.from_state.x}},
                                    {{transition.from_state.y}})
                          rotate({{transition.slope()}})
                          translate({{-transition.length()/2}}, 0)
                          translate(0, {{-transition.arc_offset2()}})
                          translate(0, -5)
                          rotate({{transition.flip_text_rotate()}})
                          translate(0, {{transition.flip_text_offset()}})
                          ">
    <text class={transition.selected && ! transition.edit_label ? 'selected' : 'hidden'}
          filter="url(#selected)"
          text-anchor="middle"
          x="0"
          y="0"> {transition.label}</text>
    <text text-anchor="middle" x="0" y="0">{transition.label}{transition.edit_label?'_':''}</text>
    </g>
    </g>
   </g>
    );
  }
}

export default Transition;
