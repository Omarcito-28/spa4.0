import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { apiGetReviews } from '../services/api';
import StarRating from './StarRating';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
`;

const Quote = styled.figure`
  margin: 0;
  padding: 1.75rem 1.5rem;
  border: 1px solid rgba(153, 101, 21, 0.25);
  border-radius: ${theme.borderRadius.medium};
  background: ${theme.colors.cardBg};
  box-shadow: ${theme.shadows.small};

  blockquote {
    margin: 0.9rem 0 1.1rem;
    color: ${theme.colors.text};
    font-size: 1.2rem;
    font-style: italic;
    line-height: 1.6;
  }

  figcaption {
    color: ${theme.colors.textMuted};
    font-size: 1rem;
  }

  strong {
    color: ${theme.colors.primaryDark};
  }
`;

// Opiniones recientes de clientes (4 o 5 estrellas y con comentario). Recibe una
// función que envuelve las tarjetas con su encabezado; si no hay reseñas no muestra nada.
function Testimonials({ limit = 3, children }) {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let active = true;
    apiGetReviews({ withComment: true, limit: 20 })
      .then(list => { if (active) setReviews(list.filter(review => review.rating >= 4).slice(0, limit)); })
      .catch(() => {});
    return () => { active = false; };
  }, [limit]);

  if (!reviews.length) return null;
  return children(
    <Grid>
      {reviews.map(review => (
        <Quote key={review._id}>
          <StarRating value={review.rating} />
          <blockquote>“{review.comment}”</blockquote>
          <figcaption><strong>{review.authorName}</strong> · {review.service}</figcaption>
        </Quote>
      ))}
    </Grid>
  );
}

export default Testimonials;
