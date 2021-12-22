import smartpy as sp


operator_param_type = sp.TRecord(
    operator = sp.TAddress,
    owner = sp.TAddress,
    token_id = sp.TNat
    )

update_operators_params_type = sp.TList(
    sp.TVariant(
        add_operator = operator_param_type,
        remove_operator = operator_param_type
        )
    )


class Single_Entrypoint_Contract(sp.Contract):
    def __init__(self):
        self.init(
            parameters = {}
        )

    @sp.entry_point
    def single_entry(self, params):
        sp.set_type(params, update_operators_params_type)
        self.data.parameters[0] = params


# Tests
@sp.add_test(name = "SingleEntrypointContract")
def test():

    scenario = sp.test_scenario()

    c0 = Single_Entrypoint_Contract()
    scenario += c0
