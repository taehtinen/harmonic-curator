import Image from "next/image";

import appIcon from "@/app/icon.svg";

type Props = {
  size?: number;
};

export default function Logo({ size = 84 }: Props) {
  return (
    <Image
      src={appIcon}
      alt="Harmonic Curator logo"
      width={size}
      height={size}
      priority
    />
  );
}
