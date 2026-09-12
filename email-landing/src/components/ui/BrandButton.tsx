import { Link } from "react-router-dom";
import { brandClasses } from "../../theme/brand";

type Variant = "primary" | "secondary" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: brandClasses.btnPrimary,
  secondary: brandClasses.btnSecondary,
  ghost: brandClasses.btnGhost,
};

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined };

type LinkProps = CommonProps & {
  to: string;
} & Omit<React.ComponentProps<typeof Link>, "className" | "children" | "to">;

export function BrandButton(props: ButtonProps | LinkProps) {
  const { variant = "primary", className = "", children } = props;
  const classes = `${variantClass[variant]} ${className}`.trim();

  if ("to" in props && props.to) {
    const { to, variant: _v, className: _c, children: _ch, ...rest } = props;
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, className: _c, children: _ch, ...rest } = props as ButtonProps;
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
