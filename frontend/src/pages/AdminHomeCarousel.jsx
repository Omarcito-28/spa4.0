import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../styles/theme';
import {
  apiCreateHeroSlide,
  apiDeleteHeroSlide,
  apiGetAllHeroSlides,
  apiGetServiceImages,
  apiReorderHeroSlides,
  apiUpdateHeroSlide,
  apiUploadServiceImage,
  resolveImageUrl,
} from '../services/api';
import { Button, Card, Description, Notice, Page, SectionTitle, Title } from '../components/ManagementUI';
import { ACCEPTED_TYPES, BUILT_IN_IMAGES, MAX_BYTES, shrinkImage } from '../utils/serviceImages';
import { DEFAULT_HERO_SLIDES, MAX_HERO_SLIDES, isHeroImage } from '../utils/heroSlides';

const Header = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 1.1rem;
    border: 1px solid #e4d3b2;
    border-radius: 999px;
    background: white;
    color: ${theme.colors.primaryDark};
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      border-color: ${theme.colors.accent};
      text-decoration: none;
    }
  }
`;

const Counter = styled.span`
  margin-left: auto;
  color: ${theme.colors.textMuted};
  font-family: ${theme.fonts.secondary};
  font-size: 1rem;
  font-weight: 600;
`;

const SlideList = styled.ol`
  display: grid;
  gap: 0.9rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const SlideRow = styled.li`
  display: grid;
  grid-template-columns: auto 200px minmax(0, 1fr) auto;
  align-items: center;
  gap: 1.1rem;
  padding: 0.85rem;
  border: 1px solid ${theme.colors.dashboardCardBorder};
  border-radius: 14px;
  background: white;
  box-shadow: 0 1px 2px rgba(60, 40, 10, 0.04);

  ${props => props.$hidden && css`
    background: #faf8f4;

    img {
      filter: grayscale(0.85);
      opacity: 0.6;
    }
  `}

  @media (max-width: 860px) {
    grid-template-columns: auto 140px minmax(0, 1fr);

    > :last-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Order = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent});
  color: white;
  font-weight: 800;

  @media (max-width: 520px) {
    display: none;
  }
`;

