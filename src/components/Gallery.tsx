import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

interface GalleryImage {
  src: string;
  thumb?: string;
  alt: string;
}

interface GalleryProps {
  images: GalleryImage[];
}

const Gallery = ({ images }: GalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            aria-label={image.alt}
            className="relative aspect-[4/3] overflow-hidden rounded-lg bg-card border border-border hover:border-primary transition-all duration-300 group"
          >
            <img
              src={image.thumb ?? image.src}
              alt={image.alt}
              width={640}
              height={960}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <Carousel
            opts={{
              startIndex: currentIndex,
              loop: true,
            }}
            className="w-full max-w-6xl"
          >
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="flex items-center justify-center p-4">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="max-h-[80vh] max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-center text-muted-foreground mt-4">
                    {image.alt}
                  </p>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </Carousel>
        </div>
      )}
    </>
  );
};

export default Gallery;
