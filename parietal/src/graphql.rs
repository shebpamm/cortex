use juniper::{
    graphql_object, EmptyMutation, EmptySubscription, FieldResult,
};

use std::sync::Arc;
use tokio::sync::RwLock;

use crate::config;

pub struct Context {
    warehouse: Arc<RwLock<crate::data::Warehouse>>,
}
impl Context {
    pub(crate) fn new() -> Self {
        Self { 
            warehouse: crate::data::WAREHOUSE.get().unwrap().clone(),
        }
    }
}

impl juniper::Context for Context {}

pub struct Query;

#[graphql_object]
#[graphql_object(context = Context)]
impl Query {
    fn api_version() -> &'static str {
        "1.0"
    }

    fn config() -> &'static config::UiConfig {
        &crate::data::CONFIG.get().unwrap().ui
    }

    async fn health(
        context: &Context,
    ) -> FieldResult<crate::elastic::ClusterInfo> {
        Ok(context.warehouse.read().await.cluster.read().await.clone())
    }

    async fn indices(
        context: &Context,
    ) -> FieldResult<Vec<crate::elastic::IndexInfo>> {
        Ok(context.warehouse.read().await.indices.read().await.clone())
    }

    async fn recovery(
        context: &Context,
    ) -> FieldResult<crate::elastic::Recovery> {
        Ok(context.warehouse.read().await.recovery.read().await.clone())
    }

    async fn relocating(
        context: &Context,
    ) -> FieldResult<Vec<crate::elastic::ShallowShard>> {
        let shards = context.warehouse.read().await.shards.read().await.clone();
        let unassigned = shards.into_iter().filter(|s| s.state != "STARTED").collect();
        Ok(unassigned)
    }

    async fn nodes(
        context: &Context,
    ) -> FieldResult<crate::elastic::NodeOutput> {
        Ok(context.warehouse.read().await.nodes.read().await.clone())
    }

    async fn shards(
        index: Option<String>,
        context: &Context,
    ) -> FieldResult<Vec<crate::elastic::ShallowShard>> {
        let collected: Vec<crate::elastic::ShallowShard>;

        match index {
            Some(index) => {
                let shards = context.warehouse.read().await.shards.read().await.clone();
                collected = shards.into_iter().filter(|s| s.index == index).collect();
            }
            None => {
                let shards = context.warehouse.read().await.shards.read().await.clone();
                collected = shards.into_iter().collect();
            }
        }

        Ok(collected)
    }
}

type Schema = juniper::RootNode<'static, Query, EmptyMutation<Context>, EmptySubscription<Context>>;

pub fn schema() -> Schema {
    Schema::new(Query, EmptyMutation::new(), EmptySubscription::new())
}
