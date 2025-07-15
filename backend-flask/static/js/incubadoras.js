// Efecto de carga suave para los elementos
document.addEventListener('DOMContentLoaded', () => {
    const items = document.querySelectorAll('.incubadora-item');
    items.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
    });
  });

document.addEventListener('DOMContentLoaded', () => {
const buscador = document.getElementById('buscador');
const allItems = Array.from(document.querySelectorAll('.incubadora-item'));
const paginacion = document.getElementById('paginacion');
const porPagina = 4;
let paginaActual = 1;
let itemsFiltrados = [...allItems]; // Inicialmente, todos

function mostrarPagina(pagina) {
  const inicio = (pagina - 1) * porPagina;
  const fin = inicio + porPagina;

  allItems.forEach(item => item.style.display = 'none');

  itemsFiltrados.slice(inicio, fin).forEach(item => {
    item.style.display = 'block';
  });

  generarBotones(Math.ceil(itemsFiltrados.length / porPagina), pagina);
}

function generarBotones(totalPaginas, activa) {
  paginacion.innerHTML = '';
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.toggle('active', i === activa);
    btn.addEventListener('click', () => {
      paginaActual = i;
      mostrarPagina(i);
    });
    paginacion.appendChild(btn);
  }
}

buscador.addEventListener('input', () => {
  const valor = buscador.value.toLowerCase();

  itemsFiltrados = allItems.filter(item => {
    const nombre = item.querySelector('.incubadora-name').textContent.toLowerCase();
    const ubicacion = item.querySelector('.incubadora-details span:nth-child(1)').textContent.toLowerCase();
    const codigo = item.querySelector('.incubadora-details span:nth-child(2)').textContent.toLowerCase();

    return nombre.includes(valor) || ubicacion.includes(valor) || codigo.includes(valor);
  });

  paginaActual = 1;
  mostrarPagina(paginaActual);
});

mostrarPagina(paginaActual);
});

function toggleIncubadora(id) {
const estadoEl = document.getElementById(`estado-${id}`);
const esActiva = estadoEl.classList.contains('status-active');

const mensaje = esActiva
  ? '¿Estás seguro que deseas desactivar esta incubadora?'
  : '¿Deseas activar esta incubadora?';

const confirmar = confirm(mensaje);
if (!confirmar) return;

fetch(`/api/incubadora/${id}/toggle`, {
  method: 'POST'
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    const estado = document.getElementById(`estado-${id}`);
    const icon = estado.querySelector('i');

    if (data.activa) {
      estado.classList.remove('status-inactive');
      estado.classList.add('status-active');
      estado.innerHTML = `<i class="fas fa-check-circle"></i> Activa`;
    } else {
      estado.classList.remove('status-active');
      estado.classList.add('status-inactive');
      estado.innerHTML = `<i class="fas fa-times-circle"></i> Inactiva`;
    }
  } else {
    alert('No se pudo cambiar el estado.');
  }
})
.catch(err => {
  console.error('Error:', err);
  alert('Error en la petición.');
});
}