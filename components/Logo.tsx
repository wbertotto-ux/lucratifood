import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const heights = { sm: 42, md: 52, lg: 72 };

export function Logo({ size = "md", href = "/", className }: LogoProps) {
  const img = (
    <Image
      src="/lucratifood-logo.png"
      alt="Lucratifood"
      width={556}
      height={74}
      priority
      style={{ height: heights[size], width: "auto" }}
      className={cn(className)}
    />
  );

  if (!href) return img;
  return <Link href={href}>{img}</Link>;
}
