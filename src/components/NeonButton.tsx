"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type NeonVariant = "primary" | "secondary" | "ghost";

type BaseProps = {
  variant?: NeonVariant;
  neonColor?: string;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const MotionLink = motion(Link);

export function NeonButton({
  variant = "primary",
  neonColor,
  className,
  children,
  ...rest
}: ButtonProps | LinkProps) {
  const color =
    neonColor ||
    (variant === "secondary" ? "#a855f7" : variant === "ghost" ? "#f472b6" : "#22d3ee");
  const classes = `neon-btn neon-btn-${variant} ${className || ""}`;
  const motionProps = {
    whileHover: { scale: 1.05, boxShadow: `0 0 28px ${color}` },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 260, damping: 18 },
    style: { "--neon-color": color, boxShadow: `0 0 15px ${color}` } as React.CSSProperties,
    "data-neon": color,
    "data-cursor": "hover",
    className: classes,
  };

  if ("href" in rest && rest.href) {
    const { href, ...linkProps } = rest as LinkProps;
    return (
      <MotionLink href={href} {...linkProps} {...motionProps}>
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button {...(rest as ButtonProps)} {...motionProps}>
      {children}
    </motion.button>
  );
}
