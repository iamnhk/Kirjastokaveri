import React, { useState } from 'react';

// Beautiful purple/pink gradient fallback for failed images
const ERROR_IMG_SRC = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(147,51,234);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(219,39,119);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23grad)"/%3E%3Ctext x="200" y="280" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle"%3E📚%3C/text%3E%3Ctext x="200" y="340" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.9"%3ENo Cover%3C/text%3E%3Ctext x="200" y="370" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.7"%3EAvailable%3C/text%3E%3C/svg%3E';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, ...rest } = props;

  // Show fallback if image failed to load
  if (didError) {
    return (
      <img 
        src={ERROR_IMG_SRC} 
        alt={alt || "Book cover"} 
        className={className}
        style={style}
        {...rest} 
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      style={style}
      {...rest} 
      onError={handleError}
    />
  );
}
