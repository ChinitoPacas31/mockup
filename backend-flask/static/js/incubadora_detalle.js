
document.addEventListener('DOMContentLoaded', () => {
  const incubadoraEl = document.getElementById('incubadora');
  const codigoIncubadora = incubadoraEl.getAttribute('data-codigo');

  // Mapeo de nombres de aves a rutas de imágenes locales
  const avesImagenes = {
    'Pato': '/static/images/aves/pato.png',
    'Codorniz': '/static/images/aves/codormis.png',
    'Ganso': '/static/images/aves/ganso.png',
    'Gallina': '/static/images/aves/gallina.png'
  };

  // Función para cargar imágenes locales
  function cargarImagenesAves() {
    document.querySelectorAll('.bird-card').forEach(card => {
      const nombreAve = card.dataset.aveName;
      const contenedorImagen = card.querySelector('.bird-image-container');
      
      if (avesImagenes[nombreAve]) {
        contenedorImagen.innerHTML = `
          <img src="${avesImagenes[nombreAve]}" 
               alt="${nombreAve}" 
               class="bird-image"
               onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\'fas fa-dove\'></i>'">`;
      } else {
        contenedorImagen.innerHTML = '<i class="fas fa-dove"></i>';
      }
    });
  }

  // Configurar observador para el modal
  const modal = document.getElementById('modalAve');
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'style' && modal.style.display === 'block') {
        cargarImagenesAves();
      }
    });
  });
  observer.observe(modal, { attributes: true });

  // Función para iniciar ciclo
  window.iniciarCiclo = function() {
    modal.style.display = 'block';
    cargarImagenesAves();
  };

  // Función para confirmar selección
  window.confirmarSeleccionAve = async function() {
    const selectedRadio = document.querySelector('input[name="selectedBird"]:checked');
    
    if (!selectedRadio) {
      alert("Por favor selecciona un tipo de ave.");
      return;
    }

    const aveId = selectedRadio.value;
    
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

  // Función para cerrar modal
  window.cerrarModal = function() {
    modal.style.display = 'none';
  };
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
            label: 'Temperature (°C)',
            data: temperaturas,
            borderColor: '#e74c3c',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.3,
            fill: true,
            yAxisID: 'y',
          },
          {
            label: 'Humidity (%)',
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
              text: 'Temperature (°C)'
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
              text: 'Humidity (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Time'
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
  const descargar = confirm("Would you like to download a file with the records before turning off the incubator?\n\nIf you select ‘Accept’, a CSV file containing the records will be downloaded.\nIf you select ‘Cancel’, the incubator will shut down without downloading the logs.");
  
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
      alert(descargar ? "File downloaded and incubator shut down correctly." : "Incubator shut down correctly.");
      location.reload();
    } else {
      alert("Error: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error when shutting down the incubator.");
  }
}

// Función para iniciar ciclo (actualizada para usar async/await)
async function iniciarCiclo() {
  const codigoIncubadora = document.getElementById('incubadora').getAttribute('data-codigo');
  document.getElementById('modalAve').style.display = 'block';
  
  window.confirmarSeleccionAve = async function() {
    const aveId = document.getElementById('tipoAveSelect').value;
    
    if (!aveId) {
      alert("Please select a type of bird.");
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
        alert("Cycle started successfully.");
        location.reload();
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error starting cycle.");
    } finally {
      cerrarModal();
    }
  };
}

// Cerrar el modal
function cerrarModal() {
  document.getElementById('modalAve').style.display = 'none';
}