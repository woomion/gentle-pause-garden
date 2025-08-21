
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
    setActiveIndex(currentIndex);
    if (api) {
      api.scrollTo(currentIndex);
    }
  }, [currentIndex, api]);

  const navigateToNext = () => {
    const nextIndex = activeIndex + 1;
    if (nextIndex < itemsLength) {
      if (api) {
        api.scrollTo(nextIndex);
        // Wait for carousel to update before setting activeIndex
        setTimeout(() => {
          setActiveIndex(nextIndex);
        }, 50);
      } else {
        setActiveIndex(nextIndex);
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
