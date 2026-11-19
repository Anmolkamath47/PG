import React, { useState, useEffect } from 'react';

// Deterministic vibrant color palettes for letter avatars
const PALETTES = [
  'from-indigo-600 to-blue-600 text-white',
  'from-emerald-600 to-teal-600 text-white',
  'from-violet-600 to-purple-600 text-white',
  'from-rose-600 to-pink-600 text-white',
  'from-amber-600 to-orange-600 text-white',
  'from-cyan-600 to-blue-600 text-white',
  'from-fuchsia-600 to-pink-600 text-white',
  'from-blue-600 to-indigo-700 text-white',
];

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
};

const ROUNDED = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

/**
 * Avatar component that displays user DP image if available,
 * or gracefully falls back to their name's capitalized first letter.
 */
export const Avatar = ({
  src,
  name = 'User',
  size = 'md',
  shape = 'md',
  className = '',
  ring = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  const cleanName = (name || 'User').trim();
  const initial = cleanName.charAt(0).toUpperCase() || 'U';

  // Compute deterministic color based on sum of character codes
  const charCodeSum = cleanName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const palette = PALETTES[charCodeSum % PALETTES.length];

  const sizeClass = SIZES[size] || SIZES.md;
  const roundedClass = ROUNDED[shape] || ROUNDED.md;
  const ringClass = ring ? 'ring-1 ring-black/5 dark:ring-white/10 shadow-xs' : '';

  // If src is a dummy unsplash or placeholder image, ignore it and show initial letter avatar
  const isDummyImage =
    src &&
    (src.includes('images.unsplash.com') ||
      src.includes('unsplash.com') ||
      src.includes('dummy') ||
      src.includes('placeholder'));

  if (src && src.trim() !== '' && !isDummyImage && !imageError) {
    return (
      <img
        src={src}
        alt={cleanName}
        onError={() => setImageError(true)}
        className={`${sizeClass} ${roundedClass} ${ringClass} object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      title={cleanName}
      className={`${sizeClass} ${roundedClass} ${ringClass} bg-gradient-to-tr ${palette} flex items-center justify-center font-extrabold tracking-wider flex-shrink-0 select-none shadow-xs ${className}`}
    >
      {initial}
    </div>
  );
};

export default Avatar;
