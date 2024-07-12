use std::collections::HashMap;
use bigdecimal::BigDecimal;
use log::{debug, trace};
use serde::{Deserialize, Deserializer, Serialize};
use anyhow::Result;
use serde_json::Value;
use ts_rs::TS;
use std::fmt;
use juniper::{
    GraphQLObject,
};

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[graphql(description = "Basic cluster information, such as health and status")]
#[ts(export)]
pub struct ClusterInfo {
    cluster_name: String,
    status: String,
    timed_out: bool,
    number_of_nodes: i32,
    number_of_data_nodes: i32,
    active_primary_shards: i32,
    active_shards: i32,
    relocating_shards: i32,
    initializing_shards: i32,
    unassigned_shards: i32,
    delayed_unassigned_shards: i32,
    number_of_pending_tasks: i32,
    number_of_in_flight_fetch: i32,
    task_max_waiting_in_queue_millis: i32,
    active_shards_percent_as_number: f64,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct IndexInfo {
    health: String,
    status: String,
    index: String,
    uuid: String,
    pri: String,
    rep: String,
    #[serde(alias = "docs.count")]
    docs_count: String,
    #[serde(alias = "docs.deleted")]
    docs_deleted: String,
    #[serde(alias = "store.size")]
    store_size: String,
    #[serde(alias = "pri.store.size")]
    pri_store_size: String,
}

#[derive(GraphQLObject, Serialize, Debug, Clone)]
pub struct Recovery {
    indices: Vec<IndexRecovery>
}

impl<'de> Deserialize<'de> for Recovery {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct RecoveryVisitor;

        impl<'de> serde::de::Visitor<'de> for RecoveryVisitor {
            type Value = Recovery;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a map of index recoveries")
            }

            fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
            where
                M: serde::de::MapAccess<'de>,
            {
                let mut indices = Vec::new();

                while let Some((key, mut value)) = access.next_entry::<String, IndexRecovery>()? {
                    value.id = key;
                    indices.push(value);
                }
                Ok(Recovery { indices })
            }

            
        }

        deserializer.deserialize_map(RecoveryVisitor)
    }
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct IndexRecovery {
    #[serde(skip)]
    id: String,
    shards: Vec<RecoveryShard>,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct RecoveryShard {
    #[serde(alias = "type")]
    shard_type: String,
    stage: String,
    primary: bool,
    start_time_in_millis: BigDecimal,
    total_time_in_millis: BigDecimal,
    source: NodeTargetInfo,
    target: NodeTargetInfo,
    index: TransportIndexInfo,
    translog: TranslogInfo,
    verify_index: VerifyIndexInfo,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct NodeTargetInfo {
    id: String,
    host: String,
    transport_address: String,
    ip: String,
    name: String,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct TransportIndexInfo {
    size: SizeInfo,
    files: FilesInfo,
    total_time_in_millis: i32,
    source_throttle_time_in_millis: i32,
    target_throttle_time_in_millis: i32,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct SizeInfo {
    total_in_bytes: BigDecimal,
    reused_in_bytes: BigDecimal,
    recovered_in_bytes: BigDecimal,
    recovered_from_snapshot_in_bytes: BigDecimal,
    percent: String, // This can sometimes be a string like "18.2%"
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct FilesInfo {
    total: i32,
    reused: i32,
    recovered: i32,
    percent: String, // This can sometimes be a string like "91.6%"
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct TranslogInfo {
    recovered: i32,
    total: i32,
    percent: String, // This can sometimes be a string like "100.0%"
    total_on_start: i32,
    total_time_in_millis: i32,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
struct VerifyIndexInfo {
    check_index_time_in_millis: i32,
    total_time_in_millis: i32,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct ShallowShard {
    index: String,
    shard: String,
    prirep: String,
    pub state: String,
    docs: Option<String>,
    store: Option<String>,
    ip: String,
    node: String,
}

#[derive(GraphQLObject, Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeOutput {
    pub nodes: Vec<NodeInfo>,
}

impl <'de> Deserialize<'de> for NodeOutput {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        struct NodeOutputVisitor;

        impl<'de> serde::de::Visitor<'de> for NodeOutputVisitor {
            type Value = NodeOutput;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str("a map of nodes")
            }

            fn visit_map<M>(self, mut access: M) -> Result<Self::Value, M::Error>
            where
                M: serde::de::MapAccess<'de>,
            {
                let mut nodes = Vec::new();

                while let Some((key, mut value)) = access.next_entry::<String, Value>()? {
                        if key != "nodes" { continue };

                        let nodes_map = serde_json::from_value::<HashMap<String, NodeInfo>>(value);
                        debug!("Key: {:?}", key);
                        debug!("Nodes map: {:?}", nodes_map);
                        if let Ok(nodes_map) = nodes_map {
                            for (_, node_info) in nodes_map {
                                nodes.push(node_info);
                            }
                    }
                }

                debug!("Nodes: {:?}", nodes);

                Ok(NodeOutput { nodes })
            }
        }

        deserializer.deserialize_map(NodeOutputVisitor)
    }
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeInfo {
    name: String,
    transport_address: String,
    host: String,
    ip: String,
    version: String,
    build_flavor: String,
    build_type: String,
    build_hash: String,
    total_indexing_buffer: BigDecimal,
    roles: Vec<String>,
}

#[derive(Debug)]
pub struct ElasticsearchClient {
    client: reqwest::Client,
    base_url: String,
}

impl ElasticsearchClient {
    pub fn new(base_url: &str) -> Self {
        ElasticsearchClient {
            client: reqwest::Client::new(),
            base_url: base_url.to_string(),
        }
    }

    pub async fn health(&self) -> Result<ClusterInfo> {
        let url = format!("{}/_cluster/health", self.base_url);
        let response = self.client.get(&url).send().await?;
        let info = serde_json::from_str(&response.text().await?)?;
        Ok(info)
    }

    pub async fn indices(&self) -> Result<Vec<IndexInfo>> {
        let url = format!("{}/_cat/indices?format=json", self.base_url);
        let response = self.client.get(&url).send().await?;
        let indices = response.text().await?;
        let indices: Vec<IndexInfo> = serde_json::from_str(&indices)?;

        Ok(indices)
    }

    pub async fn recovery(&self) -> Result<Recovery> {
        let url = format!("{}/_recovery?format=json&active_only=true", self.base_url);
        let response = self.client.get(&url).send().await?;
        let recovery = response.text().await?;
        let recovery: Recovery = serde_json::from_str(&recovery)?;

        Ok(recovery)
    }

    pub async fn shards(&self) -> Result<Vec<ShallowShard>> {
        let url = format!("{}/_cat/shards?format=json", self.base_url);
        let response = self.client.get(&url).send().await?;
        let shards = response.text().await?;
        let shards: Vec<ShallowShard> = serde_json::from_str(&shards)?;

        Ok(shards)
    }

    pub async fn nodes(&self) -> Result<NodeOutput> {
        let url = format!("{}/_nodes?format=json", self.base_url);
        let response = self.client.get(&url).send().await?;
        let nodes = response.text().await?;
        let nodes: NodeOutput = serde_json::from_str(&nodes)?;

        Ok(nodes)
    }
}
