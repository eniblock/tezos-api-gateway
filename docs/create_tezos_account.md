## HOW TO CREATE A TEZOS ACCOUNT AND IMPORT AN EXISTING ONE TO ACTIVATE IT

Use the API: `/api/user/create`
with the following request body `{"userIdList": ["account_id_1", "account_id_2"...], "secureKeyName": "key_id"}`

- **_userIdList_** contains the string identifiers of the accounts to be created
- **_secureKeyName_** is the id of the Tezos account that will sign the accounts' activation transactions

So how to import the **_secureKey_** key in Vault, the keystore database?

### How to import an existing Tezos account in vault

### Issue Description

Vault allows creating keys without revealing secrets (private key). After that, these keys are used inside Vault to sign data, verify signatures, etc.

Importing keys is an important feature in the scope of TezosApiGateway in order to sign Tezos transactions with accounts that are already activated, and have some XTZ in the balance.

The problem here is that for security reasons, Vault doesn’t allow private key importing.

However, Vault offers a feature of backup/restore that we will use in this tutorial to import an account.

###Key Importing Steps
The Tezos account that is going to be imported as an example:

`{ "publicKey": "edpkunY3jsNhGnP3mkYnWmBTYxqjSii1pyY9oUSkNnix3pNHRTMaAc", "secretKey": "edskS6oof64x1Uj2ZdDRj8a5WVJmKxDX2VbiPmVJHoydxFQ3eZpLk8mhMvz1Lnozsw1KggcCjfMdYZYN6oPQJh3dRSmeaQ9MEG", "publicKeyHash": "tz1QdgwqsVV7SmpFPrWjs9B5oBNcj2brzqfG" }`

The account must have a non-null balance of Tez. It could be a faucet account in the context of test networks.

The public and private keys are in the Tezos prefixed base58 format. To be imported in Vault, they have to be encoded in base64.

####Prerequisites

- Environment: ubuntu 18.04
- **_vault_** CLI tool
- **_base58_** CLI tool (which is downloadable with `sudo snap install base58`)
- The bash commands **_base64_**, **_xxd_**, and **_tr_**.

#### Convert keys from base58 to base64

- Decode key (-c to remove checksum at the end): `base58 -c -d`

- encode to a hexadecimal string: `xxd -p -c 1000`

- remove useless prefix (4 bytes = 8 hex characters): `sed 's/^.{8}//g'`

- decode hex string: `xxd -r -p`

- encode in base64: `base64`

- inline the result: `tr -d '\n'`

Full commands:

```
PUBLIC_KEY=`echo "edpkunY3jsNhGnP3mkYnWmBTYxqjSii1pyY9oUSkNnix3pNHRTMaAc" | base58 -d -c | xxd -p -c 1000 | sed 's/^.\{8\}//g' | xxd -r -p | base64 | tr -d '\n'`
```

```
PRIVATE_KEY=`echo "edskS6oof64x1Uj2ZdDRj8a5WVJmKxDX2VbiPmVJHoydxFQ3eZpLk8mhMvz1Lnozsw1KggcCjfMdYZYN6oPQJh3dRSmeaQ9MEG" | base58 -c -d | xxd -p -c 1000 | sed 's/^.\{8\}//g' | xxd -r -p | base64 | tr -d '\n'`
```

#### Format backup object

object template:

