import React, { useState } from 'react';

// Subtle, elegant fallback for failed/missing book covers
const ERROR_IMG_SRC = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:rgb(249,250,251);stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:rgb(243,244,246);stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="600" fill="url(%23grad)"/%3E%3Crect x="60" y="80" width="280" height="440" rx="8" fill="none" stroke="rgb(209,213,219)" stroke-width="2" stroke-dasharray="8,8"/%3E%3Ctext x="200" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="64" fill="rgb(156,163,175)" text-anchor="middle"%3E📖%3C/text%3E%3Ctext x="200" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="rgb(156,163,175)" text-anchor="middle"%3ENo cover available%3C/text%3E%3C/svg%3E';

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  // Detect Finna's blank placeholder images by checking dimensions after load
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Finna placeholders are typically 1x1 transparent gifs, very small images (< 100x100),
    // or standard placeholder sizes (e.g., 1x67, 67x1, etc.)
    if (
      img.naturalWidth <= 1 || 
      img.naturalHeight <= 1 ||
      (img.naturalWidth < 100 && img.naturalHeight < 100) ||
      (img.naturalWidth === 67 || img.naturalHeight === 67)
    ) {
      setDidError(true);
    }
    // Call original onLoad if provided
    if (props.onLoad) {
      props.onLoad(e);
    }
  };

  const { src, alt, style, className, onLoad, ...rest } = props;

  // Show fallback if image failed to load OR is a blank placeholder
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
      onLoad={handleLoad}
    />
  );
}
