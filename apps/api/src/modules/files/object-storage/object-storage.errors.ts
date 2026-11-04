export class ObjectNotFoundError extends Error {
  constructor() {
    super('Object not found');
    this.name = ObjectNotFoundError.name;
  }
}

export class ObjectStorageError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = ObjectStorageError.name;
  }
}
