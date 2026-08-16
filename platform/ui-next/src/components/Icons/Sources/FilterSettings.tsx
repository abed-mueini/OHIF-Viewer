import React from 'react';
import type { IconProps } from '../types';

/**
 * Filter/sliders icon used by the mobile study list filter sheet trigger.
 */
export const FilterSettings = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <g
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      transform="translate(3, 4)"
    >
      <path d="M0,2.5 L12,2.5"></path>
      <path d="M15,2.5 L18,2.5"></path>
      <circle
        cx="13.5"
        cy="2.5"
        r="2"
        fill="currentColor"
        stroke="none"
      ></circle>
      <path d="M0,11.5 L4,11.5"></path>
      <path d="M7,11.5 L18,11.5"></path>
      <circle
        cx="5.5"
        cy="11.5"
        r="2"
        fill="currentColor"
        stroke="none"
      ></circle>
    </g>
  </svg>
);

export default FilterSettings;
