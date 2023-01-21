#!/bin/sh
set -ex

ipfs config --json -- Swarm.ConnMgr '{ "Type": "basic", "LowWater": 600, "HighWater": 900, "GracePeriod": "30s" }'

# https://github.com/ipfs/kubo/issues/9432#issuecomment-1356492093
ipfs config --json -- Swarm.ResourceMgr '{ "Limits": { "System": { "Memory": 1073741824, "FD": 512, "Conns": 1024, "ConnsInbound": 1024, "ConnsOutbound": 1024, "Streams": 16384, "StreamsInbound": 4096, "StreamsOutbound": 16348 } } }'

ipfs config --json -- AutoNAT '{ "ServiceMode": "disabled" }'

# enable read only gateway
ipfs config --json -- Address '{ "Gateway": "/ip4/0.0.0.0/tcp/8080"}'

# https://github.com/ipfs/kubo/blob/master/docs/experimental-features.md#accelerated-dht-client
ipfs config --json Experimental.AcceleratedDHTClient true