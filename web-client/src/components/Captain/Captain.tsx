import Image from 'next/image';

import styles from './Captain.module.scss';

type CaptainPose =
  | 'hero'
  | 'welcome'
  | 'thinking'
  | 'thumbsup'
  | 'concerned'
  | 'clipboard';

interface CaptainProps {
  pose: CaptainPose;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  className?: string;
}

const SIZES = { sm: 80, md: 160, lg: 320 };

export default function Captain({
  pose,
  size = 'md',
  alt = 'Captain PolicyPilot',
  className,
}: CaptainProps) {
  const px = SIZES[size];
  return (
    <div className={`${styles.captain} ${styles[size]} ${className ?? ''}`}>
      <Image
        src={`/mascot/captain-${pose}.png`}
        alt={alt}
        width={px}
        height={px}
        priority={pose === 'hero'}
      />
    </div>
  );
}
