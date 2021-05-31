export class UndefinedUserIdError extends Error {
  constructor(address: string) {
    super(`User id regarding this address ${address} is undefined`);
  }
}
