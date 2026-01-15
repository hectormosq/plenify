export const defaultCategoryId = 'f6f84c9f-f93d-4ab8-8ebd-3a759fc2d8dc';
export const defaultCategory = {
  [defaultCategoryId]: {
    name: 'default',
    color: '#651fff',
  },
}

export const restCategories = {
  // Housing (Warm Neutrals/Browns)
  '2v3w4x5y-6z7a-8b9c-0d1e-2f3g4h5i6j7k': {
    name: 'Piso',
    color: '#795548', // Brown
  },
  '8b9c0d1e-2f3g-4h5i-6j7k-8l9m0n1o2p3q': {
    name: 'Alquiler',
    color: '#8D6E63', // Light Brown
  },
  '3w4x5y6z-7a8b-9c0d-1e2f-3g4h5i6j7k8l': {
    name: 'Hipoteca',
    color: '#5D4037', // Dark Brown
  },
  '4x5y6z7a-8b9c-0d1e-2f3g-4h5i6j7k8l9m': {
    name: 'Comunidad',
    color: '#A1887F', // Pale Brown
  },
  '9c0d1e2f-3g4h-5i6j-7k8l-9m0n1o2p3q4r': {
    name: 'Compras Hogar',
    color: '#FF7043', // Deep Orange
  },
  '0d1e2f3g-4h5i-6j7k-8l9m-0n1o2p3q4r5s': {
    name: 'Reparaciones',
    color: '#F4511E', // Darker Deep Orange
  },
  
  // Food & Basic Consumables (Greens)
  '1u2v3w4x-5y6z-7a8b-9c0d-1e2f3g4h5i6j': {
    name: 'Supermercado',
    color: '#43A047', // Green
  },
  '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a': {
    name: 'Restaurantes',
    color: '#66BB6A', // Light Green
  },
  '6p7q8r9s-0t1u-2v3w-4x5y-6z7a8b9c0d1e': {
    name: 'Farmacia',
    color: '#2E7D32', // Dark Green
  },

  // Transportation (Blues/Indigos)
  '1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z': {
    name: 'Coche',
    color: '#3949AB', // Indigo
  },
  '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b': {
    name: 'Combustible',
    color: '#303F9F', // Dark Indigo
  },
  '4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9c': {
    name: 'Parking',
    color: '#7986CB', // Light Indigo
  },
  '8r9s0t1u-2v3w-4x5y-6z7a-8b9c0d1e2f3g': {
    name: 'Transporte',
    color: '#1976D2', // Blue
  },
  '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y': {
    name: 'Viajes',
    color: '#29B6F6', // Light Blue
  },

  // Personal & Leisure (Purples/Pinks)
  '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p': {
    name: 'Personal',
    color: '#AB47BC', // Purple
  },
  '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q': {
    name: 'Ocio',
    color: '#9C27B0', // Deep Purple
  },
  '9s0t1u2v-3w4x-5y6z-7a8b-9c0d1e2f3g4h': {
    name: 'Videojuegos',
    color: '#7B1FA2', // Darker Purple
  },
  '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t': {
    name: 'Beisbol',
    color: '#BA68C8', // Lavender
  },
  '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s': {
    name: 'Ropa',
    color: '#EC407A', // Pink
  },
  '7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p': {
    name: 'Caprichos',
    color: '#D81B60', // Magenta
  },
  '5o6p7q8r-9s0t-1u2v-3w4x-5y6z7a8b9c0d': {
    name: 'Regalos',
    color: '#F48FB1', // Light Pink
  },
  '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r': {
    name: 'Compras',
    color: '#FBC02D', // Yellow/Amber
  },

  // Services & Tech (Cyans/Teals/Ambers)
  '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x': {
    name: 'Servicios',
    color: '#FFA000', // Amber
  },
  '6z7a8b9c-0d1e-2f3g-4h5i-6j7k8l9m0n1o': {
    name: 'Seguros',
    color: '#607D8B', // Blue Grey
  },
  '0t1u2v3w-4x5y-6z7a-8b9c-0d1e2f3g4h5i': {
    name: 'Tecnologia',
    color: '#00ACC1', // Cyan
  },
  '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u': {
    name: 'Trabajo',
    color: '#009688', // Teal
  },
  '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v': {
    name: 'Estudio',
    color: '#00796B', // Dark Teal
  },

  // Family & Health (Reds)
  '7q8r9s0t-1u2v-3w4x-5y6z-7a8b9c0d1e2f': {
    name: 'Familia',
    color: '#E53935', // Red
  },
  '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w': {
    name: 'Salud',
    color: '#C62828', // Dark Red
  },
  '5y6z7a8b-9c0d-1e2f-3g4h-5i6j7k8l9m0n': {
    name: 'Prestamos',
    color: '#455A64', // Dark Blue Grey
  },
}
