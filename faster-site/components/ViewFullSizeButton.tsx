"use client";

interface ViewFullSizeButtonProps {
  imageUrl: string;
  className?: string;
}

export function ViewFullSizeButton({ imageUrl, className = "" }: ViewFullSizeButtonProps) {
  const handleClick = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <button
      className={`w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors ${className}`}
      onClick={handleClick}
    >
      View Full Size
    </button>
  );
}