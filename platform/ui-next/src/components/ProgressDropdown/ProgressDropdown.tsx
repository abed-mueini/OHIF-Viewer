import React, { ReactNode, useEffect, useCallback, useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ProgressDiscreteBar from './ProgressDiscreteBar';
import ProgressItemDetail from './ProgressItemDetail';
import ProgressItem from './ProgressItem';
import { Icons } from '../Icons';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';
import { useTranslation } from 'react-i18next';

const ProgressDropdown = ({
  options: optionsProps,
  value,
  children,
  dropDownWidth = '170',
  onChange,
}: {
  options: ProgressDropdownOption[];
  value?: string;
  children?: ReactNode;
  onChange?: ({ selectedOption }) => void;
}): JSX.Element => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const element = useRef(null);
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(s => !s);
  const [options, setOptions] = useState(optionsProps);
  const [selectedOption, setSelectedOption] = useState(undefined);

  const selectedOptionIndex = useMemo(
    () => options.findIndex(option => option.value === selectedOption?.value),
    [options, selectedOption]
  );

  const canMoveNext = useMemo(
    () => selectedOptionIndex < options.length - 1,
    [selectedOptionIndex, options]
  );

  const handleOptionSelected = useCallback(
    (newSelectedOption?: ProgressDropdownOption): void => {
      if (newSelectedOption?.value === selectedOption?.value) {
        return;
      }

      setOpen(false);
      setSelectedOption(newSelectedOption);

      if (newSelectedOption) {
        newSelectedOption.activated = true;
        newSelectedOption.onSelect?.();
      }

      if (onChange) {
        onChange({ selectedOption: newSelectedOption });
      }
    },
    [selectedOption, onChange]
  );

  const handleNextButtonClick = useCallback(() => {
    if (canMoveNext) {
      handleOptionSelected(options[selectedOptionIndex + 1]);
    }
  }, [options, selectedOptionIndex, canMoveNext, handleOptionSelected]);

  // Update the options in case the options from props has changed
  useEffect(() => setOptions(optionsProps), [optionsProps]);

  // Updates the selected item based on the value from props
  useEffect(() => {
    if (!value) {
      return;
    }

    const newOption = value ? options.find(option => option.value === value) : undefined;

    handleOptionSelected(newOption);
  }, [value, options, handleOptionSelected]);

  // Listen to any click event outside of the dropdown context to hide the options
  useEffect(() => {
    const handleDocumentClick = e => {
      if (element.current && !element.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);

    if (!open) {
      document.removeEventListener('click', handleDocumentClick);
    }
  }, [open]);

  return (
    <div
      ref={element}
      className="text-foreground relative grow select-none text-[0px]"
    >
      <div>
        <div className="mb-1.5 flex h-[26px]">
          <div
            className="bg-popover border-primary/40 flex grow cursor-pointer rounded border"
            style={{ width: `${dropDownWidth}px` }}
            onClick={toggleOpen}
          >
            <div className="flex grow">
              {selectedOption && <ProgressItemDetail option={selectedOption} />}

              {!selectedOption && (
                <div
                  className="grow text-base leading-6"
                  style={{ marginInlineStart: '0.25rem' }}
                >
                  {children}
                </div>
              )}
            </div>
            <Icons.ChevronDown
              className="text-primary mt-1.5"
              style={{ marginInlineStart: '0.25rem', marginInlineEnd: '0.5rem' }}
            />
          </div>
          <button
            className={classnames('w-[26px] rounded text-base', {
              'bg-primary/60 hover:bg-primary/80': canMoveNext,
              'bg-popover pointer-events-none': !canMoveNext,
            })}
            style={{ marginInlineStart: '0.375rem' }}
          >
            <Icons.ArrowRight
              className={classnames('text-foreground relative h-6 w-6', isRtl && 'rotate-180', {
                'text-foreground': canMoveNext,
                'text-': !canMoveNext,
              })}
              style={{ insetInlineStart: '0.125rem' }}
              onClick={handleNextButtonClick}
            />
          </button>
        </div>
        <div
          className={classnames(
            'absolute top-7 z-10 mt-0.5 origin-top',
            'bg-popover overflow-hidden transition-[max-height] duration-300',
            'border-input/50 rounded border shadow',
            'py-1',
            {
              hidden: !open,
              'max-h-[500px]': open,
            }
          )}
          style={{ insetInlineStart: 0, insetInlineEnd: '2rem' }}
        >
          {options.map((option, index) => (
            <ProgressItem
              key={index}
              option={option}
              onSelect={() => handleOptionSelected(option)}
            />
          ))}
        </div>

        <div>
          <ProgressDiscreteBar options={options} />
        </div>
      </div>
    </div>
  );
};

ProgressDropdown.propTypes = {
  options: PropTypes.arrayOf(ProgressDropdownOptionPropType).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node,
  dropDownWidth: PropTypes.string,
};

export default ProgressDropdown;
