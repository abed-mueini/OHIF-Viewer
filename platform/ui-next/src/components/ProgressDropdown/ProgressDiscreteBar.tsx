import React, { ReactElement } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

const ProgressDiscreteBar = ({ options }: { options: ProgressDropdownOption[] }): ReactElement => {
  return (
    <div className="flex gap-1">
      {options.map((option, i) => (
        <div
          key={i}
          className={classnames(
            'h-1 grow first:[border-end-start-radius:0.125rem] first:[border-start-start-radius:0.125rem] last:[border-end-end-radius:0.125rem] last:[border-start-end-radius:0.125rem]',
            {
              'bg-background': !option.activated && !option.completed,
              'bg-primary/40': option.activated && !option.completed,
              'bg-highlight': option.completed,
            }
          )}
        />
      ))}
    </div>
  );
};

ProgressDiscreteBar.propTypes = {
  options: PropTypes.arrayOf(ProgressDropdownOptionPropType).isRequired,
};

export default ProgressDiscreteBar;