```
{"policy":{"name":"ahmed","keys":{"1":{"key":"$PRIVATE_KEY","hmac_key":"vIeCF/XQkefiuNXKtmBKAQRjLwbkIiQyw21n9w3pBAI=","time":"2021-04-26T14:01:57.185354936Z","ec_x":null,"ec_y":null,"ec_d":null,"rsa_key":null,"public_key":"$PUBLIC_KEY","convergent_version":0,"creation_time":1619445717}},"derived":false,"kdf":0,"convergent_encryption":false,"exportable":true,"min_decryption_version":1,"min_encryption_version":0,"latest_version":1,"archive_version":1,"archive_min_version":0,"min_available_version":0,"deletion_allowed":false,"convergent_version":0,"type":2,"backup_info":{"time":"2021-04-26T14:02:23.688590588Z","version":1},"restore_info":null,"allow_plaintext_backup":true,"version_template":"","storage_prefix":""},"archived_keys":{"keys":[{"key":null,"hmac_key":null,"time":"0001-01-01T00:00:00Z","ec_x":null,"ec_y":null,"ec_d":null,"rsa_key":null,"public_key":"","convergent_version":0,"creation_time":0},{"key":"$PRIVATE_KEY","hmac_key":"vIeCF/XQkefiuNXKtmBKAQRjLwbkIiQyw21n9w3pBAI=","time":"2021-04-26T14:01:57.185354936Z","ec_x":null,"ec_y":null,"ec_d":null,"rsa_key":null,"public_key":"$PUBLIC_KEY","convergent_version":0,"creation_time":1619445717}]}}
```

The object is to be filled with PRIVATE_KEY and PUBLIC_KEY and then encoded in base64.

Full Command:

```
BACKUP=`echo "{\"policy\":{\"name\":\"ahmed\",\"keys\":{\"1\":{\"key\":\""$PRIVATE_KEY"\",\"hmac_key\":\"vIeCF/XQkefiuNXKtmBKAQRjLwbkIiQyw21n9w3pBAI=\",\"time\":\"2021-04-26T14:01:57.185354936Z\",\"ec_x\":null,\"ec_y\":null,\"ec_d\":null,\"rsa_key\":null,\"public_key\":\""$PUBLIC_KEY"\",\"convergent_version\":0,\"creation_time\":1619445717}},\"derived\":false,\"kdf\":0,\"convergent_encryption\":false,\"exportable\":true,\"min_decryption_version\":1,\"min_encryption_version\":0,\"latest_version\":1,\"archive_version\":1,\"archive_min_version\":0,\"min_available_version\":0,\"deletion_allowed\":false,\"convergent_version\":0,\"type\":2,\"backup_info\":{\"time\":\"2021-04-26T14:02:23.688590588Z\",\"version\":1},\"restore_info\":null,\"allow_plaintext_backup\":true,\"version_template\":\"\",\"storage_prefix\":\"\"},\"archived_keys\":{\"keys\":[{\"key\":null,\"hmac_key\":null,\"time\":\"0001-01-01T00:00:00Z\",\"ec_x\":null,\"ec_y\":null,\"ec_d\":null,\"rsa_key\":null,\"public_key\":\"\",\"convergent_version\":0,\"creation_time\":0},{\"key\":\""$PRIVATE_KEY"\",\"hmac_key\":\"vIeCF/XQkefiuNXKtmBKAQRjLwbkIiQyw21n9w3pBAI=\",\"time\":\"2021-04-26T14:01:57.185354936Z\",\"ec_x\":null,\"ec_y\":null,\"ec_d\":null,\"rsa_key\":null,\"public_key\":\""$PUBLIC_KEY"\",\"convergent_version\":0,\"creation_time\":1619445717}]}}" | base64 | tr -d '\n'`
```

#### Run Restore Command

```
vault write transit/restore/master backup=\$BACKUP
```

You may need to configure Vault with:
`export VAULT_ADDR='http://127.0.0.1:8300'` # example of URL
`vault login` # you will log in using your token

### Final command example

