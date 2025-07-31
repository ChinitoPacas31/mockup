document.addEventListener('DOMContentLoaded', () => {
  const incubadoraEl = document.getElementById('incubadora');
  const incubadoraId = incubadoraEl.getAttribute('data-id');

  // Función para obtener registros desde backend
  async function fetchRegistros() {
    try {
      const response = await fetch(`/incubadora/${incubadoraId}/registros`);
      if (!response.ok) throw new Error('Error al obtener registros');

      const registros = await response.json();

      // Extraer labels (hora) y datos
      const labels = registros.map(r => {
        const date = new Date(r.fechaHora);
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      });

      const temperaturas = registros.map(r => r.temperatura);
      const humedades = registros.map(r => r.humedad);

      return { labels, temperaturas, humedades };
    } catch (error) {
      console.error(error);
      return { labels: [], temperaturas: [], humedades: [] };
    }
  }

  const ctx = document.getElementById('incubationChart').getContext('2d');

  fetchRegistros().then(data => {
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: data.temperaturas,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Humedad (%)',
            data: data.humedades,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 20,
            max: 50,
            title: {
              display: true,
              text: 'Temperatura (°C)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false,
            },
            title: {
              display: true,
              text: 'Humedad (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Hora'
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
  });
});

function toggleEstado(id) {
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

// Mostrar el modal al hacer clic en el estado
function toggleEstado(incubadoraId) {
  document.getElementById('incubadora').setAttribute('data-id', incubadoraId);
  document.getElementById('modalAve').style.display = 'block';
}

// Cerrar el modal
function cerrarModal() {
  document.getElementById('modalAve').style.display = 'none';
}

// Confirmar la selección del ave
async function seleccionarAve() {
  const aveId = document.getElementById('tipoAveSelect').value;
  const incubadoraId = document.getElementById('incubadora').getAttribute('data-id');

  if (!aveId) {
    alert("Selecciona un tipo de ave.");
    return;
  }

  try {
    const res = await fetch(`/api/incubadora/${incubadoraId}/asignar-ave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ave_id: aveId })
    });

    const data = await res.json();

    if (data.success) {
      alert("Ave asignada correctamente.");
      location.reload();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Error en la solicitud:", err);
    alert("Error inesperado.");
  }

  cerrarModal();
}
