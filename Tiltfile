k8s_yaml(
    helm(
        'helm/tezos-api-gateway',
        values=['./helm/tezos-api-gateway/values-dev.yaml'],
        name="tag",
    )
)
docker_build('registry.gitlab.com/the-blockchain-xdev/xdev-product/enterprise-business-network/tezos-api-gateway', '.')
