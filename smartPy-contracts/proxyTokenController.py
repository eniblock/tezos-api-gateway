import smartpy as sp

################## FA2 Entrypoint parameters types ##################

contract_metadata_type = sp.TRecord(
    k = sp.TString,
    v= sp.TBytes
    )

operator_param_type = sp.TRecord(
    owner = sp.TAddress,
    operator = sp.TAddress,
    token_id = sp.TNat
    )

update_operators_params_type = sp.TList(
    sp.TVariant(
        add_operator = operator_param_type,
        remove_operator = operator_param_type
        )
    )

transfer_type = sp.TRecord(
    from_ = sp.TAddress,
    txs = sp.TList(
        sp.TRecord(
            to_ = sp.TAddress,
            token_id = sp.TNat,
            amount = sp.TNat
            ).layout(("to_", ("token_id", "amount")))
        )
    ).layout(("from_", "txs"))

transfer_params_type = sp.TList(transfer_type)

batch_mint_params_type = sp.TRecord(
    metadata_links = sp.TList(sp.TBytes),
    first_token_id = sp.TNat,
    address = sp.TAddress
    )

token_metadata_type = sp.TMap(sp.TString, sp.TBytes)

mint_params_type = sp.TRecord(
    token_id = sp.TNat,
    amount = sp.TNat,
    address = sp.TAddress,
    metadata = token_metadata_type
    )

fa2_params_types = {
    "mint": mint_params_type,
    "update_operators": update_operators_params_type,
    "transfer": transfer_params_type,
    "set_pause": sp.TBool,
    "set_metadata": contract_metadata_type,
    "set_administrator": sp.TAddress,
    "batch_mint": batch_mint_params_type
    }

################## Proxy types ##################

multisig_build_params_type = sp.TRecord(
    multisig_id = sp.TString,
    signers = sp.TList(sp.TAddress),
    build_and_sign = sp.TBool,
    call_params = sp.TRecord(
        target_address = sp.TAddress,
        entry_point = sp.TString,
        parameters = sp.TVariant(
            mint = sp.TRecord(mint_params = mint_params_type, operator = sp.TOption(sp.TAddress)),
            update_operators = update_operators_params_type,
            transfer = transfer_params_type,
            set_pause = sp.TBool,
            set_metadata = contract_metadata_type,
            set_administrator = sp.TAddress,
            batch_mint = sp.TRecord(batch_mint_params = batch_mint_params_type, operator = sp.TOption(sp.TAddress))
            )
        )
    )

rule_type = sp.TRecord(
    template_id = sp.TNat,
    authorized_builders = sp.TSet(sp.TString) # group names
)

template_type = sp.TRecord(
    contract_threshold = sp.TNat,
    groups = sp.TMap(sp.TString, sp.TRecord(group_threshold = sp.TNat, group_weight = sp.TNat))
)

update_groups_type = sp.TList(
    sp.TVariant(
            add = sp.TMap(sp.TString, sp.TAddress),
            remove = sp.TMap(sp.TString, sp.TAddress)
    )
)
update_templates_type = sp.TList(
    sp.TVariant(
            update = sp.TMap(sp.TNat, template_type),
            remove = sp.TList(sp.TNat)
    )
)
update_rules_type = sp.TList(
    sp.TVariant(
            update = sp.TMap(sp.TString, rule_type),
            remove = sp.TList(sp.TString)
    )
)


class ProxyTokenController(sp.Contract):
    def __init__(self, proxy_admins, groups, multisig_templates, rules):
        self.init(
            proxy_admins = sp.set(proxy_admins),
            #nb_multisigs = @TODO consecutive?!?
            groups = sp.map(
                l = groups,
                tkey = sp.TString,
                tvalue = sp.TSet(sp.TAddress)
            ),
            multisig_templates = sp.map(
                l = multisig_templates,
                tkey = sp.TNat,
                tvalue = template_type
            ),
            rules = sp.map(
                l = rules,
                tkey = sp.TString, # entrypoint
                tvalue = rule_type
            )
        )

    @sp.entry_point
    def update_groups(self, params: update_groups_type):
       sp.set_type(params, update_groups_type)

    @sp.entry_point
    def update_templates(self, params: update_templates_type):
        sp.set_type(params, update_templates_type)


    @sp.entry_point
    def update_rules(self, params: update_rules_type):
        sp.set_type(params, update_rules_type)


    # define a multisig contract
    @sp.entry_point
    def build(self, params: multisig_build_params_type):
        sp.set_type(params, multisig_build_params_type)

    # sign a multisig contract
    @sp.entry_point
    def sign(self, params):
        sp.set_type(params, sp.TRecord(id = sp.TAddress, contractId = sp.TString))


