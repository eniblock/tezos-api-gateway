k8s_yaml(
    helm(
        'helm/tezos-api-gateway',
        values=['./helm/tezos-api-gateway/values-dev.yaml'],
        name="tag",
    )
)
docker_build('registry.gitlab.com/xdev-tech/xdev-enterprise-business-network/tezos-api-gateway', '.')

# k8s_resource("tag-api", port_forwards=3333)
# k8s_resource("tag-vault", port_forwards=8200)
# k8s_resource("tag-db", port_forwards=5432)
# k8s_resource("tag-rabbitmq", port_forwards=5672)