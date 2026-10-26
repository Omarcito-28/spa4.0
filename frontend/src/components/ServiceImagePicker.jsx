import { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { theme } from '../styles/theme';
import { apiGetServiceImages, apiUploadServiceImage, resolveImageUrl } from '../services/api';
import { Button } from './ManagementUI';
import { ACCEPTED_TYPES, BUILT_IN_IMAGES, MAX_BYTES, shrinkImage } from '../utils/serviceImages';

const Wrapper = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.p`
  margin-bottom: 0.4rem;
  color: ${theme.colors.text};
  font-size: 1.1rem;
  font-weight: 600;
`;

const Top = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.25rem;
  align-items: stretch;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Preview = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border: 1px solid #e4dccd;
  border-radius: 12px;
  background: linear-gradient(135deg, #fbf5ea, #f3e6cf);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.textMuted};
  font-size: 0.95rem;
  text-align: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i {
    display: block;
    margin-bottom: 0.35rem;
    color: ${theme.colors.accent};
    font-size: 1.8rem;
  }
`;

const DropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem;
  border: 2px dashed ${props => props.$active ? theme.colors.accent : '#e0d2b8'};
  border-radius: 12px;
  background: ${props => props.$active ? '#fbf1de' : '#fffcf6'};
  color: ${theme.colors.textMuted};
  font-size: 0.98rem;
  text-align: center;
  transition: background ${theme.transitions.fast}, border-color ${theme.transitions.fast};

  ${Button} {
    margin: 0;
  }

  small {
    font-size: 0.88rem;
  }
`;

const GalleryTitle = styled.p`
  margin: 1.1rem 0 0.5rem;
  color: ${theme.colors.textLight};
  font-size: 0.95rem;
  font-weight: 700;
`;

const Gallery = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 0.6rem;
`;

const Thumb = styled.button`
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: 10px;
  background: #f3eee5;
  cursor: pointer;
  transition: transform ${theme.transitions.fast}, border-color ${theme.transitions.fast}, box-shadow ${theme.transitions.fast};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(60, 40, 10, 0.15);
  }

  ${props => props.$selected && css`
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(201, 148, 42, 0.35);

    &::after {
      content: '\\f00c';
      position: absolute;
      top: 6px;
      right: 6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${theme.colors.primary};
      color: white;
      font-family: 'Font Awesome 6 Free';
      font-size: 0.7rem;
      font-weight: 900;
      line-height: 22px;
      text-align: center;
    }
  `}
`;

const Manual = styled.details`
  margin-top: 0.9rem;
  color: ${theme.colors.textMuted};
  font-size: 0.95rem;

  summary {
    cursor: pointer;
    font-weight: 600;
  }

  input {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.55rem 0.85rem;
    border: 1px solid #e4dccd;
    border-radius: 10px;
    font: inherit;
  }
`;

const ErrorText = styled.p`
  margin-top: 0.5rem;
  color: #8c2318;
  font-size: 0.98rem;
`;

// Permite subir una imagen nueva o elegir una existente. `value` es la ruta guardada en el servicio.
function ServiceImagePicker({ value, onChange, usedImages = [] }) {
  const [uploaded, setUploaded] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    let active = true;
    apiGetServiceImages()
      .then(images => { if (active) setUploaded(images.map(image => image.url)); })
      .catch(() => { /* La galería de subidas es opcional; las imágenes incluidas siguen disponibles. */ });
    return () => { active = false; };
  }, []);

  const gallery = [...new Set([...uploaded, ...BUILT_IN_IMAGES, ...usedImages].filter(Boolean))];

  const upload = async file => {
    setError('');
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no admitido. Usa una imagen JPG, PNG o WebP.');
      return;
    }
    setUploading(true);
    try {
      const prepared = await shrinkImage(file);
      if (prepared.size > MAX_BYTES) throw new Error('La imagen no puede superar 5 MB.');
      const image = await apiUploadServiceImage(prepared);
      setUploaded(current => [image.url, ...current]);
      onChange(image.url);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const drop = event => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  };

  return (
    <Wrapper>
      <Label id="service-image-label">Imagen del servicio</Label>
      <Top>
        <Preview>
          {value
            ? <img src={resolveImageUrl(value)} alt="Vista previa de la imagen seleccionada" />
            : <span><i className="fas fa-image" aria-hidden="true"></i>Sin imagen</span>}
        </Preview>
        <DropZone
          $active={dragging}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          <i className="fas fa-cloud-upload-alt" aria-hidden="true" style={{ fontSize: '1.6rem', color: theme.colors.accent }}></i>
          <span>Arrastra una imagen aquí o</span>
          <div>
            <Button type="button" onClick={() => fileInput.current?.click()} disabled={uploading}>
              {uploading ? <><i className="fas fa-spinner fa-spin" aria-hidden="true"></i> Subiendo…</> : 'Subir imagen'}
            </Button>
            {value && <Button type="button" $secondary onClick={() => onChange('')} disabled={uploading}>Quitar imagen</Button>}
          </div>
          <small>JPG, PNG o WebP · máximo 5 MB</small>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-label="Subir imagen del servicio"
            hidden
            onChange={event => upload(event.target.files?.[0])}
          />
        </DropZone>
      </Top>
      {error && <ErrorText role="alert">{error}</ErrorText>}

      <GalleryTitle>O elige una imagen existente</GalleryTitle>
      <Gallery role="group" aria-labelledby="service-image-label">
        {gallery.map(src => (
          <Thumb
            key={src}
            type="button"
            $selected={src === value}
            aria-pressed={src === value}
            aria-label={`Elegir imagen ${src.split('/').pop()}`}
            onClick={() => onChange(src)}
          >
            <img src={resolveImageUrl(src)} alt="" loading="lazy" />
          </Thumb>
        ))}
      </Gallery>

      <Manual>
        <summary>Usar una ruta o URL</summary>
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="/images/services/... o https://..."
          aria-label="Ruta o URL de la imagen"
        />
      </Manual>
    </Wrapper>
  );
}

export default ServiceImagePicker;
