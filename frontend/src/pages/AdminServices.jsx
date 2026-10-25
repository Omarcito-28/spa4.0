import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { apiCreateService, apiDeleteService, apiGetServices, apiUpdateService } from '../services/api';
import AdminNav from '../components/AdminNav';
import Pagination from '../components/Pagination';
import { Button, Card, Description, EmptyCell, Field, Form, Grid, Notice, Page, ResultCount, SectionTitle, Table, TableWrap, Title, Toolbar } from '../components/ManagementUI';

const emptyService = { name: '', description: '', price: '', duration: 60, image: '' };

const ServiceCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;

  img {
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 10px;
    object-fit: cover;
    background: #f3eee5;
  }

  span {
    display: block;
    max-width: 420px;
    font-size: 0.95rem;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Actions = styled.td`
  white-space: nowrap;
`;

function AdminServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyService);
  const [editingId, setEditingId] = useState('');
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = useCallback(async () => {
    try {
      setServices(await apiGetServices());
    } catch (error) {
      setNotice({ error: true, text: error.message });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submit = async event => {
    event.preventDefault();
    try {
      const payload = { ...form, duration: Number(form.duration) };
      if (editingId) await apiUpdateService(editingId, payload);
      else await apiCreateService(payload);
      setForm(emptyService);
      setEditingId('');
      setNotice({ error: false, text: 'El catálogo se actualizó.' });
      await load();
    } catch (error) {
      setNotice({ error: true, text: error.message });
    }
  };

  const edit = service => {
    setForm({ name: service.name, description: service.description || '', price: service.price, duration: service.duration || 60, image: service.image || '' });
    setEditingId(service._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async service => {
    if (!window.confirm(`¿Eliminar el servicio "${service.name}"?`)) return;
    try {
      await apiDeleteService(service._id);
      setNotice({ error: false, text: 'Servicio eliminado.' });
      await load();
    } catch (error) {
      setNotice({ error: true, text: error.message });
    }
  };

  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const filteredServices = services.filter(service =>
    `${service.name} ${service.description || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const visibleServices = filteredServices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Page>
      <AdminNav />
      <Title>Gestionar servicios</Title>
      <Description>Los servicios publicados aparecen en el catálogo y en el formulario de reservas.</Description>
      <Card>
        <h2>{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
        <Form onSubmit={submit}>
          <Grid>
            <Field>Nombre<input name="name" value={form.name} onChange={change} required maxLength={120} /></Field>
            <Field>Precio<input name="price" value={form.price} onChange={change} required maxLength={40} placeholder="$50.000" /></Field>
            <Field>Duración (minutos)<input name="duration" type="number" value={form.duration} onChange={change} required min={15} max={480} step={15} /></Field>
          </Grid>
          <Field>Descripción<textarea name="description" value={form.description} onChange={change} maxLength={1000} rows={3} /></Field>
          <Field>Ruta de imagen<input name="image" value={form.image} onChange={change} placeholder="/images/services/..." /></Field>
          <Button type="submit">{editingId ? 'Guardar cambios' : 'Agregar servicio'}</Button>
          {editingId && <Button type="button" $secondary onClick={() => { setEditingId(''); setForm(emptyService); }}>Cancelar edición</Button>}
        </Form>
        {notice && <Notice $error={notice.error} role="status">{notice.text}</Notice>}
      </Card>
      <SectionTitle>Catálogo</SectionTitle>
      <Toolbar>
        <input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar servicios" aria-label="Buscar servicios" />
      </Toolbar>
      <ResultCount>{filteredServices.length} servicios encontrados</ResultCount>
      <TableWrap><Table>
        <thead><tr><th>Servicio</th><th>Precio</th><th>Duración</th><th>Acciones</th></tr></thead>
        <tbody>
          {visibleServices.length === 0 && <tr><EmptyCell colSpan={4}>No hay servicios que coincidan con la búsqueda.</EmptyCell></tr>}
          {visibleServices.map(service => (
            <tr key={service._id}>
              <td>
                <ServiceCell>
                  {service.image && <img src={service.image} alt="" />}
                  <div><strong>{service.name}</strong>{service.description && <span title={service.description}>{service.description}</span>}</div>
                </ServiceCell>
              </td>
              <td>{service.price}</td><td>{service.duration || 60} min</td>
              <Actions><Button type="button" $secondary onClick={() => edit(service)}>Editar</Button><Button type="button" $danger onClick={() => remove(service)}>Eliminar</Button></Actions>
            </tr>
          ))}
        </tbody>
      </Table></TableWrap>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Page>
  );
}

export default AdminServices;
