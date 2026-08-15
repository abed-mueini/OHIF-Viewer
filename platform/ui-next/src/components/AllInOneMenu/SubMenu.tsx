import React, { useCallback, useContext } from 'react';
import { MenuContext, MenuProps } from './Menu';
import { Icons } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
export interface SubMenuProps extends MenuProps {
  itemLabel: string;
  onClick?: () => void;
  itemIcon?: string;
}

const SubMenu = (props: SubMenuProps) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const { showSubMenu } = useContext(MenuContext);

  const onClickHandler = useCallback(() => {
    showSubMenu(props);
    props.onClick?.();
  }, [showSubMenu, props]);

  return (
    <div
      className="hover:bg-accent flex h-8 w-full cursor-pointer items-center px-2 text-base hover:rounded"
      onClick={onClickHandler}
    >
      {props.itemIcon && (
        <div className="flex w-7 flex-shrink-0 items-center justify-center">
          <Icons.ByName name={props.itemIcon}></Icons.ByName>
        </div>
      )}
      <span className="flex-grow">{props.itemLabel}</span>
      <div className="flex-shrink-0 [margin-inline-start:0.5rem]">
        <Icons.ByName
          name="content-next"
          className={isRtl ? 'rotate-180' : undefined}
        />
      </div>
    </div>
  );
};

export default SubMenu;
