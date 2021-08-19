#!/usr/bin/env python

if config.tilt_subcommand == 'up':
    # check that registry gitlab secrets are properly configured and login with helm
    docker_config = decode_json(local('clk k8s -c ' + k8s_context() + ' docker-credentials -hd gitlab-registry', quiet=True))
    os.environ['CI_JOB_TOKEN'] = docker_config['registry.gitlab.com']['password']

    # update the helm package dependencies a first time at startup, so helm can load the helm chart
    local('clk k8s -c ' + k8s_context() + ' helm-dependency-update helm/tezos-api-gateway')

# manually download the dependencies
local_resource('helm dependencies',
               'clk k8s -c ' + k8s_context() + ' helm-dependency-update helm/tezos-api-gateway -ft Tiltfile',
               trigger_mode=TRIGGER_MODE_MANUAL, auto_init=False)

config.define_bool("no-volumes")
cfg = config.parse()

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
               'docker run --rm -t -v $PWD:/app registry.gitlab.com/the-blockchain-xdev/xdev-product/build-images/helm:1.2.0' +
               ' lint helm/tezos-api-gateway --values helm/tezos-api-gateway/values-dev.yaml',
               'helm/tezos-api-gateway/')

if config.tilt_subcommand == 'down' and not cfg.get("no-volumes"):
  local('kubectl --context ' + k8s_context() + ' delete pvc --selector=app.kubernetes.io/instance=tag --wait=false')
