import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { Icons } from '../Icons';

/**
 * Sheet — a mobile-first side/bottom panel built on Radix Dialog.
 *
 * Used by the responsive WorkList for the mobile filter panel (US-RSP-103)
 * and the mobile/tablet study preview drawer (US-RSP-104). Renders from the
 * logical inline-end side by default so it mirrors automatically in RTL.
 */

type SheetSide = 'inline-end' | 'inline-start' | 'bottom';

type SheetContextValue = { side: SheetSide };
const SheetContext = React.createContext<SheetContextValue>({ side: 'inline-end' });

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'bg-neutral-dark/55 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 fixed inset-0 z-40 backdrop-blur-[1px]',
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

const sideClasses: Record<SheetSide, string> = {
  'inline-end':
    'inset-y-0 max-h-full h-full border-s data-[state=closed]:duration-300 data-[state=open]:duration-300',
  'inline-start':
    'inset-y-0 max-h-full h-full border-e data-[state=closed]:duration-300 data-[state=open]:duration-300',
  bottom:
    'inset-x-0 bottom-0 max-h-[85vh] rounded-t-lg border-t data-[state=closed]:duration-300 data-[state=open]:duration-300 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
};

/**
 * Direction-aware enter/exit animation classes for the horizontal sides.
 * Physical slide directions must follow the document direction so the sheet
 * always slides in from (and out toward) the logical inline edge it is
 * attached to. Tailwind's `rtl:` variant is still a preview feature, so we
 * resolve the direction in JS instead and emit exactly one class pair.
 */
function horizontalAnimClasses(side: 'inline-end' | 'inline-start', isRtl: boolean) {
  // Which physical edge does the side map to in this direction?
  const physicalEnd = !isRtl; // inline-end → right in LTR, left in RTL
  const fromRight =
    (side === 'inline-end' && physicalEnd) || (side === 'inline-start' && !physicalEnd);
  if (fromRight) {
    return 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right';
  }
  return 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left';
}

const inlineSideStyle: Record<'inline-end' | 'inline-start', React.CSSProperties> = {
  'inline-end': { insetInlineEnd: 0 },
  'inline-start': { insetInlineStart: 0 },
};

type SheetContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  side?: SheetSide;
  /** Accessible name supplied by consumers when no SheetTitle is rendered. */
  'aria-label'?: string;
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = 'inline-end', ...props }, ref) => {
  const { t } = useTranslation('Common');
  const { i18n } = useTranslation();
  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const style =
    side === 'bottom'
      ? props.style
      : { ...props.style, ...inlineSideStyle[side as 'inline-end' | 'inline-start'] };

  const animation =
    side === 'bottom' ? '' : horizontalAnimClasses(side as 'inline-end' | 'inline-start', isRtl);

  return (
    <SheetContext.Provider value={{ side }}>
      <SheetPortal>
        <SheetOverlay />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            'bg-background text-foreground border-border/70 data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-2 shadow-2xl duration-300',
            sideClasses[side],
            animation,
            'w-[min(100vw,26rem)]',
            className
          )}
          {...props}
          style={style}
        >
          {children}
          <DialogPrimitive.Close
            className="ring-offset-background focus:ring-ring text-primary min-h-11 min-w-11 absolute top-3 flex items-center justify-center rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none"
            style={{ insetInlineEnd: '0.75rem' }}
          >
            <Icons.Close className="h-4 w-4" />
            <span className="sr-only">{t('Close')}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </SheetPortal>
    </SheetContext.Provider>
  );
});
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('border-b px-4 py-3', className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-highlight text-base font-medium leading-6', className)}
    {...props}
  />
));
SheetTitle.displayName = 'SheetTitle';

const SheetBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('text-foreground flex min-h-0 flex-1 flex-col overflow-y-auto p-4', className)}
    {...props}
  />
);
SheetBody.displayName = 'SheetBody';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('border-t p-3 sm:justify-end', className)}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
};
