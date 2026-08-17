import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Icons, Popover, PopoverContent, PopoverTrigger, useResponsiveLayout } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

const formatWithEllipsis = (str, maxLength) => {
  if (str?.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

function HeaderPatientInfo({ servicesManager, appConfig }: withAppTypes) {
  const { t, i18n } = useTranslation('Header');
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const { matches, isServerRender } = useResponsiveLayout();
  // Viewer keeps 1024px in the tablet contract, so compact patient details
  // remain available as a disclosure until the xl desktop breakpoint.
  const isCompact = !isServerRender && !matches.xl;
  const initialExpandedState =
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE ||
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const [compactOpen, setCompactOpen] = useState(false);
  const { patientInfo, isMixedPatients } = usePatientInfo(servicesManager);

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (!isMixedPatients && appConfig.showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 27);
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);
  const patientLabel = isMixedPatients
    ? t('Multiple Patients')
    : isCompact
      ? formattedPatientName || t('Patient')
      : t('Patient');

  const patientSummary = (
    <>
      {isMixedPatients ? (
        <Icons.MultiplePatients className="text-primary" />
      ) : (
        <Icons.Patient className="text-primary" />
      )}
      <div className="flex min-w-0 flex-col justify-center">
        {expanded && !isCompact ? (
          <>
            <div className="text-foreground self-start text-[13px] font-bold">
              <bdi dir="auto">{formattedPatientName}</bdi>
            </div>
            <div className="text-muted-foreground flex gap-2 text-[11px]">
              <div>
                <bdi dir="auto">{formattedPatientID}</bdi>
              </div>
              <div>
                <bdi dir="auto">{patientInfo.PatientSex}</bdi>
              </div>
              <div>
                <bdi dir="auto">{patientInfo.PatientDOB}</bdi>
              </div>
            </div>
          </>
        ) : (
          <div className="text-primary max-w-[10rem] self-center truncate text-[13px]">
            <bdi dir="auto">{patientLabel}</bdi>
          </div>
        )}
      </div>
      {!isCompact && (
        <Icons.ArrowLeft className={`text-primary ${expanded !== isRtl ? 'rotate-180' : ''}`} />
      )}
    </>
  );

  const patientDetails = (
    <dl
      className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm"
      data-cy="patient-info-details"
    >
      <dt className="text-muted-foreground">{t('Patient')}</dt>
      <dd className="min-w-0 break-words font-medium">
        <bdi dir="auto">{formattedPatientName}</bdi>
      </dd>
      <dt className="text-muted-foreground">{t('Patient ID')}</dt>
      <dd className="min-w-0 break-words">
        <bdi dir="auto">{formattedPatientID}</bdi>
      </dd>
      <dt className="text-muted-foreground">{t('Sex')}</dt>
      <dd>
        <bdi dir="auto">{patientInfo.PatientSex || '-'}</bdi>
      </dd>
      <dt className="text-muted-foreground">{t('Date of birth')}</dt>
      <dd>
        <bdi dir="auto">{patientInfo.PatientDOB || '-'}</bdi>
      </dd>
    </dl>
  );

  if (isCompact) {
    return (
      <Popover
        open={compactOpen}
        onOpenChange={setCompactOpen}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className="hover:bg-muted focus-visible:ring-ring min-h-11 min-w-11 flex items-center justify-center gap-1 rounded-lg px-1 outline-none focus-visible:ring-2"
            data-cy="patient-info"
            aria-label={formattedPatientName || t('Patient')}
            title={formattedPatientName || t('Patient')}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setCompactOpen(open => !open);
              }
            }}
          >
            {patientSummary}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={isRtl ? 'left' : 'right'}
          align="end"
          className="w-72 max-w-[calc(100vw-1.5rem)]"
        >
          {patientDetails}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <button
      type="button"
      className="hover:bg-muted focus-visible:ring-ring flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 outline-none focus-visible:ring-2"
      onClick={handleOnClick}
      data-cy="patient-info"
      aria-expanded={expanded}
      title={formattedPatientName || t('Patient')}
    >
      {patientSummary}
    </button>
  );
}

export default HeaderPatientInfo;
