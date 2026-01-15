import { RequestHandler } from "express";

const defaultCategoryId = 'f6f84c9f-f93d-4ab8-8ebd-3a759fc2d8dc';
const defaultCategory = {
  [defaultCategoryId]: {
    name: 'default',
    color: '#651fff',
  },
}

const restCategories = {
  '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p': {
    name: 'Personal',
    color: '#ff5722',
  },
  '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q': {
    name: 'Ocio',
    color: '#4caf50',
  },
  '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r': {
    name: 'Compras',
    color: '#ffeb3b',
  },
  '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s': {
    name: 'Ropa',
    color: '#e91e63',
  },
  '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t': {
    name: 'Beisbol',
    color: '#2196f3',
  },
  '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u': {
    name: 'Trabajo',
    color: '#9c27b0',
  },
  '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v': {
    name: 'Estudio',
    color: '#00bcd4',
  },
  '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w': {
    name: 'Salud',
    color: '#8bc34a',
  },
  '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x': {
    name: 'Servicios',
    color: '#ffc107',
  },
  '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y': {
    name: 'Viajes',
    color: '#ff9800',
  },
  '1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z': {
    name: 'Coche',
    color: '#673ab7',
  },
  '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a': {
    name: 'Restaurantes',
    color: '#795548',
  },
  '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b': {
    name: 'Combustible',
    color: '#607d8b',
  },
  '4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9c': {
    name: 'Parking',
    color: '#ff5722',
  },
  '5o6p7q8r-9s0t-1u2v-3w4x-5y6z7a8b9c0d': {
    name: 'Regalos',
    color: '#4caf50',
  },
  '6p7q8r9s-0t1u-2v3w-4x5y-6z7a8b9c0d1e': {
    name: 'Farmacia',
    color: '#ffeb3b',
  },
  '7q8r9s0t-1u2v-3w4x-5y6z-7a8b9c0d1e2f': {
    name: 'Familia',
    color: '#e91e63',
  },
  '8r9s0t1u-2v3w-4x5y-6z7a-8b9c0d1e2f3g': {
    name: 'Transporte',
    color: '#2196f3',
  },
  '9s0t1u2v-3w4x-5y6z-7a8b-9c0d1e2f3g4h': {
    name: 'Videojuegos',
    color: '#9c27b0',
  },
  '0t1u2v3w-4x5y-6z7a-8b9c-0d1e2f3g4h5i': {
    name: 'Tecnologia',
    color: '#00bcd4',
  },
  '1u2v3w4x-5y6z-7a8b-9c0d-1e2f3g4h5i6j': {
    name: 'Supermercado',
    color: '#8bc34a',
  },
  '2v3w4x5y-6z7a-8b9c-0d1e-2f3g4h5i6j7k': {
    name: 'Piso',
    color: '#ffc107',
  },
  '3w4x5y6z-7a8b-9c0d-1e2f-3g4h5i6j7k8l': {
    name: 'Hipoteca',
    color: '#ff9800',
  },
  '9c0d1e2f-3g4h-5i6j-7k8l-9m0n1o2p3q4r': {
    name: 'Alquiler',
    color: '#aea439ff',
  },
  '4x5y6z7a-8b9c-0d1e-2f3g-4h5i6j7k8l9m': {
    name: 'Comunidad',
    color: '#3a8db7ff',
  },
  '5y6z7a8b-9c0d-1e2f-3g4h-5i6j7k8l9m0n': {
    name: 'Prestamos',
    color: '#795548',
  },
  '6z7a8b9c-0d1e-2f3g-4h5i-6j7k8l9m0n1o': {
    name: 'Seguros',
    color: '#607d8b',
  },
  '7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p': {
    name: 'Necesidad',
    color: '#228b22',
  },
  '8b9c0d1e-2f3g-4h5i-6j7k-8l9m0n1o2p3q': {
    name: 'Capricho',
    color: '#6e419bff',
  },
  'f47ac10b-58cc-4372-a567-0e02b2c3d479': {
    name: 'Compras Hogar',
    color: '#aea439ff',
  },

}

export const categories: RequestHandler = (req, res, next) => {
  res.status(200).json({ data: {
    categories: {
      ...defaultCategory,
      ...restCategories
    },
    defaultCategory: defaultCategoryId,
  } });
};
