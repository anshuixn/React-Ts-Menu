import { Link } from 'react-router-dom';
import { DishPill } from './DishPill';
import type { CuisineSectionProps } from '../../types';


export function CuisineSection({ chapter, title, desc, image, alt, reversed, dishes, orderLink }: CuisineSectionProps) {
  return (
    <section className="cuisine-section">
      <div className={`cuisine-split${reversed ? ' reverse' : ''}`}>
        <div
          className={`cuisine-image-wrapper ${reversed ? 'reveal-right' : 'reveal-left'}`}
          data-parallax="0.15"
        >
          <img src={image} alt={alt} />
        </div>
        <div className={`cuisine-info ${reversed ? 'reveal-left' : 'reveal-right'}`}>
          <span className="cuisine-tag">{chapter}</span>
          <h3>{title}</h3>
          <div className="gold-line" />
          <p>{desc}</p>
          <div className="cuisine-dishes">
            {dishes.map((d) => (
              <DishPill key={d.name} {...d} />
            ))}
          </div>
          <Link to={orderLink} className="btn-primary">Order {title.split(' ').slice(-1)[0]}</Link>
        </div>
      </div>
    </section>
  );
}
