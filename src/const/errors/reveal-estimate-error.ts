export class RevealEstimateError extends Error {
  constructor(address: string, publicKey: string) {
    super(
      `Ensure that the address ${address} is activated and is related to the public key ${publicKey}`,
    );
  }
}
