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
  }
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
