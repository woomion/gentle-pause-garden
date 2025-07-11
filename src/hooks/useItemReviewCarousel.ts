
import { useState, useEffect } from 'react';
import { CarouselApi } from "@/components/ui/carousel";

export const useItemReviewCarousel = (
  currentIndex: number,
  isOpen: boolean,
  itemsLength: number
) => {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setActiveIndex(selectedIndex);
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(currentIndex);
    }
  }, [isOpen, currentIndex]);

  useEffect(() => {
    if (api && currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      api.scrollTo(currentIndex);
    }
  }, [currentIndex, api, activeIndex]); // Include activeIndex to prevent unnecessary updates

  const navigateToNext = () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < itemsLength) {
      setActiveIndex(nextIndex);
      if (api) {
        api.scrollTo(nextIndex);
      }
      return nextIndex;
    }
    return null;
  };

  return {
    activeIndex,
    setActiveIndex,
    api,
    setApi,
    navigateToNext
  };
};
