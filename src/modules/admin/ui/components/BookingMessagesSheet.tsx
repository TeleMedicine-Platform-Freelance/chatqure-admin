import { useQuery } from '@tanstack/react-query';
import { useService } from '@/app/providers/useDI';
import { ADMIN_SYMBOLS } from '../../di/symbols';
import type { IAdminRepository } from '../../domain/ports/IAdminRepository';
import type { ConsultationMessage } from '../../domain/ports/IAdminRepository';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/shadcn/components/ui/sheet';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { ScrollArea } from '@/shared/ui/shadcn/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface BookingForMessages {
  id: string;
  bookingNumber: string | null;
  clientName: string;
  clientPhoneNumber: string;
  doctorName: string;
  doctorPhoneNumber: string;
  status: string;
}

interface BookingMessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingForMessages | null;
}

function MessageBubble({ msg }: { msg: ConsultationMessage }) {
  const isPatient = msg.senderRole === 'PATIENT';
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 max-w-[85%] rounded-lg px-3 py-2',
        isPatient
          ? 'self-start bg-muted text-foreground'
          : 'self-end bg-primary text-primary-foreground'
      )}
    >
      <span className="text-xs font-medium opacity-90">
        {msg.senderRole === 'PATIENT' ? 'Patient' : msg.senderRole === 'DOCTOR' ? 'Doctor' : 'Admin'}
      </span>
      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
      <span className="text-xs opacity-75">
        {new Date(msg.createdAt).toLocaleString()}
      </span>
    </div>
  );
}

export function BookingMessagesSheet({
  open,
  onOpenChange,
  booking,
}: BookingMessagesSheetProps) {
  const repository = useService<IAdminRepository>(ADMIN_SYMBOLS.IAdminRepository);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['consultation-messages', booking?.id],
    queryFn: () =>
      repository.getConsultationMessages(booking!.id, {
        limit: 500,
        offset: 0,
        order: 'asc',
      }),
    enabled: open && !!booking?.id,
  });

  const messages = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {booking?.bookingNumber ? (
              <span className="font-mono">{booking.bookingNumber}</span>
            ) : (
              'Consultation'
            )}
            {booking?.status && (
              <Badge variant="secondary" className="text-xs">
                {booking.status}
              </Badge>
            )}
          </SheetTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Client:</span> {booking?.clientName}{' '}
              ({booking?.clientPhoneNumber})
            </p>
            <p>
              <span className="font-medium">Doctor:</span> {booking?.doctorName}{' '}
              ({booking?.doctorPhoneNumber})
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading messages...</span>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center flex-1 text-destructive text-sm">
              Failed to load messages.
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages in this consultation yet.
                  </p>
                ) : (
                  messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
                )}
              </div>
            </ScrollArea>
          )}
          {!isLoading && total > 0 && (
            <p className="text-xs text-muted-foreground px-4 pb-2 shrink-0">
              {messages.length} of {total} message{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
