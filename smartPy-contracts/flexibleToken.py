import smartpy as sp

class ERC20Interface(sp.Contract):
    @sp.entry_point
    def transfer(self, params: sp.TRecord(destination = sp.TAddress, tokens = sp.TNat)):
        """Transfer from an address with x amount of tokens"""
        pass

    @sp.entry_point
    def approve(self, params: sp.TRecord(spender = sp.TAddress, tokens = sp.TNat)):
        """Allows spender to withdraw from your account multiple times, up to the value amount"""
        pass

    @sp.entry_point
    def transferFrom(self, params: sp.TRecord(_from = sp.TAddress, _to = sp.TAddress, tokens = sp.TNat)):
        """Transfers value amount of tokens from address from to address to"""
        pass

class Owned(sp.Contract):
    @sp.entry_point
    def transferOwnerShip(self, addressNewOwner: sp.TAddress):
        self.data.newOwner = sp.some(addressNewOwner)

    @sp.entry_point
    def acceptOwnership(self):
        sp.verify(self.data.owner == sp.sender)
        sp.verify(self.data.newOwner.is_some())
        newOwnerAddress = self.data.newOwner.open_some(message = "Unexpected_error")
        sp.verify(newOwnerAddress != self.data.owner)
        self.data.owner = newOwnerAddress
        self.data.newOwner = sp.none

    def is_owner(self, address: sp.TAddress):
        return self.data.owner == address

class FlexibleToken(ERC20Interface, Owned):
    def __init__(self, _symbol: sp.TString, _name: sp.TString, _decimals: sp.TInt, _initialSupply: sp.TNat, _ownerAddress: sp.TAddress):
        self.init(
            balances = sp.big_map(
                {
                    _ownerAddress: _initialSupply
                }
            ),
            allowed = sp.big_map(
                tkey = sp.TAddress,
                tvalue = sp.TMap(
                    sp.TAddress,
                    sp.TNat
                )
            ),
            symbol = _symbol,
            name = _name,
            decimals = _decimals,
            totalSupply = _initialSupply,
            locked = False,
            owner = _ownerAddress,
            newOwner = sp.some(_ownerAddress)
        )

    def addAddressIfNecessary(self, address):
        sp.if ~ self.data.balances.contains(address):
            self.data.balances[address] = 0

    @sp.entry_point
    def lock(self):
        pass
#         sp.verify(sp.sender == self.data.owner)
#         sp.verify(self.data.locked == False)
#         self.data.locked = True

    @sp.entry_point
    def unlock(self):
        pass
#         sp.verify(sp.sender == self.data.owner)
#         sp.verify(self.data.locked == True)
#         self.data.locked = False

    @sp.entry_point
    def setSymbol(self, symbol: sp.TString):
        sp.verify(sp.sender == self.data.owner)
        sp.verify(~self.data.locked)
        self.data.symbol = symbol;

    @sp.entry_point
    def setName(self, name: sp.TString):
        sp.verify(sp.sender == self.data.owner)
        sp.verify(~self.data.locked)
        self.data.name = name

    @sp.entry_point
    def transfer(self, params: sp.TRecord(destination = sp.TAddress, tokens = sp.TNat)):
        sp.set_type(params, sp.TRecord(destination = sp.TAddress, tokens = sp.TNat))
#         self.addAddressIfNecessary(params.destination)
#         sp.verify((self.is_owner(sp.sender) |
#             ~self.data.locked) &
#                  (self.data.balances[sp.sender] >= params.tokens))
#
#         self.data.balances[sp.sender] = sp.as_nat(self.data.balances[sp.sender] - params.tokens)
#         self.data.balances[params.destination] += params.tokens

    @sp.entry_point
    def approve(self, params: sp.TRecord(spender = sp.TAddress, tokens = sp.TNat)):
        self.data.allowed[sp.sender][params.spender] = params.tokens

    @sp.entry_point
    def transferFrom(self, params):
        sp.set_type(params, sp.TRecord(_from = sp.TAddress, _to = sp.TAddress, tokens = sp.TNat))
        sp.verify(self.is_owner(sp.sender) |
            (~self.data.locked &
                ((params._from == sp.sender) |
                 (self.data.allowed[params._from][sp.sender] >= params.tokens))))
        self.data.balances[params._from] = sp.as_nat(self.data.balances[params._from] - params.tokens)
        self.data.allowed[params._from][sp.sender] = sp.as_nat(self.data.allowed[params._from][sp.sender] - params.tokens)
        self.data.balances[params._to] = self.data.balances[params._to] + params.tokens

@sp.add_test("FlexibleToken")
def test():
    scenario = sp.test_scenario()
    scenario.h1("FlexibleToken test")

    scenario.table_of_contents()

    # sp.test_account generates ED25519 key-pairs deterministically:
    admin = sp.address("tz1hdQscorfqMzFqYxnrApuS5i6QSTuoAp3w")
    alice = sp.test_account("Alice")
    bob   = sp.test_account("Robert")

    # Let's display the accounts:
    scenario.h1("Accounts")
    scenario.show([alice, bob])

    # scenario.show(admin)
    scenario.h1("Contract")
    c1 = FlexibleToken(_symbol = "symbol", _name = "name", _decimals = 10, _initialSupply = 40, _ownerAddress = admin)
    scenario += c1
