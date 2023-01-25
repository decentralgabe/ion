FROM 'gabetbd/ion:1.0.5'

COPY mainnet-bitcoin-config.json /config/mainnet-bitcoin-config.json
COPY mainnet-bitcoin-versioning.json /config/mainnet-bitcoin-versioning.json

ENV ION_BITCOIN_CONFIG_FILE_PATH=/config/docker-mainnet-bitcoin-config.json
ENV ION_BITCOIN_VERSIONING_CONFIG_FILE_PATH=/config/mainnet-bitcoin-versioning.json
ENV ION_DATA_VOLUME=/data/bitcoin