# Tests
@sp.add_test(name = "ProxyTokenController")
def test():

    scenario = sp.test_scenario()

    super_fa2_admin1 = sp.address("tz1LzyfRfEhcWsP3x7dkAKeggpDgHgs7Xv8Q")
    super_fa2_admin2 = sp.address("tz1Qgh4hXNgDUght6bC7qu5Q197j67UPt5He")

    super_minter1 = sp.address("tz1SwD4gbWatr6ijuH2gckXYLUd3EV8eYyjg")
    super_minter2 = sp.address("tz1XjzjLQzUwzgf6nG7SSqQ9kM7QHzpUaiMj")

    minter1 = sp.address("tz1V3vb6JJcpwTHyXeVsQaPLXNnuRvtgDYRy")
    minter2 = sp.address("tz1YUPYrChSxZYxyJJX1r5aX3gKSjAz1Uo2U")

    alice = sp.address("tz1YnohXtPBuGi63szJn5ERKdaWY6xeZx3R4")

    batch_minter = sp.address("tz1Z5CDrdmRYC8XBAiHAKwVSenV7XbeSk2bo")

    proxy_admin = sp.address("tz1XxrCBL7RyKFKMMvMG5CHmbc1ubVr7ehHm")

    multisig_builder = sp.address("tz1ZAwL17erX4q7uQy1FVWgkZH9A7AdehYpd")

    target = sp.address("KT1aDD7H3WgbFgd7YeMn8UbqQeMXJ96kxvD5")

    groups = {
        "super_fa2_admins": sp.set([super_fa2_admin1, super_fa2_admin2]),
        "super_minters": sp.set([super_minter1, super_minter2]),
        "minters": sp.set([minter1, minter2]),
        "batch_minters": sp.set([batch_minter]),
        "multisig_builders": sp.set([multisig_builder])
        }

    multisig_templates = {
        0: sp.record(
                contract_threshold = 1,
                groups = {
                    "super_fa2_admins": sp.record(group_threshold = 1, group_weight = 1)
                }
            ),
        1: sp.record(
                contract_threshold = 3,
                groups = {
                    "super_minters": sp.record(group_threshold = 1, group_weight = 1),
                    "minters": sp.record(group_threshold = 2, group_weight = 1),
                    "": sp.record(group_threshold = 1, group_weight = 2)
                }
            ),
        2: sp.record(
                contract_threshold = 1,
                groups = {
                    "batch_minters": sp.record(group_threshold = 1, group_weight = 1)
                }
            )
    }

    rules = {
        "mint": sp.record(
            template_id = 1,
            authorized_builders = sp.set(["multisig_builders", "minters", "super_minters"])
        ),
        "batch_mint": sp.record(
            template_id = 2,
            authorized_builders = sp.set(["multisig_builders", "batch_minters"])
        ),
        "set_administrator": sp.record(
            template_id = 0,
            authorized_builders = sp.set(["super_fa2_admins"])
        ),
        "update_operators": sp.record(
            template_id = 0,
            authorized_builders = sp.set(["super_fa2_admins"])
        ),
        "transfer": sp.record(
            template_id = 0,
            authorized_builders = sp.set(["super_fa2_admins"])
        ),
        "set_pause": sp.record(
            template_id = 0,
            authorized_builders = sp.set(["super_fa2_admins"])
        ),
        "set_metadata": sp.record(
            template_id = 0,
            authorized_builders = sp.set([]) # in order to test if anyone can build when the list is empty
        )
    }

    #PCC
    ## put the real initiator parameters, the contract will be initially deployed with the following parameters
    c0 = ProxyTokenController(
        [proxy_admin],
        groups,
        multisig_templates,
        rules
        )
    scenario += c0
