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

  // También tu función toggleEstado ya la tienes bien definida
});
