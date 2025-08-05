import { ReactNode, useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

interface CarouselProps {
  children: ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  itemWidth?: string;
  gap?: string;
}

export default function Carousel({
  children,
  autoPlay = true,
  autoPlayInterval = 3000,
  className,
  itemWidth = '320px',
  gap = '1.5rem'
}: CarouselProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollRef = useRef(0);

  // Duplicate children for infinite scroll effect
  const duplicatedChildren = [...children, ...children];

  // Auto-scroll functionality with infinite loop
  useEffect(() => {
    if (autoPlay && scrollContainerRef.current) {
      intervalRef.current = setInterval(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const itemWidthNum = parseInt(itemWidth);
        const gapNum = parseInt(gap);
        const itemTotalWidth = itemWidthNum + gapNum;
        const originalSetWidth = children.length * itemTotalWidth;
        const scrollStep = 1; // pixels per interval for smooth movement
        
        autoScrollRef.current += scrollStep;
        
        // Reset to beginning when we've scrolled through the first set
        if (autoScrollRef.current >= originalSetWidth) {
          autoScrollRef.current = 0;
          container.scrollLeft = 0;
        } else {
          container.scrollLeft = autoScrollRef.current;
        }
        
        // Update progress based on original set
        setScrollProgress((autoScrollRef.current / originalSetWidth) * 100);
      }, 16); // ~60fps for smooth animation
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, children.length, itemWidth, gap]);





  const handleScroll = () => {
    if (scrollContainerRef.current && !autoPlay) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const progress = (container.scrollLeft / maxScroll) * 100;
      setScrollProgress(progress);
    }
  };

  return (
    <div className={clsx('w-full', className)}>
      {/* Card container with rounded borders */}
      <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {/* Fade gradients - black/shadow effect */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 via-black/30 to-transparent z-10 pointer-events-none" />
      
      {/* Horizontal Scroll Container */}
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide"
        onScroll={handleScroll}
        style={{
          gap: gap,
          paddingLeft: '1rem',
          paddingRight: '1rem',
          scrollBehavior: 'auto' // Remove smooth for manual control
        }}
      >
        {duplicatedChildren.map((child, index) => (
          <div 
            key={index} 
            className="flex-shrink-0"
            style={{
              width: itemWidth,
              minWidth: itemWidth,
              maxWidth: itemWidth,
              height: 'auto'
            }}
          >
            {child}
          </div>
        ))}
      </div>



        {/* Progress Bar */}
        {autoPlay && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-10">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
              style={{
                width: `${scrollProgress}%`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}