const Thumb = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 10px;
  background: linear-gradient(135deg, #f6eedd, #efe3cc);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const HiddenBadge = styled.span`
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: rgba(13, 11, 8, 0.8);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
`;

const AltField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  color: ${theme.colors.textLight};
  font-size: 0.95rem;
  font-weight: 700;

  div {
    display: flex;
    gap: 0.5rem;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 0.55rem 0.8rem;
    border: 1px solid ${theme.colors.dashboardCardBorder};
    border-radius: 10px;
    font: inherit;
    font-weight: 400;
  }

  small {
    color: ${theme.colors.textMuted};
    font-weight: 400;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.4rem;

  ${Button} {
    margin: 0;
  }
`;

const IconButton = styled(Button)`
  width: 40px;
  padding-left: 0;
  padding-right: 0;
`;

const DefaultsPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
  margin: 1rem 0;

  ${Thumb} img {
    filter: saturate(0.85);
  }
`;

const AddGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 1.5rem;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const DropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  min-height: 200px;
  padding: 1.25rem;
  border: 2px dashed ${props => (props.$active ? theme.colors.accent : '#e0d2b8')};
  border-radius: 14px;
  background: ${props => (props.$active ? '#fbf1de' : '#fffcf6')};
  color: ${theme.colors.textMuted};
  text-align: center;

  > i {
    color: ${theme.colors.accent};
    font-size: 1.8rem;
  }

  ${Button} {
    margin: 0;
  }

  small {
    font-size: 0.9rem;
  }
`;

const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.75rem;
`;

const GalleryItem = styled.button`
  position: relative;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 12px;
  background: none;
  text-align: left;
  transition: transform ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  ${Thumb} {
    border-radius: 10px;
  }

  span {
    position: absolute;
    right: 6px;
    bottom: 6px;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: rgba(13, 11, 8, 0.8);
    color: white;
    font-size: 0.8rem;
    font-weight: 700;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(60, 40, 10, 0.15);

    span {
      background: ${theme.colors.primary};
    }
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:disabled img {
    opacity: 0.45;
  }
`;

const fileName = src => decodeURIComponent(src.split('/').pop());

// El administrador elige las imágenes de fondo de la portada: cuáles, en qué
// orden, con qué descripción y si se ven o no.
function AdminHomeCarousel() {
  const [slides, setSlides] = useState(null);
  const [uploaded, setUploaded] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    let active = true;
    apiGetAllHeroSlides()
      .then(data => { if (active) setSlides(data); })
      .catch(error => { if (active) { setSlides([]); setNotice({ error: true, text: error.message }); } });
    apiGetServiceImages()
      .then(images => { if (active) setUploaded(images.map(image => image.url)); })
      .catch(() => { /* Sin la galería de subidas siguen disponibles las imágenes incluidas. */ });
    return () => { active = false; };
  }, []);

  const list = slides ?? [];
  const full = list.length >= MAX_HERO_SLIDES;
  const inCarousel = new Set(list.map(slide => slide.image));
  const gallery = [...new Set([...uploaded, ...BUILT_IN_IMAGES])].filter(isHeroImage);
  const visibleCount = list.filter(slide => slide.isActive).length;

  // Ejecuta un cambio, muestra el resultado y deja el botón ocupado mientras tanto.
  const run = async (action, success) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (success) setNotice({ text: success });
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setBusy(false);
    }
  };

  const add = (image, alt = '') => run(async () => {
    const slide = await apiCreateHeroSlide({ image, alt });
    setSlides(current => [...(current ?? []), slide]);
  }, 'Imagen agregada al carrusel.');

  const addDefaults = () => run(async () => {
    const created = [];
    for (const slide of DEFAULT_HERO_SLIDES) created.push(await apiCreateHeroSlide(slide));
    setSlides(current => [...(current ?? []), ...created]);
  }, 'Se agregaron las imágenes predeterminadas: ahora puedes cambiarlas.');

  const replace = updated => setSlides(current => current.map(slide => (slide._id === updated._id ? updated : slide)));

  const toggle = slide => run(async () => {
    replace(await apiUpdateHeroSlide(slide._id, { isActive: !slide.isActive }));
  }, slide.isActive ? 'La imagen quedó oculta en la portada.' : 'La imagen se muestra en la portada.');

  const saveAlt = slide => run(async () => {
    replace(await apiUpdateHeroSlide(slide._id, { alt: drafts[slide._id] ?? slide.alt }));
    setDrafts(current => { const next = { ...current }; delete next[slide._id]; return next; });
  }, 'Descripción guardada.');

  const move = (index, offset) => run(async () => {
    const ids = list.map(slide => slide._id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    setSlides(await apiReorderHeroSlides(ids));
  });

  const remove = slide => run(async () => {
    await apiDeleteHeroSlide(slide._id);
    setSlides(current => current.filter(item => item._id !== slide._id));
  }, 'Imagen quitada del carrusel. Sigue disponible en la galería.');

  const upload = file => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setNotice({ error: true, text: 'Formato no admitido. Usa una imagen JPG, PNG o WebP.' });
      return;
    }
    run(async () => {
      const prepared = await shrinkImage(file);
      if (prepared.size > MAX_BYTES) throw new Error('La imagen no puede superar 5 MB.');
      const image = await apiUploadServiceImage(prepared);
      setUploaded(current => [image.url, ...current]);
      const slide = await apiCreateHeroSlide({ image: image.url });
      setSlides(current => [...(current ?? []), slide]);
    }, 'Imagen subida y agregada al carrusel.').finally(() => {
      if (fileInput.current) fileInput.current.value = '';
    });
  };

  return (
    <Page>
      <Header>
        <div>
          <Title>Carrusel del inicio</Title>
          <Description>
            Elige las imágenes de fondo de la portada, su orden y una descripción breve para quienes usan lector de pantalla.
            Cambian solas cada 6 segundos.
          </Description>
        </div>
        <a href="/" target="_blank" rel="noreferrer">
          <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i> Ver la portada
        </a>
      </Header>

      {notice && <Notice $error={notice.error} role={notice.error ? 'alert' : 'status'}>{notice.text}</Notice>}

      <SectionTitle>
        Imágenes del carrusel
        {slides && <Counter>{list.length} de {MAX_HERO_SLIDES} · {visibleCount} visibles</Counter>}
      </SectionTitle>

      {!slides && <p role="status">Cargando el carrusel…</p>}

      {slides && list.length === 0 && (
        <Card>
          <p>
            Todavía no elegiste imágenes, así que la portada muestra estas imágenes predeterminadas.
            Agrega las tuyas abajo, o empieza con estas para ordenarlas, ocultarlas o quitarlas.
          </p>
          <DefaultsPreview>
            {DEFAULT_HERO_SLIDES.map(slide => (
              <Thumb key={slide.image}><img src={slide.image} alt={slide.alt} /></Thumb>
            ))}
          </DefaultsPreview>
          <Button type="button" onClick={addDefaults} disabled={busy} aria-busy={busy || undefined}>
            <i className="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Empezar con las predeterminadas
          </Button>
        </Card>
      )}

      {slides && list.length > 0 && visibleCount === 0 && (
        <Notice $error role="status">Todas las imágenes están ocultas: la portada muestra las predeterminadas.</Notice>
      )}

      {list.length > 0 && (
        <SlideList aria-label="Imágenes del carrusel, en orden">
          {list.map((slide, index) => {
            const draft = drafts[slide._id] ?? slide.alt;
            const altId = `alt-${slide._id}`;
            return (
              <SlideRow key={slide._id} $hidden={!slide.isActive}>
                <Order aria-hidden="true">{index + 1}</Order>
                <Thumb>
                  <img src={resolveImageUrl(slide.image)} alt="" />
                  {!slide.isActive && <HiddenBadge>Oculta</HiddenBadge>}
                </Thumb>
                <AltField>
                  <label htmlFor={altId}>Descripción de la imagen {index + 1}</label>
                  <div>
                    <input
                      id={altId}
                      aria-describedby={`${altId}-file`}
                      value={draft}
                      maxLength={140}
                      placeholder="Ej.: Clienta recibiendo un tratamiento capilar"
                      onChange={event => setDrafts(current => ({ ...current, [slide._id]: event.target.value }))}
                      onKeyDown={event => { if (event.key === 'Enter') saveAlt(slide); }}
                    />
                    {draft !== slide.alt && (
                      <Button type="button" onClick={() => saveAlt(slide)} disabled={busy}>Guardar</Button>
                    )}
                  </div>
                  <small id={`${altId}-file`}>{fileName(slide.image)}</small>
                </AltField>
                <Actions>
                  <IconButton type="button" $secondary onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Subir la imagen ${index + 1}`}>
                    <i className="fas fa-arrow-up" aria-hidden="true"></i>
                  </IconButton>
                  <IconButton type="button" $secondary onClick={() => move(index, 1)} disabled={busy || index === list.length - 1} aria-label={`Bajar la imagen ${index + 1}`}>
                    <i className="fas fa-arrow-down" aria-hidden="true"></i>
                  </IconButton>
                  <Button type="button" $secondary onClick={() => toggle(slide)} disabled={busy}>
                    <i className={`fas ${slide.isActive ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true"></i> {slide.isActive ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button type="button" $danger onClick={() => remove(slide)} disabled={busy} aria-label={`Quitar la imagen ${index + 1}`}>
                    <i className="fas fa-trash" aria-hidden="true"></i> Quitar
                  </Button>
                </Actions>
              </SlideRow>
            );
          })}
        </SlideList>
      )}

      <SectionTitle>Agregar imágenes</SectionTitle>
      {full && <Notice $error role="status">El carrusel ya tiene {MAX_HERO_SLIDES} imágenes. Quita una para agregar otra.</Notice>}
      <AddGrid>
        <DropZone
          $active={dragging}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); if (!full) upload(event.dataTransfer.files?.[0]); }}
        >
          <i className="fas fa-cloud-arrow-up" aria-hidden="true"></i>
          <span>Arrastra una foto aquí o</span>
          <Button type="button" onClick={() => fileInput.current?.click()} disabled={busy || full} aria-busy={busy || undefined}>
            Subir imagen
          </Button>
          <small>JPG, PNG o WebP · máximo 5 MB. Mejor horizontal y de al menos 1600 px de ancho.</small>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-label="Subir imagen para el carrusel"
            hidden
            onChange={event => upload(event.target.files?.[0])}
          />
        </DropZone>
        <div>
          <p id="hero-gallery-label" style={{ marginBottom: '0.6rem', fontWeight: 700 }}>O elige una de la galería</p>
          <Gallery role="group" aria-labelledby="hero-gallery-label">
            {gallery.map(src => {
              const added = inCarousel.has(src);
              return (
                <GalleryItem
                  key={src}
                  type="button"
                  onClick={() => add(src)}
                  disabled={busy || full || added}
                  aria-label={added ? `${fileName(src)} ya está en el carrusel` : `Agregar ${fileName(src)} al carrusel`}
                >
                  <Thumb><img src={resolveImageUrl(src)} alt="" loading="lazy" /></Thumb>
                  <span>
                    <i className={`fas ${added ? 'fa-check' : 'fa-plus'}`} aria-hidden="true"></i>
                    {added ? 'En el carrusel' : 'Agregar'}
                  </span>
                </GalleryItem>
              );
            })}
          </Gallery>
        </div>
      </AddGrid>
    </Page>
  );
}

export default AdminHomeCarousel;
