/**
 * Premium icon set backed by lucide-react.
 * Re-exported under the project's Icon* names so existing consumers keep working
 * while rendering consistent, high-quality stroke icons.
 */
import {
  Inbox,
  Star,
  Send,
  FileText,
  Archive,
  Trash2,
  Search,
  Sparkles,
  File,
  HelpCircle,
  Settings,
  MoreVertical,
  BookOpen,
  Tag,
  X,
  type LucideProps,
} from "lucide-react";

type IconProps = { className?: string };

export function IconInbox({ className = "h-5 w-5" }: IconProps) {
  return <Inbox className={className} strokeWidth={1.75} />;
}

export function IconStar({ className = "h-5 w-5", filled }: IconProps & { filled?: boolean }) {
  return (
    <Star
      className={className}
      strokeWidth={1.75}
      fill={filled ? "currentColor" : "none"}
    />
  );
}

export function IconSend({ className = "h-5 w-5" }: IconProps) {
  return <Send className={className} strokeWidth={1.75} />;
}

export function IconDraft({ className = "h-5 w-5" }: IconProps) {
  return <FileText className={className} strokeWidth={1.75} />;
}

export function IconArchive({ className = "h-5 w-5" }: IconProps) {
  return <Archive className={className} strokeWidth={1.75} />;
}

export function IconTrash({ className = "h-5 w-5" }: IconProps) {
  return <Trash2 className={className} strokeWidth={1.75} />;
}

export function IconSearch({ className = "h-5 w-5" }: IconProps) {
  return <Search className={className} strokeWidth={1.75} />;
}

export function IconSparkle({ className = "h-4 w-4" }: IconProps) {
  return <Sparkles className={className} strokeWidth={1.75} />;
}

export function IconDocument({ className = "h-4 w-4" }: IconProps) {
  return <File className={className} strokeWidth={1.75} />;
}

export function IconHelp({ className = "h-5 w-5" }: IconProps) {
  return <HelpCircle className={className} strokeWidth={1.75} />;
}

export function IconSettings({ className = "h-5 w-5" }: IconProps) {
  return <Settings className={className} strokeWidth={1.75} />;
}

export function IconMore({ className = "h-5 w-5" }: IconProps) {
  return <MoreVertical className={className} strokeWidth={1.75} />;
}

export function IconBook({ className = "h-4 w-4" }: IconProps) {
  return <BookOpen className={className} strokeWidth={1.75} />;
}

export function IconTag({ className = "h-4 w-4" }: IconProps) {
  return <Tag className={className} strokeWidth={1.75} />;
}

export function IconClose({ className = "h-4 w-4" }: IconProps) {
  return <X className={className} strokeWidth={2} />;
}

export type { LucideProps };
