use juniper::{
    graphql_object, EmptyMutation, EmptySubscription, FieldResult, GraphQLEnum, GraphQLInputObject, GraphQLObject, ScalarValue,
};

use std::sync::Arc;
use tokio::sync::RwLock;

pub struct Context {
    warehouse: Arc<RwLock<crate::data::Warehouse>>,
}
impl Context {
    pub(crate) fn new() -> Self {
        Self { warehouse: crate::data::WAREHOUSE.get().unwrap().clone() }
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
}

type Schema = juniper::RootNode<'static, Query, EmptyMutation<Context>, EmptySubscription<Context>>;

pub fn schema() -> Schema {
    Schema::new(Query, EmptyMutation::new(), EmptySubscription::new())
}
