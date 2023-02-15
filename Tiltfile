#!/usr/bin/env python

config.define_bool("no-volumes")
cfg = config.parse()

clk_k8s = 'clk -a --force-color k8s -c ' + k8s_context() + ' '

load('ext://kubectl_build', 'image_build', 'kubectl_build_registry_secret', 'kubectl_build_enable')
kubectl_build_registry_secret('gitlab-registry')
kubectl_build_enable(local(clk_k8s + 'features --field value --format plain kubectl_build'))

if config.tilt_subcommand == 'up':
    # update the helm package dependencies a first time at startup, so helm can load the helm chart
    local(clk_k8s + 'helm dependency-update helm/tezos-api-gateway')

# manually download the dependencies
local_resource('helm dependencies',
               clk_k8s + 'helm dependency-update helm/tezos-api-gateway -ft Tiltfile',
               trigger_mode=TRIGGER_MODE_MANUAL, auto_init=False)

k8s_yaml(
    helm(
        'helm/tezos-api-gateway',
        values=['./helm/tezos-api-gateway/values-dev.yaml'],
        name="tag",
    )
)
image_build('registry.gitlab.com/xdev-tech/xdev-enterprise-business-network/tezos-api-gateway', '.')
k8s_resource('tag-rabbitmq', port_forwards=['15672', '5672'])
k8s_resource('tag-api', port_forwards='3333', resource_deps=['tag-rabbitmq'])
k8s_resource('tag-vault', port_forwards='8300')
k8s_resource('tag-db', port_forwards='5432')
k8s_resource('tag-send-transactions-worker', resource_deps=['tag-rabbitmq'])
k8s_resource('tag-injection-worker', resource_deps=['tag-rabbitmq'])
k8s_resource('tag-operation-status-worker', resource_deps=['tag-rabbitmq'])

local_resource('helm lint',
               'docker run --rm -t -v $PWD:/app registry.gitlab.com/xdev-tech/build/helm:1.5' +
               ' lint helm/tezos-api-gateway --values helm/tezos-api-gateway/values-dev.yaml',
               'helm/tezos-api-gateway/', allow_parallel=True)

if config.tilt_subcommand == 'down' and not cfg.get("no-volumes"):
  local('kubectl --context ' + k8s_context() + ' delete pvc --selector=app.kubernetes.io/instance=tag --wait=false')
