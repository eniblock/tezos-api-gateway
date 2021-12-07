import smartpy as sp


organization_type = sp.TRecord(
    name = sp.TString,
    publicKeyHash = sp.TAddress,
    publicKey = sp.TString,
    datasources = sp.TMap(sp.TString,sp.TString)
)

access_request_parameters_type = sp.TRecord(
    id = sp.TString,
    datasourceId = sp.TNat,
    scopeId = sp.TString,
    requesterAddress = sp.TAddress,
    providerAddress = sp.TAddress
)

access_request_key_type = sp.TRecord(
    scopeId = sp.TString,
    status = sp.TString,
);

access_request_value_type = sp.TRecord(
    address = sp.TRecord (
        requesterAddress = sp.TAddress,
        providerAddress = sp.TAddress
    ),
    createdAt = sp.TTimestamp,
    jwtToken = sp.TOption(sp.TString)
)

grant_access_request_type = sp.TRecord(
    id = sp.TString,
    requesterAddress = sp.TAddress,
    providerAddress = sp.TAddress,
    jwtToken = sp.TString
)

organization_key = sp.TRecord(
    account = sp.TAddress,
    jwtToken = sp.TString
)

organization_directory_type = sp.TMap(
    organization_key,
    organization_type
)

access_request_type = sp.TBigMap(access_request_key_type,access_request_value_type)


class AccessManagement(sp.Contract):
    def __init__(self, _org: organization_directory_type, _access: access_request_type):
        self.init(
            organizations = _org,
            accessRequests = _access
        )


@sp.add_test("RequestManagement")
def test():
    scenario = sp.test_scenario()
    scenario.h1("RequestManagement test")

    scenario.table_of_contents()
    admin = sp.test_account("Administrator")

    datasource1 = sp.map({
        'datasource1': 'value1',
        'datasource2': 'value2',
        'datasource3': 'value3',
    })

    datasource2 = sp.map({
        'datasource4': 'value4',
        'datasource5': 'value5',
        'datasource6': 'value6',
    })

    organizations = sp.map(
            {
                sp.record(
                    address = 'tz1Ric9o7YeBvbxXHnxhBMAjaMgKUnHUbYKB',
                    jwtToken = 'jwt'
                    ): sp.record(
                                name = 'toto',
                                publicKeyHash = sp.address('tz1Ric9o7YeBvbxXHnxhBMAjaMgKUnHUbYKB'),
                                publicKey = 'toto public key',
                                datasources = datasource1
                            ),
                sp.record(
                    address = 'tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z',
                    jwtToken = 'jwt'
                    ): sp.record(
                                name = 'tata',
                                publicKeyHash = sp.address('tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z'),
                                publicKey = 'tata public key',
                                datasources = datasource2
                            )
            }
        )

    accessRequest = sp.big_map(
        {
            sp.record(
                scopeId='scope1',
                status='status1'
            ): sp.record(

                    address = sp.record (
                        requesterAddress = sp.address('tz1Ric9o7YeBvbxXHnxhBMAjaMgKUnHUbYKB'),
                        providerAddress = sp.address('tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z')
                    ),
                    createdAt = sp.timestamp(1571761674),
                    jwtToken = sp.some('jwtToken')
                ),

            sp.record(
                scopeId='scope2',
                status='status2'
            ): sp.record(

                    address = sp.record (
                        requesterAddress = sp.address('tz1VbHay2YPpiuPYs8SQHynuW3YvGtNuB29z'),
                        providerAddress = sp.address('tz1Ric9o7YeBvbxXHnxhBMAjaMgKUnHUbYKB')
                    ),
                    createdAt = sp.timestamp(1571761690),
                    jwtToken = sp.none
                )
        }
    )


    # Test if RequestManagement is initialized correctly
    requestManagement = AccessManagement(organizations, accessRequest)
    scenario += requestManagement
