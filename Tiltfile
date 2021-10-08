#!/usr/bin/env python

config.define_bool("no-volumes")
config.define_bool('dev')
cfg = config.parse()

clk_k8s = 'clk --force-color k8s -c ' + k8s_context() + ' '

load('ext://kubectl_build', 'image_build', 'kubectl_build_registry_secret', 'kubectl_build_enable')
kubectl_build_registry_secret('gitlab-registry')
kubectl_build_enable(local(clk_k8s + 'features --field value --format plain kubectl_build'))

if config.tilt_subcommand == 'up':
    # update the helm package dependencies a first time at startup, so helm can load the helm chart
    local(clk_k8s + 'helm-dependency-update helm/tezos-api-gateway')

# manually download the dependencies
local_resource('helm dependencies',
               clk_k8s + 'helm-dependency-update helm/tezos-api-gateway -ft Tiltfile',
               trigger_mode=TRIGGER_MODE_MANUAL, auto_init=False)

k8s_yaml(
    helm(
        'helm/tezos-api-gateway',
        values=['./helm/tezos-api-gateway/values-dev.yaml'],
        name="tag",
    )
)

extra_build_opts = {}
if cfg.get('dev'):
    extra_build_opts.update(dict(
        target='dev',
        live_update=[
            sync('src', '/usr/src/app/src'),
            run('cd /usr/src/app && npm ci',
            trigger=['./package.json', './package.lock']),
        ]
    ))
image_build('registry.gitlab.com/xdev-tech/xdev-enterprise-business-network/tezos-api-gateway', '.', **extra_build_opts)
k8s_resource('tag-rabbitmq', port_forwards=['15672', '5672'])
k8s_resource('tag-api', port_forwards=['3333', '9229:9229'], resource_deps=['tag-rabbitmq'])
k8s_resource('tag-vault', port_forwards='8300')
k8s_resource('tag-db', port_forwards='5432')
k8s_resource('tag-send-transactions-worker', resource_deps=['tag-rabbitmq', 'tag-api'], port_forwards="9230:9229")
k8s_resource('tag-injection-worker', resource_deps=['tag-rabbitmq', 'tag-send-transactions-worker'], port_forwards="9231:9229")
k8s_resource('tag-operation-status-worker', resource_deps=['tag-rabbitmq', 'tag-injection-worker'], port_forwards="9232:9229")

local_resource('helm lint',
               'docker run --rm -t -v $PWD:/app registry.gitlab.com/xdev-tech/build/helm:2.0' +
               ' lint helm/tezos-api-gateway --values helm/tezos-api-gateway/values-dev.yaml',
               'helm/tezos-api-gateway/', allow_parallel=True)

if config.tilt_subcommand == 'down' and not cfg.get("no-volumes"):
  local('kubectl --context ' + k8s_context() + ' delete pvc --selector=app.kubernetes.io/instance=tag --wait=false')
