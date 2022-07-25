# CREATE VAULT KEYS AND ACTIVATE THE CORRESPONDING TEZOS ACCOUNT SCRIPTS

### ABOUT

This is a simple script that creates the Vault keys (which are mentioned in the `VAULT_KEYS` environment variable) and activate tezos accounts corresponding to the vault keys.

### HOW TO USE THIS SCRIPT TO ACTIVATE A TEZOS ACCOUNT WITH VAULT KEY

#### STEP 1

- Create a faucet account by smartpy wallet (this account is used to transfer tz to the upcoming accounts) :

1. Go on this link: https://smartpy.io/wallet.html
2. Choose tab **Faucet Accounts** then **Faucet Importers**, then follow the step.
3. From the **Faucet Importers**, step 3, copy the private key
4. Set the private key as the env var `TEZOS_PRIVATE_KEY`
5. Activate and reveal the faucet account

#### STEP 2

- Using the script:

1. Set the correct `VAULT_URL` which points to vault server
2. Set the correct `VAULT_TOKEN` env var which is used to access the vault server
3. Make sure `TEZOS_PRIVATE_KEY` are set (this is the private key of the faucet account created above)
4. Set a list of vault keys `VAULT_KEYS` that is going to be created, separate each key by commas `,`.
5. You can set the transfer amount (which will be transferred from faucet account to vault accounts) by setting this env var `TRANSFER_AMOUNT`. The default is 100 tz.
6. (**_Optional_**) Build the project: `npm run build`
7. Run the script: `node build/src/scripts/activate-tezos-account/main.js | bunyan`
