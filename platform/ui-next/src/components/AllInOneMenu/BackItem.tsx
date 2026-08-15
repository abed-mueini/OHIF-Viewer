import React from 'react';

import { Icons } from '@ohif/ui-next';
import DividerItem from './DividerItem';
import { useTranslation } from 'react-i18next';

type BackItemProps = {
  backLabel?: string;
  onBackClick: () => void;
};

const BackItem = ({ backLabel, onBackClick }: BackItemProps) => {
  const { t, i18n } = useTranslation('Common');
  const isRtl = i18n.dir(i18n.language) === 'rtl';

  return (
    <>
      <div
        className="hover:bg-accent flex h-8 w-full flex-shrink-0 cursor-pointer items-center text-base [padding-inline-end:0.5rem] [padding-inline-start:0.25rem] hover:rounded"
        onClick={onBackClick}
      >
        <Icons.ByName
          name="content-prev"
          className={`mx-2 ${isRtl ? 'rotate-180' : ''}`}
        />
        <span>{backLabel || t('Back')}</span>
      </div>
      <DividerItem></DividerItem>
    </>
  );
};

export default BackItem;
