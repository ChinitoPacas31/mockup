document.addEventListener('DOMContentLoaded', () => {
  const incubadoraEl = document.getElementById('incubadora');
  const codigoIncubadora = incubadoraEl.getAttribute('data-codigo');

  // Función para obtener registros y renderizar gráfico
  async function fetchRegistros() {
    try {
      const response = await fetch(`/incubadora/${codigoIncubadora}/registros`);
      if (!response.ok) throw new Error('Error al obtener registros');

      const registros = await response.json();

      // Formatear datos para el gráfico
      const labels = registros.map(r => {
        const date = new Date(r.fechaHora);
        return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
      });

      const temperaturas = registros.map(r => r.temperatura);
      const humedades = registros.map(r => r.humedad);

      renderizarGrafico(labels, temperaturas, humedades);
    } catch (error) {
      console.error('Error:', error);
      renderizarGrafico([], [], []);
    }
  }

  // Función para renderizar el gráfico
  function renderizarGrafico(labels, temperaturas, humedades) {
    const ctx = document.getElementById('incubationChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Temperatura (°C)',
            data: temperaturas,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Humedad (%)',
            data: humedades,
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
  }

  // Cargar datos iniciales
  fetchRegistros();
});

// Función para iniciar un nuevo ciclo
async function iniciarCiclo() {
  const codigoIncubadora = document.getElementById('incubadora').getAttribute('data-codigo');
  
  // Mostrar modal para seleccionar ave
  document.getElementById('modalAve').style.display = 'block';
  
  // Configurar el botón de confirmación para iniciar el ciclo
  window.confirmarSeleccionAve = async function() {
    const aveId = document.getElementById('tipoAveSelect').value;
    
    if (!aveId) {
      alert("Por favor selecciona un tipo de ave.");
      return;
    }

    try {
      const response = await fetch(`/api/incubadora/${codigoIncubadora}/iniciar-ciclo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ave_id: aveId })
      });

      const data = await response.json();

      if (data.success) {
        alert("Ciclo iniciado correctamente.");
        location.reload();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al iniciar el ciclo.");
    } finally {
      cerrarModal();
    }
  };
}

// Función para apagar la incubadora
// Función para apagar la incubadora
async function confirmarApagado(codigoIncubadora) {
  const descargar = confirm("¿Deseas descargar un archivo con los registros antes de apagar la incubadora?\n\nSi seleccionas 'Aceptar', se descargará un archivo CSV con los registros.\nSi seleccionas 'Cancelar', se apagará la incubadora sin descargar los registros.");
  
  try {
    if (descargar) {
      // Descargar archivo primero
      window.location.href = `/exportar-registros/${codigoIncubadora}`;
      
      // Esperar un momento para que la descarga comience antes de apagar
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Apagar la incubadora (esto se ejecuta tanto si se descarga como si no)
    const response = await fetch(`/api/incubadora/${codigoIncubadora}/apagar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await response.json();

    if (data.success) {
      alert(descargar ? "Archivo descargado e incubadora apagada correctamente." : "Incubadora apagada correctamente.");
      location.reload();
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error al apagar la incubadora.");
  }
}

// Función para iniciar ciclo (actualizada para usar async/await)
async function iniciarCiclo() {
  const codigoIncubadora = document.getElementById('incubadora').getAttribute('data-codigo');
  document.getElementById('modalAve').style.display = 'block';
  
  window.confirmarSeleccionAve = async function() {
    const aveId = document.getElementById('tipoAveSelect').value;
    
    if (!aveId) {
      alert("Por favor selecciona un tipo de ave.");
      return;
    }

    try {
      const response = await fetch(`/api/incubadora/${codigoIncubadora}/iniciar-ciclo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ave_id: aveId })
      });

      const data = await response.json();

      if (data.success) {
        alert("Ciclo iniciado correctamente.");
        location.reload();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al iniciar el ciclo.");
    } finally {
      cerrarModal();
    }
  };
}

// Cerrar el modal
function cerrarModal() {
  document.getElementById('modalAve').style.display = 'none';
}