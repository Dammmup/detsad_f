export interface IBaseEntity {
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IBaseEntityWithId {
  _id?: string;
  id?: string;
}

export interface BaseRecord extends IBaseEntity, IBaseEntityWithId { }
