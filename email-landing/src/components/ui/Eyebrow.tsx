import { brandClasses } from "../../theme/brand";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "span";
};

export function Eyebrow({ children, className = "", as: Tag = "p" }: Props) {
  return <Tag className={`${brandClasses.eyebrow} ${className}`.trim()}>{children}</Tag>;
}
