const DEMO_CLUSTER_HEALTH: &str = include_str!("../../.data/_cluster_health.json");
const DEMO_CAT_INDICES: &str = include_str!("../../.data/_cat_indices.json");
const DEMO_RECOVERY: &str = include_str!("../../.data/_recovery.json");
const DEMO_CAT_SHARDS: &str = include_str!("../../.data/_cat_shards.json");
const DEMO_NODES: &str = include_str!("../../.data/_nodes.json");

pub const DEMO_DATA : &[(&str, &str)] = &[
    ("_cluster/health", DEMO_CLUSTER_HEALTH),
    ("_cat/indices?format=json", DEMO_CAT_INDICES),
    ("_recovery?format=json&active_only=true", DEMO_RECOVERY),
    ("_cat/shards?format=json", DEMO_CAT_SHARDS),
    ("_nodes/stats/fs,process,os?format=json", DEMO_NODES),
];
