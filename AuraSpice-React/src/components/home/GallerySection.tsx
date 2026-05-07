import { useRef, useEffect } from 'react';
import type { GalleryCardData } from '../../types';


const galleryItems: GalleryCardData[] = [
  { image: '/assets/menu/chinese/dimsum.png',              title: 'Handcrafted Dim Sum',  desc: 'Steamed to perfection',         alt: 'Handcrafted Dim Sum' },
  { image: '/assets/menu/north-indian/chicken-biryani.png', title: 'Dum Biryani',          desc: 'Slow-cooked, aromatic layers',  alt: 'Chicken Biryani' },
  { image: '/assets/menu/south-indian/uttapam.png',         title: 'Golden Uttapam',        desc: 'Crispy, loaded with toppings',  alt: 'Uttapam' },
  { image: '/assets/menu/fast-food/pizza.png',              title: 'Loaded Pizza',          desc: 'Hand-tossed, overloaded',       alt: 'Loaded Pizza' },
  { image: '/assets/menu/beverages/cold-coffee.png',        title: 'Cold Coffee',           desc: 'Creamy, frothy, chilled',       alt: 'Cold Coffee' },
  { image: '/assets/menu/chinese/spring-rolls.png',         title: 'Crispy Spring Rolls',   desc: 'Golden fried, crunchy',         alt: 'Spring Rolls' },
];

export function GallerySection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.style.overflowX = 'auto';
    track.style.cursor = 'grab';
    track.style.scrollbarWidth = 'none';

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    };
    const onMouseLeave = () => { isDown = false; track.style.cursor = 'grab'; };
    const onMouseUp = () => { isDown = false; track.style.cursor = 'grab'; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 2;
    };

    let touchStartX = 0;
    let touchScrollLeft = 0;
    const onTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].pageX; touchScrollLeft = track.scrollLeft; };
    const onTouchMove = (e: TouchEvent) => { track.scrollLeft = touchScrollLeft + (touchStartX - e.touches[0].pageX) * 1.5; };

    track.addEventListener('mousedown', onMouseDown);
    track.addEventListener('mouseleave', onMouseLeave);
    track.addEventListener('mouseup', onMouseUp);
    track.addEventListener('mousemove', onMouseMove);
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      track.removeEventListener('mousedown', onMouseDown);
      track.removeEventListener('mouseleave', onMouseLeave);
      track.removeEventListener('mouseup', onMouseUp);
      track.removeEventListener('mousemove', onMouseMove);
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <section className="gallery-section" id="gallery">
      <div className="container" style={{ marginBottom: 60 }}>
        <span className="section-label reveal">Visual Journey</span>
        <h2 className="section-title reveal">From Our Kitchen to Your Table</h2>
        <div className="gold-line reveal" />
      </div>
      <div className="gallery-track" id="gallery-track" ref={trackRef}>
        {galleryItems.map((item) => (
          <div className="gallery-card" key={item.title}>
            <img src={item.image} alt={item.alt} />
            <div className="gallery-card-overlay">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
