import React, { ReactNode, useCallback, useContext } from 'react';
import { MenuContext } from './Menu';

type ItemProps = {
  label: string;
  secondaryLabel?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  useIconSpace?: boolean;
};

const Item = ({
  label,
  secondaryLabel,
  icon,
  rightIcon,
  onClick,
  onMouseEnter,
  onMouseLeave,
  useIconSpace = false,
}: ItemProps) => {
  const { hideMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    hideMenu();
    onClick?.();
  }, [hideMenu, onClick]);

  return (
    <div
      className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center px-2 text-base leading-[18px] hover:rounded"
      onClick={onClickHandler}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {(icon || useIconSpace) && (
        <div className="flex w-7 flex-shrink-0 items-center justify-center">{icon}</div>
      )}
      <span className="flex-grow">{label}</span>
      {secondaryLabel && (
        <span className="text-muted-foreground flex-shrink-0 [margin-inline-start:0.5rem]">
          {secondaryLabel}
        </span>
      )}
      {rightIcon && <div className="flex-shrink-0 [margin-inline-start:0.5rem]">{rightIcon}</div>}
    </div>
  );
};

export default Item;
