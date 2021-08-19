#!/usr/bin/env python

k8s_yaml(
    helm(
        'helm/tezos-api-gateway',
        values=['./helm/tezos-api-gateway/values-dev.yaml'],
        name="tag",
    )
)
docker_build('registry.gitlab.com/xdev-tech/xdev-enterprise-business-network/tezos-api-gateway', '.')
k8s_resource('tag-rabbitmq', port_forwards=['15672', '5672'])
k8s_resource('tag-api', port_forwards='3333')
k8s_resource('tag-vault', port_forwards='8300')
k8s_resource('tag-db', port_forwards='5432')

local_resource('helm lint',
               'docker run --rm -t -v $PWD:/app registry.gitlab.com/the-blockchain-xdev/xdev-product/build-images/helm:develop' +
               ' lint helm/tezos-api-gateway --values helm/tezos-api-gateway/values-dev.yaml',
               'helm/tezos-api-gateway/')
