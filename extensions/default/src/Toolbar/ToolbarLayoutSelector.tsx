// Updated ToolbarLayoutSelector.tsx
import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CommandsManager } from '@ohif/core';

import { LayoutSelector, useResponsiveLayout } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';

/**
 * US-RSP-204: maximum grid cells allowed per breakpoint. Larger layouts are
 * disabled (not hidden) so the user understands why, and the state never
 * silently changes under them.
 */
const MAX_VIEWPORTS_BY_BREAKPOINT = {
  xs: 1, // phones: single viewport only
  sm: 1, // large phones: single viewport only
  md: 2, // tablets portrait: 1x2
  lg: 4, // tablets landscape / small laptops: up to 2x2
  xl: Infinity,
  '2xl': Infinity,
} as const;

const VIEWPORT_COUNT_BY_PROTOCOL: Record<string, number> = {
  mpr: 3,
  '3d-four-up': 4,
  '3d-main': 3,
  'axial-primary': 1,
  '3d-only': 1,
  '3d-primary': 2,
  'frame-view': 1,
};

function ToolbarLayoutSelectorWithServices({
  commandsManager,
  servicesManager,
  rows = 3,
  columns = 4,
  ...props
}) {
  const { customizationService } = servicesManager.services;
  const { t } = useTranslation('ToolbarLayoutSelector');
  const { breakpoint, isServerRender } = useResponsiveLayout();

  const maxViewports = isServerRender
    ? Infinity
    : (MAX_VIEWPORTS_BY_BREAKPOINT[breakpoint] ?? Infinity);

  // Get the presets from the customization service
  const commonPresets = customizationService?.getCustomization('layoutSelector.commonPresets') || [
    {
      icon: 'layout-single',
      commandOptions: {
        numRows: 1,
        numCols: 1,
      },
    },
    {
      icon: 'layout-side-by-side',
      commandOptions: {
        numRows: 1,
        numCols: 2,
      },
    },
    {
      icon: 'layout-four-up',
      commandOptions: {
        numRows: 2,
        numCols: 2,
      },
    },
    {
      icon: 'layout-three-row',
      commandOptions: {
        numRows: 3,
        numCols: 1,
      },
    },
  ];

  // Get the advanced presets generator from the customization service
  const advancedPresetsGenerator = customizationService?.getCustomization(
    'layoutSelector.advancedPresetGenerator'
  );

  // Generate the advanced presets
  const advancedPresets = advancedPresetsGenerator
    ? advancedPresetsGenerator({ servicesManager })
    : [
        {
          title: 'MPR',
          icon: 'layout-three-col',
          commandOptions: {
            protocolId: 'mpr',
          },
        },
        {
          title: '3D four up',
          icon: 'layout-four-up',
          commandOptions: {
            protocolId: '3d-four-up',
          },
        },
        {
          title: '3D main',
          icon: 'layout-three-row',
          commandOptions: {
            protocolId: '3d-main',
          },
        },
        {
          title: 'Axial Primary',
          icon: 'layout-side-by-side',
          commandOptions: {
            protocolId: 'axial-primary',
          },
        },
        {
          title: '3D only',
          icon: 'layout-single',
          commandOptions: {
            protocolId: '3d-only',
          },
        },
        {
          title: '3D primary',
          icon: 'layout-side-by-side',
          commandOptions: {
            protocolId: '3d-primary',
          },
        },
        {
          title: 'Frame View',
          icon: 'icon-stack',
          commandOptions: {
            protocolId: 'frame-view',
          },
        },
      ];

  // Unified selection handler that dispatches to the appropriate command
  const handleSelectionChange = useCallback(
    (commandOptions, isPreset) => {
      if (isPreset) {
        // Advanced preset selection
        commandsManager.run({
          commandName: 'setHangingProtocol',
          commandOptions,
        });
      } else {
        // Common preset or custom grid selection
        commandsManager.run({
          commandName: 'setViewportGridLayout',
          commandOptions,
        });
      }
    },
    [commandsManager]
  );

  // Presets too large for the current breakpoint are disabled (still visible
  // with a tooltip explaining why) rather than hidden.
  const exceedsMax = (commandOptions: {
    numRows?: number;
    numCols?: number;
    protocolId?: string;
    viewportCount?: number;
  }) => {
    const viewportCount =
      commandOptions.viewportCount ??
      (commandOptions.numRows && commandOptions.numCols
        ? commandOptions.numRows * commandOptions.numCols
        : commandOptions.protocolId
          ? VIEWPORT_COUNT_BY_PROTOCOL[commandOptions.protocolId]
          : undefined);

    return viewportCount !== undefined && viewportCount > maxViewports;
  };

  const disabledCommon = useMemo(
    () => commonPresets.map(preset => exceedsMax(preset.commandOptions)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commonPresets, maxViewports]
  );

  const disabledAdvanced = useMemo(
    () => advancedPresets.map(preset => exceedsMax(preset.commandOptions)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [advancedPresets, maxViewports]
  );

  return (
    <div
      id="Layout"
      data-cy="Layout"
    >
      <LayoutSelector
        onSelectionChange={handleSelectionChange}
        {...props}
      >
        <LayoutSelector.Trigger tooltip={t('Change layout')} />
        <LayoutSelector.Content>
          {/* Left side - Presets */}
          {(commonPresets.length > 0 || advancedPresets.length > 0) && (
            <div className="bg-popover flex flex-col gap-2.5 rounded-lg p-2">
              {commonPresets.length > 0 && (
                <>
                  <LayoutSelector.PresetSection title={t('Common')}>
                    {commonPresets.map((preset, index) => (
                      <LayoutSelector.Preset
                        key={`common-preset-${index}`}
                        icon={preset.icon}
                        commandOptions={preset.commandOptions}
                        disabled={preset.disabled || disabledCommon[index]}
                        isPreset={false}
                      />
                    ))}
                  </LayoutSelector.PresetSection>
                  <LayoutSelector.Divider />
                </>
              )}

              {advancedPresets.length > 0 && (
                <LayoutSelector.PresetSection title={t('Advanced')}>
                  {advancedPresets.map((preset, index) => (
                    <LayoutSelector.Preset
                      key={`advanced-preset-${index}`}
                      title={preset.title}
                      icon={preset.icon}
                      commandOptions={preset.commandOptions}
                      disabled={preset.disabled || disabledAdvanced[index]}
                      isPreset={true}
                    />
                  ))}
                </LayoutSelector.PresetSection>
              )}
            </div>
          )}

          {/* Right Side - Grid Layout */}
          <div className="bg-muted border-background flex flex-col gap-2.5 border-l-2 border-solid p-2">
            <div className="text-muted-foreground text-xs">{t('Custom')}</div>
            <LayoutSelector.GridSelector
              rows={rows}
              columns={columns}
              maxCells={maxViewports}
            />
            <LayoutSelector.HelpText>
              {t('Hover to select')} <br />
              {t('rows and columns')} <br />
              {t('Click to apply')}
            </LayoutSelector.HelpText>
          </div>
        </LayoutSelector.Content>
      </LayoutSelector>
    </div>
  );
}

ToolbarLayoutSelectorWithServices.propTypes = {
  commandsManager: PropTypes.instanceOf(CommandsManager),
  servicesManager: PropTypes.object,
  rows: PropTypes.number,
  columns: PropTypes.number,
};

export default ToolbarLayoutSelectorWithServices;
