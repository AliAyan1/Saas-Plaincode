"use client";

import Image from "next/image";

type LogoSize = "sm" | "md";

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 52, height: 44 },
  md: { width: 72, height: 54 },
};

export default function Logo({ size = "md" }: { size?: LogoSize }) {
  const { width, height } = sizeMap[size];
  return (
    <span
      className="relative flex shrink-0 overflow-hidden rounded-lg bg-transparent"
      style={{ width, height }}
    >
      <Image
        src="/logo.png"
        alt="Ecommerce Support in One Click"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </span>
  );
}
