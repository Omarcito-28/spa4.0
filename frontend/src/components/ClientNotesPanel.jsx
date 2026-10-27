import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { apiCreateClientNote, apiDeleteClientNote, apiGetClientNotes } from '../services/api';
import { useAuth } from '../contexts/auth';
import { Button, InlineForm, Notice } from './ManagementUI';

const NoteList = styled.ul`
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;

  li {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.7rem 0;
    border-bottom: 1px dashed #e4dccd;
  }

  p {
    margin: 0 0 0.25rem;
    white-space: pre-wrap;
  }

  small {
    color: ${theme.colors.textMuted};
  }
`;

// Notas internas del equipo sobre un cliente: alergias, productos usados, preferencias.
function ClientNotesPanel({ client, clientName }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setNotes(await apiGetClientNotes(client));
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const add = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiCreateClientNote(client, text);
      setText('');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async note => {
    if (!window.confirm('¿Borrar esta nota?')) return;
    try {
      await apiDeleteClientNote(note._id);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const canDelete = note => user?.role === 'ADMIN' || note.author === user?.username;

  return (
    <section aria-label={`Notas sobre ${clientName || client}`}>
      <strong>Notas internas sobre {clientName || client}</strong> <small>(el cliente no las ve)</small>
      {error && <Notice $error role="alert">{error}</Notice>}
      {loading ? <p role="status">Cargando notas…</p> : (
        <NoteList>
          {notes.length === 0 && <li><small>Todavía no hay notas sobre este cliente.</small></li>}
          {notes.map(note => (
            <li key={note._id}>
              <div>
                <p>{note.text}</p>
                <small>{note.authorName || note.author} · {new Date(note.createdAt).toLocaleDateString('es-CO')}</small>
              </div>
              {canDelete(note) && <Button type="button" $secondary onClick={() => remove(note)}>Borrar</Button>}
            </li>
          ))}
        </NoteList>
      )}
      <InlineForm onSubmit={add}>
        <label>Nueva nota
          <textarea value={text} onChange={event => setText(event.target.value)} maxLength={1000} rows={2}
            placeholder="Ej.: alérgica al amoníaco, tinte 7.1, prefiere agua tibia" />
        </label>
        <Button type="submit" disabled={saving || !text.trim()}>{saving ? 'Guardando…' : 'Guardar nota'}</Button>
      </InlineForm>
    </section>
  );
}

export default ClientNotesPanel;