```
vault write transit/restore/<key_name> backup=eyJwb2xpY3kiOnsibmFtZSI6ImFobWVkIiwia2V5cyI6eyIxIjp7ImtleSI6IjNCWXEwN3lxZnpaeURJcTFNVlBGVHl1L3d6OXM5aDlRcUloVWhLdWkzZkdXa2ZJcXhlN0FZRmx6TDBoekc1eERNMmZNSllleGNFSElqaXhTQ1JESlN3PT0iLCJobWFjX2tleSI6InZJZUNGL1hRa2VmaXVOWEt0bUJLQVFSakx3YmtJaVF5dzIxbjl3M3BCQUk9IiwidGltZSI6IjIwMjEtMDQtMjZUMTQ6MDE6NTcuMTg1MzU0OTM2WiIsImVjX3giOm51bGwsImVjX3kiOm51bGwsImVjX2QiOm51bGwsInJzYV9rZXkiOm51bGwsInB1YmxpY19rZXkiOiJscEh5S3NYdXdHQlpjeTlJY3h1Y1F6Tm56Q1dIc1hCQnlJNHNVZ2tReVVzPSIsImNvbnZlcmdlbnRfdmVyc2lvbiI6MCwiY3JlYXRpb25fdGltZSI6MTYxOTQ0NTcxN319LCJkZXJpdmVkIjpmYWxzZSwia2RmIjowLCJjb252ZXJnZW50X2VuY3J5cHRpb24iOmZhbHNlLCJleHBvcnRhYmxlIjp0cnVlLCJtaW5fZGVjcnlwdGlvbl92ZXJzaW9uIjoxLCJtaW5fZW5jcnlwdGlvbl92ZXJzaW9uIjowLCJsYXRlc3RfdmVyc2lvbiI6MSwiYXJjaGl2ZV92ZXJzaW9uIjoxLCJhcmNoaXZlX21pbl92ZXJzaW9uIjowLCJtaW5fYXZhaWxhYmxlX3ZlcnNpb24iOjAsImRlbGV0aW9uX2FsbG93ZWQiOmZhbHNlLCJjb252ZXJnZW50X3ZlcnNpb24iOjAsInR5cGUiOjIsImJhY2t1cF9pbmZvIjp7InRpbWUiOiIyMDIxLTA0LTI2VDE0OjAyOjIzLjY4ODU5MDU4OFoiLCJ2ZXJzaW9uIjoxfSwicmVzdG9yZV9pbmZvIjpudWxsLCJhbGxvd19wbGFpbnRleHRfYmFja3VwIjp0cnVlLCJ2ZXJzaW9uX3RlbXBsYXRlIjoiIiwic3RvcmFnZV9wcmVmaXgiOiIifSwiYXJjaGl2ZWRfa2V5cyI6eyJrZXlzIjpbeyJrZXkiOm51bGwsImhtYWNfa2V5IjpudWxsLCJ0aW1lIjoiMDAwMS0wMS0wMVQwMDowMDowMFoiLCJlY194IjpudWxsLCJlY195IjpudWxsLCJlY19kIjpudWxsLCJyc2Ffa2V5IjpudWxsLCJwdWJsaWNfa2V5IjoiIiwiY29udmVyZ2VudF92ZXJzaW9uIjowLCJjcmVhdGlvbl90aW1lIjowfSx7ImtleSI6IjNCWXEwN3lxZnpaeURJcTFNVlBGVHl1L3d6OXM5aDlRcUloVWhLdWkzZkdXa2ZJcXhlN0FZRmx6TDBoekc1eERNMmZNSllleGNFSElqaXhTQ1JESlN3PT0iLCJobWFjX2tleSI6InZJZUNGL1hRa2VmaXVOWEt0bUJLQVFSakx3YmtJaVF5dzIxbjl3M3BCQUk9IiwidGltZSI6IjIwMjEtMDQtMjZUMTQ6MDE6NTcuMTg1MzU0OTM2WiIsImVjX3giOm51bGwsImVjX3kiOm51bGwsImVjX2QiOm51bGwsInJzYV9rZXkiOm51bGwsInB1YmxpY19rZXkiOiJscEh5S3NYdXdHQlpjeTlJY3h1Y1F6Tm56Q1dIc1hCQnlJNHNVZ2tReVVzPSIsImNvbnZlcmdlbnRfdmVyc2lvbiI6MCwiY3JlYXRpb25fdGltZSI6MTYxOTQ0NTcxN31dfX0K
```

> :warning: For local environment a user is already created with the Key name "admin"
