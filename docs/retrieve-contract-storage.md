## HOW TO RETRIEVE SMART CONTRACT STORAGE

### To retrieve the whole storage

Use the API: `/api/teozs_node/storage/{smart_contract_address}`
without the request body parameter **_dataFields_**

### To retrieve partial of storage

**1. Receive simple data, the whole map or big map id**

- **_dataFields_** elements type is string which leads to the data

<u>**_Example_**</u>:

<u>_Storage_</u>

```json
{
  "LPMembers": [],
  "balances": {
    "type": "big_map",
    "value": "19134"
  },
  "investors": [
    "tz1KgzuPmBDjmhJg5sC6zB2jLKhs7qPykyau",
    "tz1PN2Qzw1sgoeqZmnXaqwAcuRn6vx2Ah7uN",
    "tz1YNyxeEZuZsTKgFcKeNnaXB1pdCZk9j9rN",
    "tz1dNmUYy1St1mSNX5bWEkAYnCTqL36sAQiW",
    "tz1gWSmbRuEgzMdAdVNKhTKmBtcRayHMHSQQ"
  ],
  "lambdaEntryPoints": {
    "type": "big_map",
    "value": "19135"
  },
  "lastDivYear": 0,
  "lastNavDate": 1615503600000,
  "nav": {
    "type": "big_map",
    "value": "19136"
  },
  "owner": "KT1SEmXhMJAFV7PKCA9oi1uHkn5H9P75rwNF",
  "paused": false,
  "roles": ["ADVISOR", "ELECTED_INVESTOR", "INVESTOR", "MANAGEMENT_COMPANY"],
  "totalIncome": 132900,
  "totalInvDiv": 103230,
  "totalInvested": 99600,
  "totalLPDiv": 8470,
  "totalSupply": 3000
}
```

Only get the big map **nav**, list **investors** and number **totalIncome**.

```json
{ "dataFields": ["totalIncome", "investors", "nav"] }
```

<u>_Result_</u>

```json
{
  "totalIncome": 132900,
  "investors": [
    "tz1KgzuPmBDjmhJg5sC6zB2jLKhs7qPykyau",
    "tz1PN2Qzw1sgoeqZmnXaqwAcuRn6vx2Ah7uN",
    "tz1YNyxeEZuZsTKgFcKeNnaXB1pdCZk9j9rN",
    "tz1dNmUYy1St1mSNX5bWEkAYnCTqL36sAQiW",
    "tz1gWSmbRuEgzMdAdVNKhTKmBtcRayHMHSQQ"
  ],
  "nav": {
    "type": "big_map",
    "value": "19136"
  }
}
```

**2. Access to map/big map in the storage**

- **_dataFields_** elements type is an object whose key is the **_map name_**, and value is **_an array of object_**.
  This object contains 2 keys whose name are **_key_** (map key) and **_dataFields_** (to access the data if map value is an object/map again).

<u>_Storage_</u>

```json
{
  "accessRequests": {
    "type": "big_map",
    "value": "59822"
  },
  "organizations": {
    "type": "map",
    "size": 2,
    "value": [
      {
        "key": {
          "address": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw",
          "jwtToken": "jwt"
        },
        "value": {
          "datasources": {
            "type": "map",
            "size": 3,
            "value": [
              {
                "key": "datasource4",
                "value": "value4"
              },
              {
                "key": "datasource5",
                "value": "value5"
              },
              {
                "key": "datasource6",
                "value": "value6"
              }
            ]
          },
          "name": "tata",
          "publicKey": "tata public key",
          "publicKeyHash": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw"
        }
      },
      {
        "key": {
          "address": "tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK",
          "jwtToken": "jwt"
        },
        "value": {
          "datasources": {
            "type": "map",
            "size": 3,
            "value": [
              {
                "key": "datasource1",
                "value": "value1"
              },
              {
                "key": "datasource2",
                "value": "value2"
              },
              {
                "key": "datasource3",
                "value": "value3"
              }
            ]
          },
          "name": "toto",
          "publicKey": "toto public key",
          "publicKeyHash": "tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK"
        }
      }
    ]
  }
}
```

<u>**_Example 1_**</u>:
Only get the big map **accessRequests** with the key `{ "scopeId": "scope1", "status": "status1" }`

```json
{
  "dataFields": [
    {
      "accessRequests": [
        {
          "key": {
            "scopeId": "scope1",
            "status": "status1"
          }
        }
      ]
    }
  ]
}
```

<u>_Result_</u>

```json
{
  "accessRequests": [
    {
      "key": {
        "scopeId": "scope1",
        "status": "status1"
      },
      "value": {
        "address": {
          "providerAddress": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw",
          "requesterAddress": "tz1XByDAXZZVEAb6HPxTBsPPaEbHvtPVXmhK"
        },
        "createdAt": "2019-10-22T16:27:54.000Z",
        "jwtToken": "jwtToken"
      }
    }
  ]
}
```

<u>**_Example 2_**</u>: Only get the value of the key `datasource4` in `datasources` map, of the key `{ "address": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw", "jwtToken": "jwt" }` and `name` field in `organizations` map of the storage

```json
{
  "dataFields": [
    {
      "organizations": [
        {
          "key": {
            "address": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw",
            "jwtToken": "jwt"
          },
          "dataFields": [
            "name",
            {
              "datasources": [
                {
                  "key": "datasource4"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

<u>_Result_</u>

```json
{
  "organizations": [
    {
      "key": {
        "address": "tz1SCHPVsh2xvNWJSUSqkn3Hf7ri6d3FUjqw",
        "jwtToken": "jwt"
      },
      "value": {
        "name": "tata",
        "datasources": [
          {
            "key": "datasource4",
            "value": "value4"
          }
        ]
      }
    }
  ]
}
```
