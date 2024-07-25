use data::Warehouse;
use graphql::Context;
use log::debug;
use warp::Filter;
#[cfg(not(debug_assertions))]
use rust_embed::RustEmbed;
use data::{WAREHOUSE, CONFIG};


mod elastic;
mod data;
mod graphql;
mod rest;
mod config;

#[tokio::main]
async fn main() {
    env_logger::init();


    #[cfg(not(debug_assertions))]
    #[derive(RustEmbed)]
    #[folder = "../frontal/out"]
    struct App;

    #[cfg(debug_assertions)]
    {
        #[allow(dead_code)]
        struct App;
    }

    debug!("Loading config...");

    let config = config::read_config().unwrap();

    CONFIG.set(config.clone()).unwrap();

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
            .and(warp::path("graphql"))
            .and(juniper_warp::make_graphql_filter(schema.clone(), warp::any().map(|| Context::new()))
        )
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

    let warehouse = Warehouse::new(&config.elastic.url).await;

    debug!("Starting refresh loop...");
    let warehouse = std::sync::Arc::new(tokio::sync::RwLock::new(warehouse));
    Warehouse::start_refresh(warehouse.clone()).await;
    WAREHOUSE.set(warehouse).unwrap();


    debug!("Starting server...");

    let cors = warp::cors()
        .allow_any_origin()
        .allow_methods(vec!["GET", "POST", "DELETE", "PUT", "OPTIONS"])
        .allow_headers(vec!["content-type", "authorization"])
        .max_age(3600);

    #[cfg(not(debug_assertions))]
    {
        warp::serve(routes.or(graphql).or(
            warp_embed::embed(&App)
        ).with(cors))
            .run(([0, 0, 0, 0], config.port))
            .await;
    }

    #[cfg(debug_assertions)]
    {
        warp::serve(routes.or(graphql).with(cors))
            .run(([0, 0, 0, 0], config.port))
            .await;
    }
}
