{{/*
Expand the name of the chart.
*/}}
{{- define "tezos-api-gateway.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name equals chart name it will be used as a full name.
*/}}
{{- define "tezos-api-gateway.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if eq $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "tezos-api-gateway.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "tezos-api-gateway.labels" -}}
helm.sh/chart: {{ include "tezos-api-gateway.chart" . }}
{{ include "tezos-api-gateway.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "tezos-api-gateway.selectorLabels" -}}
app.kubernetes.io/name: {{ include "tezos-api-gateway.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "tezos-api-gateway.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "tezos-api-gateway.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{- define "imagePullSecret" }}
{{- with .Values.imageCredentials }}
{{- printf "{\"auths\":{\"%s\":{\"username\":\"%s\",\"password\":\"%s\",\"email\":\"%s\",\"auth\":\"%s\"}}}" .registry .username .password .email (printf "%s:%s" .username .password | b64enc) | b64enc }}
{{- end }}
{{- end }}

{{/*
Create secret data with automatic initialization
Parameter: [$, Secret name, [Secret key 1, Secret key 2, ...]]
*/}}
{{- define "tezos-api-gateway.automaticSecret" -}}
{{- $ := index . 0 -}}
{{- $name := index . 1 -}}
{{- $keys := index . 2 -}}
{{- $secretLength := 20 }}
{{- if and (hasKey $.Values.global "dev") ($.Values.global.dev) }}
{{- range $keys }}
{{ . }}: {{ printf "%s-%s" $name . | sha256sum | trunc $secretLength | b64enc | quote }}
{{- end }}
{{- else if $.Release.IsUpgrade }}
{{- range $keys }}
{{ . }}: {{ index (lookup "v1" "Secret" $.Release.Namespace $name).data . }}
{{- end }}
{{- else }}
{{- range $keys }}
{{ . }}: {{ randAlphaNum $secretLength | b64enc | quote }}
{{- end }}
{{- end }}
{{- end }}
