use data::Warehouse;
use graphql::Context;
use log::debug;
use warp::Filter;
use data::WAREHOUSE;


mod elastic;
mod data;
mod graphql;
mod rest;

#[tokio::main]
async fn main() {
    env_logger::init();

    debug!("Building REST routes...");

    let routes = rest::build_routes();

    debug!("Building GraphQL routes...");

    let schema = std::sync::Arc::new(graphql::schema());
    let graphql =
    warp::post()
        .and(warp::path("graphql"))
        .and(juniper_warp::make_graphql_filter(schema.clone(), warp::any().map(|| Context::new()))
    )
        .or(warp::get()
            .and(warp::path("playground"))
            .and(juniper_warp::playground_filter("/graphql", None))
        )
        .or(warp::get()
            .and(warp::path("graphiql"))
            .and(juniper_warp::graphiql_filter("/graphql", None))
        );


    debug!("Building initial ES state...");

    let warehouse = Warehouse::new("http://localhost:9200").await;

    debug!("Starting refresh loop...");
    let warehouse = std::sync::Arc::new(tokio::sync::RwLock::new(warehouse));
    Warehouse::start_refresh(warehouse.clone());
    WAREHOUSE.set(warehouse).unwrap();

    debug!("Starting server...");
    warp::serve(routes.or(graphql))
        .run(([127, 0, 0, 1], 3030))
        .await;
}
