export class ClientError extends Error {
  private _status: number;

  constructor({ message, status }: { message: string; status: number }) {
    super(message);
    this._status = status;
  }

  public get status() {
    return this._status;
  }
}
