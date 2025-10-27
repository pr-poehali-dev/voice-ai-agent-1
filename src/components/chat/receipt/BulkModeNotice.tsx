import Icon from '@/components/ui/icon';

interface BulkModeNoticeProps {
  bulkCount: number;
  originalUuid: string;
}

export const BulkModeNotice = ({ bulkCount, originalUuid }: BulkModeNoticeProps) => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded text-sm">
      <div className="flex items-center gap-2 text-blue-400 font-medium">
        <Icon name="Copy" size={16} />
        <span>Массовое создание чеков</span>
      </div>
      <div className="mt-1 text-muted-foreground">
        Будет создано <span className="font-bold text-foreground">{bulkCount}</span> копий чека <span className="font-mono text-xs">{originalUuid}</span>
      </div>
    </div>
  );
};
