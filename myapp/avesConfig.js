const iconosAvesAssets = {
    'Pato': require('./assets/pato.jpeg'),
    'Codorniz': require('./assets/codorniz.jpeg'),
    'Ganso': require('./assets/ganso.jpeg'),
    'Gallina': require('./assets/gallina.jpeg'),
  };
  
  const coloresAves = {
    'Pollo': '#FFD700',
    'Pato': '#00BFFF',
    'Pavo': '#8B4513',
    'Codorniz': '#A0522D',
    'Faisán': '#9370DB',
    'Avestruz': '#FF6347',
    'Ganso': '#1E90FF',
    'Paloma': '#778899',
    'Gallina': '#CD5C5C',
    'Pichón': '#87CEFA',
    'default': '#6C63FF'
  };
  
  export const obtenerIconoAve = (nombreAve) => {
    return iconosAvesAssets[nombreAve] || iconosAvesAssets['default'];
  };
  
  export const obtenerColorAve = (nombreAve) => {
    return coloresAves[nombreAve] || coloresAves['default'];
  };