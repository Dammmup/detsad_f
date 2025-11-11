// Базовые типы для фронтенда

export interface IBaseEntity {
  createdAt?: string;
  updatedAt?: string;
}

export interface IBaseEntityWithId {
  _id?: string;
  id?: string;
}
