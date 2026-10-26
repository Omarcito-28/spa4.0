import { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '../styles/theme';
import { apiGetServices, resolveImageUrl } from '../services/api';
import BookServiceLink from './BookServiceLink';

const AUTOPLAY_MS = 5000;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Wrapper = styled.div`
  position: relative;
`;

// Pista con scroll-snap: en móvil se desliza con el dedo, en escritorio con las flechas.
const Track = styled.div`
  --gap: 1.5rem;
  --per-view: 3;
  display: flex;
  gap: var(--gap);
  padding: 0.5rem 0.25rem 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 0.25rem;
  scroll-behavior: smooth;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 960px) {
    --per-view: 2;
  }

  @media (max-width: 600px) {
    --gap: 1rem;
    --per-view: 1.15;
  }
`;

const Slide = styled.article`
  flex: 0 0 calc((100% - (var(--per-view) - 1) * var(--gap)) / var(--per-view));
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #ecdfc6;
  border-radius: ${theme.borderRadius.large};
  background: ${theme.colors.cardBg};
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04), 0 10px 30px rgba(60, 40, 10, 0.08);
  transition: transform ${theme.transitions.normal}, box-shadow ${theme.transitions.normal};

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${theme.shadows.cardHover};
  }

  &:hover img {
    transform: scale(1.06);
  }
`;

const Media = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s ease;
  }

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0;
    height: 45%;
    background: linear-gradient(transparent, rgba(10, 10, 10, 0.55));
    pointer-events: none;
  }
`;

const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 2.5rem;
`;

const Price = styled.span`
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  z-index: 1;
  padding: 0.3rem 0.9rem;
  border: 1px solid rgba(201, 148, 42, 0.35);
  border-radius: ${theme.borderRadius.pill};
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(6px);
  color: ${theme.colors.navbarLinkHover};
  font-size: 1.05rem;
  font-weight: 700;
`;

const Duration = styled.span`
  position: absolute;
  left: 0.9rem;
  bottom: 0.8rem;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 1.35rem 1.5rem 1.5rem;

  h3 {
    margin-bottom: 0.4rem;
    color: ${theme.colors.text};
    font-size: 1.85rem;
  }

  p {
    flex: 1;
    display: -webkit-box;
    margin-bottom: 1.25rem;
    overflow: hidden;
    color: ${theme.colors.textMuted};
    font-size: 1.12rem;
    line-height: 1.6;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
`;

const SkeletonSlide = styled(Slide)`
  min-height: 420px;
  border-color: transparent;
  background: linear-gradient(90deg, #f3ebdd 25%, #faf4ea 50%, #f3ebdd 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s linear infinite;

  &:hover {
    transform: none;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
`;

const Arrow = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border: 1px solid #e4d3b2;
  border-radius: 50%;
  background: white;
  color: ${theme.colors.primary};
  font-size: 1rem;
  box-shadow: ${theme.shadows.small};
  transition: all ${theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: transparent;
    background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
    color: white;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const Dots = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Dot = styled.button`
  width: ${props => props.$active ? '28px' : '10px'};
  height: 10px;
  padding: 0;
  border: none;
  border-radius: 5px;
  background: ${props => props.$active ? theme.colors.accent : '#e2d4bb'};
  transition: all ${theme.transitions.normal};

  &:hover {
    background: ${props => props.$active ? theme.colors.accent : '#cdb68d'};
  }
`;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Carrusel de servicios con los datos reales del catálogo. Si no hay servicios no muestra nada.
function ServicesCarousel({ isAuthenticated = false }) {
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('loading');
  const [index, setIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    let active = true;
    apiGetServices()
      .then(data => {
        if (!active) return;
        setServices(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);

  // Ancho de un paso (tarjeta + separación) y cuántas posiciones distintas hay.
  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild;
    if (!track || !first) return { step: 0, pages: 1 };
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    if (!step) return { step: 0, pages: services.length || 1 };
    const perView = Math.max(1, Math.floor((track.clientWidth + gap) / step + 0.01));
    return { step, pages: Math.max(1, services.length - perView + 1) };
  }, [services.length]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    const update = () => setPageCount(measure().pages);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [status, measure]);

  const goTo = useCallback(target => {
    const { pages } = measure();
    const next = ((target % pages) + pages) % pages;
    setIndex(next);
    // Se usa la posición real de la tarjeta para que quede alineada aunque el ancho tenga decimales.
    const track = trackRef.current;
    const slide = track?.children[next];
    if (slide && track.firstElementChild) {
      track.scrollTo?.({ left: slide.offsetLeft - track.firstElementChild.offsetLeft, behavior: 'smooth' });
    }
  }, [measure]);

  const handleScroll = () => {
    const { step, pages } = measure();
    if (!step) return;
    setIndex(Math.min(pages - 1, Math.round(trackRef.current.scrollLeft / step)));
  };

  useEffect(() => {
    if (paused || pageCount <= 1 || prefersReducedMotion()) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') goTo(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, pageCount, index, goTo]);

  if (status === 'error' || (status === 'ready' && services.length === 0)) return null;

  return (
    <Wrapper
      role="region"
      aria-roledescription="carrusel"
      aria-label="Servicios destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      <Track ref={trackRef} onScroll={handleScroll} aria-busy={status === 'loading'}>
        {status === 'loading' && [0, 1, 2].map(key => <SkeletonSlide key={key} aria-hidden="true" />)}
        {services.map((service, position) => (
          <Slide
            key={service._id}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${position + 1} de ${services.length}: ${service.name}`}
          >
            <Media>
              <Placeholder aria-hidden="true"><i className="fas fa-spa"></i></Placeholder>
              {service.image && (
                <img
                  src={resolveImageUrl(service.image)}
                  alt={service.name}
                  loading="lazy"
                  style={{ position: 'relative' }}
                  onError={event => { event.currentTarget.hidden = true; }}
                />
              )}
              {service.price && <Price>{service.price}</Price>}
              <Duration><i className="far fa-clock" aria-hidden="true"></i>{service.duration || 60} min</Duration>
            </Media>
            <Body>
              <h3>{service.name}</h3>
              <p>{service.description || 'Un momento para ti, con la atención de nuestros profesionales.'}</p>
              <BookServiceLink serviceName={service.name} isAuthenticated={isAuthenticated} />
            </Body>
          </Slide>
        ))}
      </Track>

      {status === 'ready' && pageCount > 1 && (
        <Controls>
          <Arrow type="button" onClick={() => goTo(index - 1)} aria-label="Servicios anteriores">
            <i className="fas fa-chevron-left" aria-hidden="true"></i>
          </Arrow>
          <Dots>
            {Array.from({ length: pageCount }, (_, dot) => (
              <Dot
                key={dot}
                type="button"
                $active={dot === index}
                aria-label={`Ir a la posición ${dot + 1}`}
                aria-current={dot === index}
                onClick={() => goTo(dot)}
              />
            ))}
          </Dots>
          <Arrow type="button" onClick={() => goTo(index + 1)} aria-label="Servicios siguientes">
            <i className="fas fa-chevron-right" aria-hidden="true"></i>
          </Arrow>
        </Controls>
      )}
    </Wrapper>
  );
}

export default ServicesCarousel;
