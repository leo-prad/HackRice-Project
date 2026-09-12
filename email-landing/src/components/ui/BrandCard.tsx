import { brandClasses } from "../../theme/brand";

type Props = {
  as?: "div" | "article" | "section";
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function BrandCard({
  as: Tag = "div",
  interactive = false,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <Tag
      className={`${brandClasses.card} ${interactive ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-land-accent" : ""} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
