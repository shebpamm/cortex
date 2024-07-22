use std::collections::HashMap;
use bigdecimal::BigDecimal;
use serde::{Deserialize, Deserializer, Serialize};
use anyhow::Result;
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
    pub index: String,
    pub shard: String,
    pub prirep: String,
    pub state: String,
    pub docs: Option<String>,
    pub store: Option<String>,
    pub ip: Option<String>,
    pub node: Option<String>,
}

#[derive(GraphQLObject, Serialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeOutput {
    pub nodes: Vec<NodeInfo>,
}

impl<'de> Deserialize<'de> for NodeOutput {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Debug, Deserialize)]
        struct RawNodeOutput {
            nodes: HashMap<String, NodeInfo>,
        }

        let raw_node_output = RawNodeOutput::deserialize(deserializer)?;

        // Convert HashMap<String, NodeInfo> to Vec<NodeInfo>
        let nodes: Vec<NodeInfo> = raw_node_output.nodes.into_iter().map(|(_, v)| v).collect();

        Ok(NodeOutput { nodes })
    }
}


#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeInfo {
    name: String,
    transport_address: String,
    host: String,
    ip: String,
    roles: Vec<String>,
    attributes: NodeAttributes,
    process: NodeProcess,
    fs: NodeFileSystem,
    os: NodeOS,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeOS {
    mem: NodeOSMemory,
    swap: NodeOSMemory,
    cpu: NodeCpu,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeProcess {
    timestamp: BigDecimal,
    cpu: NodeCpu,
    mem: NodeProcessMemory,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeCpu {
    pub percent: i32,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeFileSystem {
    pub total: NodeFSTotal,
    #[serde(alias = "io_stats")]
    pub stats: NodeFSStats,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeFSTotal {
    pub total_in_bytes: BigDecimal,
    free_in_bytes: BigDecimal,
    available_in_bytes: BigDecimal,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeFSStats {
    total: NodeFSStatsTotal,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeFSStatsTotal {
    pub operations: BigDecimal,
    pub read_operations: BigDecimal,
    pub write_operations: BigDecimal,
    pub read_kilobytes: BigDecimal,
    pub write_kilobytes: BigDecimal,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeProcessMemory {
    total_virtual_in_bytes: BigDecimal,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeOSMemory {
    total_in_bytes: BigDecimal,
    free_in_bytes: BigDecimal,
    used_in_bytes: BigDecimal,
    free_percent: Option<i32>,
    used_percent: Option<i32>,
}

#[derive(GraphQLObject, Serialize, Deserialize, Debug, Clone, TS)]
#[ts(export)]
pub struct NodeAttributes {
    storage_type: Option<String>,
    #[serde(alias = "ml.machine_memory")]
    machine_memory: String,
    datacenter: Option<String>,
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
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<ClusterInfo, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(cluster_info) => Ok(cluster_info),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn indices(&self) -> Result<Vec<IndexInfo>> {
        let url = format!("{}/_cat/indices?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Vec<IndexInfo>, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(indices) => Ok(indices),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn recovery(&self) -> Result<Recovery> {
        let url = format!("{}/_recovery?format=json&active_only=true", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Recovery, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(recovery) => Ok(recovery),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn shards(&self) -> Result<Vec<ShallowShard>> {
        let url = format!("{}/_cat/shards?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<Vec<ShallowShard>, _> = serde_path_to_error::deserialize(jd);

        match result {
            Ok(shards) => Ok(shards),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }

    pub async fn nodes(&self) -> Result<NodeOutput> {
        let url = format!("{}/_nodes/stats/fs,process,os?format=json", self.base_url);
        let response = self.client.get(&url).send().await?.text().await?;
        let jd = &mut serde_json::Deserializer::from_str(&response);

        let result: Result<NodeOutput, _> = serde_path_to_error::deserialize(jd);
        
        match result {
            Ok(nodes) => Ok(nodes),
            Err(e) => Err(anyhow::anyhow!(e)),
        }
    }
}
